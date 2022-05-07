import { promises as fs, Stats } from "fs"

exports = module.exports = parseCmd
export default exports

export type Awaitable<T> = Promise<T> | PromiseLike<T> | T

export class CmdError extends Error {
    constructor(
        msg: string
    ) {
        super(msg)
    }
}

export interface InputValidator {
    name: string,
    validate: (value: any) => Awaitable<any | undefined>
}

export type FlagValueTypes = "string" | "number" | "boolean" | InputValidator

export interface Flag {
    name: string,
    description: string,
    displayName?: string,
    required?: boolean,
    default?: string | number | boolean,
    types?: FlagValueTypes[]
    shorthand?: string,
    alias?: string[],
    control?: (value: string) => Awaitable<string>,
    exe?: (cmd: CmdResult, value?: string) => Awaitable<void>,
    exePriority?: number,
}

export interface BoolFlag extends Flag {
    types?: undefined
    control?: undefined,
    default?: undefined,
    required?: undefined,
    exe?: (cmd: CmdResult) => Awaitable<void>,
}

export interface ValueFlag extends Flag {
    types: FlagValueTypes[]
    exe?: (cmd: CmdResult, value: string) => Awaitable<void>,
}

export type DefinedFlag = BoolFlag | ValueFlag

export interface CmdDefinition {
    name: string,
    description: string,
    displayName?: string,
    cmds?: CmdDefinition[],
    allowUnknownArgs?: boolean,
    allowUnknownFlags?: boolean,
    details?: string | undefined,
    alias?: string[],
    flags?: DefinedFlag[],
    group?: string | undefined,
    exe?: (cmd: CmdResult) => Awaitable<void>,
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
    exe: () => Awaitable<CmdResult>,
    helpResult: boolean,
    meta: { [key: string]: any },
    msg?: string,
    err?: CmdError | any,
    exeFlags: Flag[],
    exeValueFlags: [string, Flag][]
}

export function anyToString(value: any): string {
    if (typeof value == "object") {
        if (value == null) {
            return "NULL"
        }
        let v: string
        try {
            v = JSON.stringify(value)
        } catch (err) {
        }
        if (
            typeof v == "string" &&
            v.length > 0
        ) {
            return v
        }
        v = "" + value
        if (
            typeof v == "string" &&
            v.length > 0
        ) {
            return v
        }
        return "{}"
    } else {
        return "" + value
    }
}

export interface StartArgs {
    nodePath: string,
    appPath: string,
    args: string[]
}

export function getProcessArgs(): StartArgs {
    return {
        nodePath: process.argv[0],
        appPath: process.argv[1],
        args: process.argv.slice(2)
    }
}

export const defaultCmdDefinitionSettings = {
    cmds: [],
    allowUnknownArgs: false,
    allowUnknownFlags: false,
    details: undefined,
    alias: [],
    flags: [],
    group: undefined,
}

export function fillCmdDefinitionRecursive(
    cmd: CmdDefinition,
    globalFlags: DefinedFlag[],
    helpFlag: DefinedFlag
): CmdDefinition {
    const cmd2: CmdDefinition = {
        ...defaultCmdDefinitionSettings,
        ...cmd,
        name: cmd.name.toLowerCase(),
        alias: cmd.alias ?
            cmd.alias.map((a) => a.toLowerCase()) :
            []
    }
    cmd2.flags = [
        ...globalFlags,
        ...cmd2.flags,
        helpFlag
    ].map((f) => {
        f.name = f.name.toLowerCase()
        f.alias = f.alias ? f.alias.map((a) => a.toLowerCase()) : []
        return f
    })

    cmd2.cmds = cmd2.cmds.map(
        (subCmd: CmdDefinition) => fillCmdDefinitionRecursive(
            subCmd,
            globalFlags,
            helpFlag
        )
    )
    return cmd2
}

export const helpFlag: BoolFlag = {
    name: "help",
    description: "Shows this help output",
    shorthand: "h",
}

export interface CmdParserOptions {
    cmd: CmdDefinition,
    args?: string[],
    helpWords?: string[],
    globalFlags?: DefinedFlag[]
    globalHelpMsg?: string | undefined,
    helpGeneratorFunction?: HelpGenerator,
    helpFlag?: DefinedFlag
}

export interface CmdParserSettings extends CmdParserOptions {
    helpWords: string[],
    globalFlags: DefinedFlag[]
    globalHelpMsg: string | undefined,
    helpGeneratorFunction: HelpGenerator,
    helpFlag: DefinedFlag
}

export const defaultCmdParserSettings: CmdParserSettings = {
    cmd: {} as any,
    args: getProcessArgs().args,
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
    let restArgs = settings.args
    if (
        restArgs.length > 0 &&
        restArgs[0] == settings.cmd.name
    ) {
        restArgs.shift()
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
        helpResult: false,
        exeFlags: [],
        exeValueFlags: [],
    }

    while (restArgs.length > 0) {
        const arg = restArgs[0]
        const lowerArg = arg.toLowerCase()
        let found: boolean = false
        for (const cmd of res.cmd.cmds) {
            if (
                cmd.name == lowerArg ||
                (
                    cmd.alias &&
                    cmd.alias.includes(lowerArg)
                )
            ) {
                restArgs.shift()
                res.cmd = cmd
                found = true
                break
            }
        }
        if (!found) {
            break
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

        for (let index = 0; index < restArgs.length; index++) {
            const arg: string = restArgs[index]
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
                                index + 1 < restArgs.length
                            ) {
                                flagValue = restArgs[index + 1]
                                index++
                            }
                            if (flagValue.length == 0) {
                                throw new CmdError(
                                    "Missing value for flag: \"--" +
                                    flag.name + "\""
                                )
                            }
                            if (flagValue.startsWith("\"")) {
                                while (true) {
                                    let next: string = restArgs[index + 1]
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
                            if (
                                !value &&
                                flag.types.includes("number")
                            ) {
                                tmp = Number(flagValue)
                                if (!isNaN(tmp)) {
                                    value = flagValue
                                }
                            }
                            if (
                                !value &&
                                flag.types.includes("string")
                            ) {
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
                                    "Type of '" + flag.name +
                                    "' needs to be a '" +
                                    flag.types.map(
                                        (t) => typeof t == "string" ?
                                            t :
                                            t.name
                                    ).join("', '") + "'!"
                                )
                            }
                            if (!res.valueFlags[flag.name]) {
                                res.valueFlags[flag.name] = []
                            }
                            res.valueFlags[flag.name].push(value)
                            if (flag.exe) {
                                res.exeValueFlags.push([value, flag])
                            }
                        } else {
                            if (flagValue.length > 0) {
                                throw new CmdError(
                                    "Too many values for flag: \"--" +
                                    flag.name + "\""
                                )
                            }
                            if (!res.flags.includes(flag.name)) {
                                res.flags.push(flag.name)
                                if (flag.exe) {
                                    res.exeFlags.push(flag)
                                }
                            }
                        }
                        found = true
                        break
                    }
                }
                if (!found) {
                    if (res.cmd.allowUnknownFlags) {
                        res.args.push(arg)
                        continue
                    }
                    throw new CmdError(
                        "Unknown flag: \"--" + flagName + "\""
                    )
                }
            } else if (arg.startsWith("-")) {
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
                            restArgs = [
                                ...restArgs.slice(0, index + 1),
                                "--" + flag.name,
                                ...restArgs.slice(index + 1)
                            ]
                            found = true
                            break
                        }
                    }
                    if (!found) {
                        if (res.cmd.allowUnknownFlags) {
                            res.args.push(arg)
                            continue
                        }
                        throw new CmdError(
                            "Unknown shorthand flag: \"-" + shorthand +
                            "\""
                        )
                    }
                }
                restArgs = [
                    ...restArgs.slice(0, index),
                    ...restArgs.slice(index + 1)
                ]
                index--
            } else {
                if (!res.cmd.allowUnknownArgs) {
                    throw new CmdError(
                        "Unknown command argument: \"" + arg + "\""
                    )
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
                    throw new CmdError(
                        "Flag '" + flag.name +
                        "' is required but not set!"
                    )
                }
            } else if (
                !res.flags.includes(flag.name) &&
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
                    throw new CmdError(
                        "Flag '" + flag.name +
                        "' is required but not set!"
                    )
                }
            }
        }
    } catch (err: CmdError | any) {
        res.err = err
        res.exe = async () => {
            console.error(
                err instanceof CmdError ?
                    "Cmdy" + err.message :
                    "UnknownError | " + (err.stack ?? err)
            )
            return res
        }
    }
    res.cmd.flags.forEach((f) => {
        if (!Array.isArray(f.types)) {
            return
        }
        if (!res.valueFlags[f.name]) {
            res.valueFlags[f.name] = []
        }
    })
    res.exeFlags = res.exeFlags.sort(
        (a, b) => (a.exePriority ?? 0) - (b.exePriority ?? 0)
    )
    res.exeValueFlags = res.exeValueFlags.sort(
        (a, b) => (a[1].exePriority ?? 0) - (b[1].exePriority ?? 0)
    )
    if (!res.cmd.exe) {
        settings.helpGeneratorFunction(res)
    } else if (!res.err) {
        if (res.flags.includes("help")) {
            settings.helpGeneratorFunction(res)
        } else {
            res.exe = async () => {
                for (const flag of res.exeFlags) {
                    await flag.exe(res)
                }
                for (const flag of res.exeValueFlags) {
                    await flag[1].exe(res, flag[0])
                }
                res.cmd.exe(res)
                return res
            }
        }
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
    data.helpResult = true
    let message: string = "# " + data.cmd.name.toUpperCase() + " #"

    !data.cmd.exe && (
        message += "\n\nERROR: Command " +
        data.cmd.name +
        " not directly executeable!"
    )

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

    if (data.cmd.details && data.flags.includes("help")) {
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
