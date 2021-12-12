exports = module.exports = parseCmd
export default exports

export class CmdError extends Error {
    constructor(
        msg: string
    ) {
        super(msg)
    }
}

export interface InputValidator {
    name: string,
    validate: (value: any) => Promise<any | undefined>
}

export type FlagValueTypes = "string" | "number" | "boolean" | InputValidator

export interface Flag {
    name: string,
    description: string,
    required?: boolean,
    default?: string | number | boolean,
    types?: FlagValueTypes[]
    shorthand?: string,
    alias?: string[],
    control?: (value: string) => Promise<string>
}

export interface CmdDefinition {
    name: string,
    description: string,
    cmds?: CmdDefinition[],
    allowUnknownArgs?: boolean,
    details?: string | undefined,
    alias?: string[],
    flags?: Flag[],
    group?: string | undefined,
    exe?: (cmd: CmdResult) => Promise<void>,
}

export interface ValueFlags {
    [key: string]: string[]
}

export interface CmdResult {
    cmd: CmdDefinition,
    args: string[],
    flags: string[]
    valueFlags: ValueFlags
    parents: [CmdDefinition, ...CmdDefinition[]],
    settings: CmdParserSettings,
    exe: () => Promise<CmdResult>,
    help: boolean,
    emptyCmd: boolean,
    meta: { [key: string]: any },
    msg?: string,
    err?: CmdError | any,
}

export function getProcessArgs(): string[] {
    const args = [...process.argv]
    while (args.length > 0) {
        if (!args[0].includes("/") && !args[0].includes("\\")) {
            break
        }
        args.shift()
    }
    return args
}

export const defaultCmdDefinitionSettings = {
    cmds: [],
    allowUnknownArgs: false,
    details: undefined,
    alias: [],
    flags: [],
    group: undefined,
}

export function fillCmdDefinitionRecursive(
    cmd: CmdDefinition,
    globalFlags: Flag[],
    helpFlag: Flag
): CmdDefinition {
    const cmd2: CmdDefinition = {
        ...defaultCmdDefinitionSettings,
        ...cmd
    }
    cmd2.flags = [
        ...globalFlags,
        ...cmd2.flags,
        helpFlag
    ]

    cmd2.cmds = cmd2.cmds.map(
        (subCmd: CmdDefinition) => fillCmdDefinitionRecursive(
            subCmd,
            globalFlags,
            helpFlag
        )
    )
    return cmd2
}

export const helpFlag: Flag = {
    name: "help",
    description: "Shows this help output",
    shorthand: "h",
}

export interface CmdParserOptions {
    cmd: CmdDefinition,
    args?: string[],
    helpWords?: string[],
    globalFlags?: Flag[]
    globalHelpMsg?: string | undefined,
    helpGeneratorFunction?: HelpGenerator,
    helpFlag?: Flag
}

export interface CmdParserSettings extends CmdParserOptions {
    helpWords: string[],
    globalFlags: Flag[]
    globalHelpMsg: string | undefined,
    helpGeneratorFunction: HelpGenerator,
    helpFlag: Flag
}

export const defaultCmdParserSettings: CmdParserSettings = {
    cmd: {} as any,
    args: getProcessArgs(),
    helpWords: ["-h", "--help"],
    globalFlags: [],
    globalHelpMsg: undefined,
    helpGeneratorFunction: defaultHelpGenerator,
    helpFlag: helpFlag
}

export function parseCmd(
    options: CmdParserOptions
): CmdResult {
    const settings: CmdParserSettings = {
        ...defaultCmdParserSettings,
        ...options,
    }
    settings.cmd = fillCmdDefinitionRecursive(
        settings.cmd,
        settings.globalFlags,
        settings.helpFlag
    )
    if (
        settings.args.length > 0 &&
        settings.args[0] == settings.cmd.name
    ) {
        settings.args.shift()
    }
    const res: CmdResult = {
        cmd: settings.cmd,
        args: [],
        flags: [],
        valueFlags: {},
        parents: [settings.cmd],
        settings: settings,
        err: undefined,
        exe: undefined as any,
        meta: {},
        help: false,
        emptyCmd: false,
    }

    let flagsSet: boolean = false

    // create value flags arrays
    for (let index2 = 0; index2 < res.cmd.flags.length; index2++) {
        const flag = res.cmd.flags[index2]
        if (!res.valueFlags[flag.name]) {
            res.valueFlags[flag.name] = []
        }
    }

    try {
        // parse flags to 
        for (let index2 = 0; index2 < res.cmd.flags.length; index2++) {
            const flag = res.cmd.flags[index2]
            flag.name = flag.name.toLowerCase()
            if (
                flag.alias &&
                Array.isArray(flag.alias) &&
                flag.alias.length > 0
            ) {
                flag.alias = flag.alias.map((a) => a.toLowerCase())
            }
        }

        for (let index = 0; index < settings.args.length; index++) {
            const arg: string = settings.args[index]
            const lowerArg: string = arg.toLowerCase()
            if (arg == "") {
                continue
            } else if (
                lowerArg == "--help" ||
                lowerArg == "-h"
            ) {
                if (!res.flags.includes("help")) {
                    res.flags.push("help")
                }
            } else if (arg.startsWith("--")) {
                flagsSet = true
                let flagName: string = arg.substring(2).toLowerCase()
                let flagValue: string = ""
                const equalIndex: number = flagName.indexOf("=")
                if (equalIndex != -1) {
                    flagValue = flagName.substring(equalIndex + 1)
                    flagName = flagName.substring(0, equalIndex)
                }
                let found: boolean = false
                for (let index2 = 0; index2 < res.cmd.flags.length; index2++) {
                    const flag = res.cmd.flags[index2]
                    if (
                        flag.name.toLowerCase() == flagName ||
                        (flag.alias && flag.alias.includes(flagName)
                        )
                    ) {
                        if (
                            flag.types &&
                            flag.types.length > 0
                        ) {
                            if (
                                flagValue.length == 0 &&
                                index + 1 < settings.args.length
                            ) {
                                flagValue = settings.args[index + 1]
                                index++
                            }
                            if (flagValue.length == 0) {
                                throw new CmdError("Missing value for flag: \"--" + flag.name + "\"")
                            }
                            if (flagValue.startsWith("\"")) {
                                while (true) {
                                    let next: string = settings.args[index + 1]
                                    flagValue += " " + next
                                    index++
                                    if (next.endsWith("\"")) {
                                        break
                                    }
                                }
                                flagValue = flagValue.slice(1, -1)
                            }
                            let value: any = undefined
                            let tmp: any = flagValue.toLowerCase()
                            if (flag.types.includes("boolean")) {
                                if (tmp == "true") {
                                    value = true
                                } else if (tmp == "false") {
                                    value = false
                                }
                            }
                            if (flag.types.includes("number")) {
                                tmp = Number(flagValue)
                                if (tmp != NaN) {
                                    value = flagValue
                                }
                            }
                            if (flag.types.includes("string")) {
                                value = flagValue
                            }
                            flag.types.forEach((type) => {
                                if (typeof type == "string") {
                                    return
                                }
                                value = type.validate(flagValue)
                            })
                            if (value == undefined) {
                                throw new CmdError(
                                    "Type of '" + flag.name + "' needs to be a '" +
                                    flag.types.map(
                                        (t) => typeof t == "string" ? t : t.name
                                    ).join("', '") + "'!"
                                )
                            }
                            res.valueFlags[flag.name].push(value)
                        } else {
                            if (flagValue.length > 0) {
                                throw new CmdError("Too many values for flag: \"--" + flag.name + "\"")
                            }
                            if (!res.flags.includes(flag.name)) {
                                res.flags.push(flag.name)
                            }
                        }
                        found = true
                        break
                    }
                }
                if (!found) {
                    throw new CmdError("Unknown flag: \"--" + flagName + "\"")
                }
            } else if (arg.startsWith("-")) {
                flagsSet = true
                const shorthands: string[] = arg.substring(1).split("")
                for (let index2 = shorthands.length - 1; index2 >= 0; index2--) {
                    const shorthand = shorthands[index2]
                    let found: boolean = false
                    for (let index3 = 0; index3 < res.cmd.flags.length; index3++) {
                        const flag = res.cmd.flags[index3];
                        if (
                            flag.shorthand &&
                            flag.shorthand == shorthand
                        ) {
                            settings.args = [
                                ...settings.args.slice(0, index + 1),
                                "--" + flag.name,
                                ...settings.args.slice(index + 1)
                            ]
                            found = true
                            break
                        }
                    }
                    if (!found) {
                        throw new CmdError("Unknown shorthand flag: \"-" + shorthand + "\"")
                    }
                }
                settings.args = [
                    ...settings.args.slice(0, index),
                    ...settings.args.slice(index + 1)
                ]
                index--
            } else {
                const argName = arg.toLowerCase()
                let found: boolean = false
                for (let index = 0; res.cmd.cmds && index < res.cmd.cmds.length; index++) {
                    const cmd = res.cmd.cmds[index]

                    if (
                        cmd.name == argName ||
                        (
                            cmd.alias &&
                            cmd.alias.includes(argName)
                        )
                    ) {
                        if (flagsSet) {
                            throw new CmdError(
                                "You can't set flags before the defined argument: \"" +
                                cmd.name +
                                "\""
                            )
                        }
                        res.cmd = cmd
                        res.parents.push(cmd)
                        found = true
                        break
                    }
                }
                if (
                    !found &&
                    !res.cmd.allowUnknownArgs
                ) {
                    throw new CmdError("Unknown command argument: \"" + arg + "\"")
                }
                res.args.push(arg)
            }
        }

        for (let index = 0; index < res.cmd.flags.length; index++) {
            const flag = res.cmd.flags[index]
            if (
                flag.types &&
                !Object.keys(res.valueFlags).includes(flag.name)
            ) {
                const type = typeof flag.default
                if (
                    type == "string" ||
                    type == "number" ||
                    type == "boolean"
                ) {
                    res.valueFlags[flag.name] = ["" + flag.default]
                } else if (flag.required) {
                    throw new CmdError("Flag '" + flag.name + "' is required but not set!")
                }
            } else if (
                !res.flags.includes(flag.name)
            ) {
                const type = typeof flag.default
                if (
                    type == "string" ||
                    type == "number" ||
                    type == "boolean"
                ) {
                    res.valueFlags[flag.name] = ["" + flag.default]
                } else if (flag.required) {
                    throw new CmdError("Flag '" + flag.name + "' is required but not set!")
                }
            }
        }
    } catch (err) {
        res.err = err
    }

    res.exe = res.err ? (() => { throw res.err }) : res.exe
    res.emptyCmd = res.cmd.exe ? false : true
    res.help = res.emptyCmd || res.flags.includes("help")

    if (res.help || res.emptyCmd) {
        return settings.helpGeneratorFunction(res)
    }
    res.exe = async () => {
        res.cmd.exe(res)
        return res
    }
    return res
}

// ##### ##### ##### ##### ##### HelpGenerator ##### ##### ##### ##### #####

export type HelpGenerator = (
    data: CmdResult,
) => CmdResult

export function defaultHelpGenerator(
    data: CmdResult,
): CmdResult {
    let message: string = "# " + data.cmd.name.toUpperCase() + " #"
    message += "\n\nUsage: " + data.parents.map((a) => a.name).join(" ")

    if (data.cmd.flags.length > 0) {
        message += " [OPTIONS]"
    }

    if (data.cmd.cmds && data.cmd.cmds.length > 0) {
        message += " COMMAND"
    }

    if (data.cmd.allowUnknownArgs) {
        message += " [ARGUMENTS]"
    }

    message += "\n\n" + data.cmd.description

    if (data.cmd.flags.length > 0) {
        message += "\n\nOptions:\n"
        const options: string[] = []
        let biggest: number = 0
        for (let index = 0; index < data.cmd.flags.length; index++) {
            const flag = data.cmd.flags[index]
            let flagMsg: string
            if (flag.shorthand) {
                flagMsg = "  -" + flag.shorthand + ", --" + flag.name
            } else {
                flagMsg = "      --" + flag.name
            }
            if (flag.types && flag.types.length > 0) {
                flagMsg += " [" + flag.types.map((t) => typeof t == "string" ? t : t.name).join(" | ") + "]"
            }
            if (flagMsg.length > biggest) {
                biggest = flagMsg.length
            }
            options.push(flagMsg)
        }
        for (let index = 0; index < options.length; index++) {
            while (options[index].length <= biggest) {
                options[index] += " "
            }
            options[index] += data.cmd.flags[index].description
        }
        message += options.join("\n")
    }

    if (data.cmd.cmds && data.cmd.cmds.length > 0) {
        const groups: {
            [key: string]: CmdDefinition[]
        } = {
            "default": []
        }

        data.cmd.cmds.forEach((cmd) => {
            const group: string = cmd.group ?? "default"
            if (!groups[group]) {
                groups[group] = []
            }
            groups[group].push(cmd)
        })

        const keys = Object.keys(groups).reverse()
        for (let index = 0; index < keys.length; index++) {
            const group = keys[index]
            const groupCmds = groups[group]
            const formatedGroupName = group == "default" ? "" : group.substring(0, 1).toUpperCase() + group.substring(1) + " "
            message += "\n\n" + formatedGroupName + "Commands:\n"
            const commands: string[] = []
            let biggest: number = 7
            for (let index2 = 0; index2 < groupCmds.length; index2++) {
                const cmdName = groupCmds[index2].name
                if (cmdName.length > biggest) [
                    biggest = cmdName.length
                ]
                commands.push(cmdName)
            }
            for (let index2 = 0; index2 < commands.length; index2++) {
                while (commands[index2].length <= biggest) {
                    commands[index2] += " "
                }
                commands[index2] += groupCmds[index2].description
            }
            message += commands.join("\n")
        }
    }

    if (data.cmd.details && data.help) {
        message += "\n\nDetails:\n" + data.cmd.details
    } else {
        message += "\n\nRun '" + data.parents.map((a) => a.name).join(" ") + " --help' for more informations on a command."
    }

    if (data.settings.globalHelpMsg) {
        message += "\n\n" + data.settings.globalHelpMsg
    }

    data.msg = message
    data.exe = async () => {
        console.info(message)
        return data
    }

    return data
}
