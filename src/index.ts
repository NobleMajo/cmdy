import { addAbortSignal } from "stream"

export class CmdError extends Error {
    constructor(
        msg: string
    ) {
        super(msg)
    }
}

export interface Flag {
    name: string,
    description: string,
    required?: boolean,
    default?: string | number | boolean,
    types?: ("string" | "number" | "boolean")[]
    shorthand?: string,
    alias?: string[],
    control?: (value: string) => Promise<string>
}

export interface CmdDefinition {
    name: string,
    description: string,
    cmds?: CmdDefinition[],
    allowUnknownArgs?: boolean,
    details?: string,
    alias?: string[],
    flags?: Flag[],
    group?: string,
    exe?: (cmd: CmdResult) => Promise<void>,
}

export interface RootCmdDefinition extends CmdDefinition {
    globalFlags?: Flag[]
    globalHelpMsg?: string
}

export interface ValueFlags {
    [key: string]: string[]
}

export interface CmdData {
    cmd: string,
    args: string[],
    flags: string[]
    valueFlags: ValueFlags
}

export interface ParserResult {
    type: "error" | "help" | "cmd",
    exe: () => Promise<void>
}

export interface CmdResult extends ParserResult {
    type: "cmd",
    def: CmdDefinition,
    data: CmdData,
    parents: [RootCmdDefinition, ...CmdDefinition[]],
}

export interface HelpResult extends ParserResult {
    type: "help",
    msg: string
}

export interface ErrorResult extends ParserResult {
    type: "error",
    error: Error | any
}

export function getCurrentProcessCmd(): string[] {
    const args = [...process.argv]
    while (args.length > 0) {
        if (!args[0].includes("/") && !args[0].includes("\\")) {
            break
        }
        args.shift()
    }
    return [
        "fleetform",
        ...args
    ]
}

export function parseCmd(
    rootCmdDefinition: RootCmdDefinition,
    rawCmd: string | string[] = getCurrentProcessCmd(),
    helpGenerator: HelpGenerator = defaultHelpGenerator
): ParserResult {
    let splitted: string[] = typeof rawCmd == "string" ? rawCmd.split(" ") : rawCmd
    let flagsSet: boolean = false
    let currentCmd: CmdDefinition = rootCmdDefinition
    let parents: [RootCmdDefinition, ...CmdDefinition[]] = [rootCmdDefinition]
    let flags: Flag[] = [
        ...(currentCmd.flags ?? []),
        ...(rootCmdDefinition.globalFlags ?? [])
    ]

    const cmdData: CmdData = {
        cmd: splitted.shift(),
        args: [],
        flags: [],
        valueFlags: {}
    }

    for (let index2 = 0; index2 < flags.length; index2++) {
        const flag = flags[index2]
        if (!cmdData.valueFlags[flag.name]) {
            cmdData.valueFlags[flag.name] = []
        }
    }

    for (let index2 = 0; index2 < flags.length; index2++) {
        const flag = flags[index2]
        if (flag.alias && Array.isArray(flag.alias) && flag.alias.length > 0) {
            flag.alias = flag.alias.map((a) => a.toLowerCase())
        }
        if (flag.shorthand) {
            flag.shorthand = flag.shorthand.toLowerCase()
        }
    }

    for (let index = 0; index < splitted.length; index++) {
        const arg = splitted[index]
        if (arg == "") {
            continue
        } else if (arg.toLowerCase() == "--help" || arg.toLowerCase() == "-h") {
            if (!cmdData.flags.includes("help")) {
                cmdData.flags.push("help")
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
            for (let index2 = 0; index2 < flags.length; index2++) {
                const flag = flags[index2]
                if (flag.name.toLowerCase() == flagName || (flag.alias && flag.alias.includes(flagName))) {
                    if (flag.types && flag.types.length > 0) {
                        if (flagValue.length == 0 && index + 1 < splitted.length) {
                            flagValue = splitted[index + 1]
                            index++
                        }
                        if (flagValue.length == 0) {
                            throw new CmdError("Missing value for flag: \"--" + flag.name + "\"")
                        }
                        if (flagValue.startsWith("\"")) {
                            while (true) {
                                let next: string = splitted[index + 1]
                                flagValue += " " + next
                                index++
                                if (next.endsWith("\"")) {
                                    break
                                }
                            }
                            flagValue = flagValue.slice(1, -1)
                        }
                        cmdData.valueFlags[flag.name].push(
                            flagValue
                        )
                    } else {
                        if (flagValue.length > 0) {
                            throw new CmdError("Too many values for flag: \"--" + flag.name + "\"")
                        }
                        if (!cmdData.flags.includes(flag.name)) {
                            cmdData.flags.push(flag.name)
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
                for (let index3 = 0; index3 < flags.length; index3++) {
                    const flag = flags[index3];
                    if (flag.shorthand && flag.shorthand == shorthand) {
                        splitted = [
                            ...splitted.slice(0, index + 1),
                            "--" + flag.name,
                            ...splitted.slice(index + 1)
                        ]
                        found = true
                        break
                    }
                }
                if (!found) {
                    throw new CmdError("Unknown shorthand flag: \"-" + shorthand + "\"")
                }
            }
            splitted = [
                ...splitted.slice(0, index),
                ...splitted.slice(index + 1)
            ]
            index--
        } else {
            const argName = arg.toLowerCase()
            let found: boolean = false
            for (let index = 0; currentCmd.cmds && index < currentCmd.cmds.length; index++) {
                const CmdDefinition = currentCmd.cmds[index]
                if (CmdDefinition.name == argName || (CmdDefinition.alias && CmdDefinition.alias.includes(argName))) {
                    if (flagsSet) {
                        throw new CmdError("You can't set flags befor the defined argument: \"" + CmdDefinition.name + "\"")
                    }
                    currentCmd = CmdDefinition
                    parents.push(CmdDefinition)
                    flags = [
                        ...(currentCmd.flags ?? []),
                        ...(rootCmdDefinition.globalFlags ?? [])
                    ]
                    found = true
                    break
                }
            }
            if (!found && !currentCmd.allowUnknownArgs) {
                throw new CmdError("Unknown command argument: \"" + arg + "\"")
            }
            cmdData.args.push(arg)
        }
    }

    for (let index = 0; index < currentCmd.flags.length; index++) {
        const flag = currentCmd.flags[index]

        if (
            flag.types &&
            !Object.keys(cmdData.valueFlags).includes(flag.name)
        ) {
            const type = typeof flag.default
            if (
                type == "string" ||
                type == "number" ||
                type == "boolean"
            ) {
                cmdData.valueFlags[flag.name] = ["" + flag.default]
            } else if (flag.required) {
                throw new Error("Flag '" + flag.name + "' is required but not set!")
            }
        } else if (
            !cmdData.flags.includes(flag.name)
        ) {
            const type = typeof flag.default
            if (
                type == "string" ||
                type == "number" ||
                type == "boolean"
            ) {
                cmdData.valueFlags[flag.name] = ["" + flag.default]
            } else if (flag.required) {
                throw new Error("Flag '" + flag.name + "' is required but not set!")
            }
        }
    }

    if (cmdData.flags.includes("help")) {
        return helpGenerator(currentCmd, parents, true)
    } else if (!currentCmd.exe) {
        return helpGenerator(currentCmd, parents, false)
    } else {
        const data: CmdResult = {
            type: "cmd",
            def: currentCmd,
            data: cmdData,
            parents: parents,
            exe: () => currentCmd.exe(data)
        }
        return data
    }
}

// ##### ##### ##### ##### ##### HelpGenerator ##### ##### ##### ##### #####

export type HelpGenerator = (arg: CmdDefinition, cmdStack: [RootCmdDefinition, ...CmdDefinition[]], help: boolean) => HelpResult

export function defaultHelpGenerator(cmd: CmdDefinition, cmdStack: [RootCmdDefinition, ...CmdDefinition[]], help: boolean): HelpResult {
    const rootCmd = cmdStack[0]

    const flags: Flag[] = [
        ...(rootCmd.globalFlags ?? []),
        ...(cmd.flags ?? [])
    ]

    let message: string = "# " + rootCmd.name.toUpperCase() + " #"
    message += "\n\nUsage: " + cmdStack.map((a) => a.name).join(" ")

    if (flags.length > 0) {
        message += " [OPTIONS]"
    }

    if (cmd.cmds && cmd.cmds.length > 0) {
        message += " COMMAND"
    }

    if (cmd.allowUnknownArgs) {
        message += " [ARGUMENTS]"
    }

    message += "\n\n" + cmd.description

    flags.push({
        name: "help",
        shorthand: "h",
        description: "Show the command help dialog."
    })

    if (flags.length > 0) {
        message += "\n\nOptions:\n"
        const options: string[] = []
        let biggest: number = 0
        for (let index = 0; index < flags.length; index++) {
            const flag = flags[index]
            let flagMsg: string
            if (flag.shorthand) {
                flagMsg = "  -" + flag.shorthand + ", --" + flag.name
            } else {
                flagMsg = "      --" + flag.name
            }
            if (flag.types && flag.types.length > 0) {
                flagMsg += " [" + flag.types.join(" | ") + "]"
            }
            if (flagMsg.length > biggest) [
                biggest = flagMsg.length
            ]
            options.push(flagMsg)
        }
        for (let index = 0; index < options.length; index++) {
            while (options[index].length <= biggest) {
                options[index] += " "
            }
            options[index] += flags[index].description
        }
        message += options.join("\n")
    }

    if (cmd.cmds && cmd.cmds.length > 0) {
        const groups: {
            [key: string]: CmdDefinition[]
        } = {
            "default": []
        }

        cmd.cmds.forEach((cmd) => {
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

    if (cmd.details && help) {
        message += "\n\nDetails:\n" + cmd.details
    } else {
        message += "\n\nRun '" + cmdStack.map((a) => a.name).join(" ") + " --help' for more informations on a command."
    }

    if (rootCmd.globalHelpMsg) {
        message += "\n\n" + rootCmd.globalHelpMsg
    }

    return {
        type: "help",
        msg: message,
        exe: async () => console.info(message)
    }
}