import cmdy, { Flag, parseCmd, CmdDefinition } from "../src/index"

const force: Flag = {
    name: "force",
    description: "The force flag",
}

const publish: Flag = {
    name: "publish",
    description: "The publish flag",
    shorthand: "p",
    types: ["string"]
}

const volume: Flag = {
    name: "volume",
    description: "The volume flag",
    shorthand: "v",
    types: ["string"]
}

const removeF: Flag = {
    name: "remove",
    description: "The remove flag",
    alias: ["rm"],
}

const verbose: Flag = {
    name: "verbose",
    description: "The verbose flag",
    shorthand: "V",
}

const version: Flag = {
    name: "version",
    description: "The verbose flag",
    alias: ["v", "ve", "ver", "vers", "versi", "versio"],
    shorthand: "v",
}

const run: CmdDefinition = {
    name: "run",
    description: "The run command",
    group: "management",
    flags: [
        removeF,
        publish,
        volume
    ],
    allowUnknownArgs: true,
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const start: CmdDefinition = {
    name: "start",
    description: "The start command",
    group: "management",
    flags: [
        removeF
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const create: CmdDefinition = {
    name: "create",
    description: "The create command",
    group: "management",
    flags: [
        volume,
        publish,
        removeF
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const remove: CmdDefinition = {
    name: "remove",
    description: "The remove command",
    group: "management",
    flags: [
        force
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const stop: CmdDefinition = {
    name: "stop",
    description: "The stop command",
    group: "management",
    flags: [
        force
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const search: CmdDefinition = {
    name: "search",
    description: "The search command",
    flags: [
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const wait: CmdDefinition = {
    name: "wait",
    description: "The wait command",
    flags: [
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const events: CmdDefinition = {
    name: "events",
    description: "The wait command",
    flags: [
    ],
    exe: async (res) => console.log("cmd: ", res.cmd.name + "\nres-data:\n", res.data)
}

const root: CmdDefinition = {
    name: "docker",
    description: "The root docker command",
    cmds: [
        run,
        start,
        stop,
        create,
        remove,
        events,
        wait,
        search
    ]
}

const res = parseCmd({
    cmd: root,
    globalFlags: [
        verbose,
        version
    ]
})

res.exe()