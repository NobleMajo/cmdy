import "mocha"
import "chai"
import { parseCmd, CmdDefinition, Flag, getProcessArgs } from '../index';
import { expect } from "chai"

export type AllTypes = "string" | "number" | "object" |
    "instance" | "function" | "class" | "array" | "null" |
    "undefined" | "symbol" | "bigint" | "boolean"

export function getType(any: any): AllTypes {
    const type = typeof any
    if (type == "object") {
        if (any == null) {
            return "null"
        } else if (Array.isArray(any)) {
            return "array"
        } else if (
            any.constructor &&
            typeof any.constructor.name == "string" &&
            any.constructor.name != "Object"
        ) {
            return "instance"
        }
    }
    return type
}

describe('base cmd tests', () => {
    let exec: boolean
    const simpleCmd: CmdDefinition = {
        name: "simple",
        description: "A simple test command!",
        exe: async (cmd) => { exec = true }
    }

    it("cmd", async () => {
        exec = false
        let res = parseCmd({
            cmd: simpleCmd,
            args: [],
        })

        expect(exec).is.false
        res = await res.exe()

        expect(res).is.not.undefined
        expect(res.err).is.undefined
        expect(exec).is.true

        expect(res.flags).is.not.undefined
        expect(getType(res.flags)).is.equals("array")
        expect(res.flags.length).is.equals(0)

        expect(res.valueFlags).is.not.undefined
        expect(getType(res.valueFlags)).is.equals("object")
        expect(Object.keys(res.valueFlags).length).is.equals(0)
    })

    const requireCmd: CmdDefinition = {
        name: "test",
        description: "some test command",
        flags: [
            {
                name: "path",
                description: "some path flag",
                required: true,
                types: ["string"],
            }
        ]
    }

    it("test flags args", async () => {
        exec = false

        const test: Flag = {
            name: "test",
            description: "A test flag",
        }

        const qwer: Flag = {
            name: "qwer",
            description: "A qwer flag",
        }

        const qwe1: Flag = {
            name: "qwe1",
            description: "A qwe1 flag",
            types: ["string"]
        }

        const qwe2: Flag = {
            name: "qwe2",
            description: "A qwe2 flag",
            types: ["string"]
        }

        simpleCmd.flags = [
            test,
            qwer,
            qwe1,
            qwe2
        ]

        let res = parseCmd({
            cmd: simpleCmd,
            args: ["--qwe1", "test", "--test"]
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res.args.length).is.equals(0)
        expect(res.err).is.undefined

        expect(res.flags.includes("test")).is.true
        expect(res.flags.includes("qwer")).is.false

        expect(res.valueFlags.qwe1).is.not.undefined
        expect(res.valueFlags.qwe2).is.not.undefined
        expect(res.valueFlags.qwe1.length).is.equals(1)
        expect(res.valueFlags.qwe2.length).is.equals(0)

        expect(res.valueFlags.qwe1[0]).is.equals("test")
    })

    it("dont allow unknown args", async () => {
        exec = false

        const test: Flag = {
            name: "test",
            description: "A test flag",
        }

        const qwer: Flag = {
            name: "qwer",
            description: "A qwer flag",
        }

        const qwe1: Flag = {
            name: "qwe1",
            description: "A qwe1 flag",
            types: ["string"]
        }

        const qwe2: Flag = {
            name: "qwe2",
            description: "A qwe2 flag",
            types: ["string"]
        }

        simpleCmd.flags = [
            test,
            qwer,
            qwe1,
            qwe2
        ]
        simpleCmd.allowUnknownArgs = false

        let res = parseCmd({
            cmd: simpleCmd,
            args: ["--qwe1", "test", "ddd", "--test", "asdasd"]
        })

        expect(typeof res.err).is.equals("object")
        expect(res.args.length).is.equals(0)
        expect(res.err.message).is.equals('Unknown command argument: "ddd"')
    })

    it("allow unknown args", async () => {
        exec = false

        const test: Flag = {
            name: "test",
            description: "A test flag",
        }

        const qwer: Flag = {
            name: "qwer",
            description: "A qwer flag",
        }

        const qwe1: Flag = {
            name: "qwe1",
            description: "A qwe1 flag",
            types: ["string"]
        }

        const qwe2: Flag = {
            name: "qwe2",
            description: "A qwe2 flag",
            types: ["string"]
        }

        simpleCmd.flags = [
            test,
            qwer,
            qwe1,
            qwe2
        ]
        simpleCmd.allowUnknownArgs = true

        let res = parseCmd({
            cmd: simpleCmd,
            args: ["--qwe1", "test", "ddd", "--test", "asdasd"]
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res.args.length).is.equals(2)
        expect(res.err).is.undefined

        expect(res.flags.includes("test")).is.true
        expect(res.flags.includes("qwer")).is.false

        expect(res.valueFlags.qwe1).is.not.undefined
        expect(res.valueFlags.qwe2).is.not.undefined
        expect(res.valueFlags.qwe1.length).is.equals(1)
        expect(res.valueFlags.qwe2.length).is.equals(0)

        expect(res.valueFlags.qwe1[0]).is.equals("test")
    })

    it("allow just args", async () => {
        exec = false

        const test: Flag = {
            name: "test",
            description: "A test flag",
        }

        const qwer: Flag = {
            name: "qwer",
            description: "A qwer flag",
        }

        const qwe1: Flag = {
            name: "qwe1",
            description: "A qwe1 flag",
            types: ["string"]
        }

        const qwe2: Flag = {
            name: "qwe2",
            description: "A qwe2 flag",
            types: ["string"]
        }

        simpleCmd.flags = [
            test,
            qwer,
            qwe1,
            qwe2
        ]
        simpleCmd.allowUnknownArgs = true

        let res = parseCmd({
            cmd: simpleCmd,
            args: ["qwe1", "test", "ddd", "test", "asdasd"]
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res.args.length).is.equals(5)
        expect(res.err).is.undefined

        expect(res.flags.includes("test")).is.false
        expect(res.flags.includes("qwer")).is.false

        expect(res.valueFlags.qwe1).is.not.undefined
        expect(res.valueFlags.qwe2).is.not.undefined
        expect(res.valueFlags.qwe1.length).is.equals(0)
        expect(res.valueFlags.qwe2.length).is.equals(0)
    })

    it("require test", async () => {
        let res = parseCmd({
            cmd: requireCmd,
            args: ["--path", "/test/wow/home"],
        })

        expect(typeof res).is.equals("object")
        expect(res.err).is.undefined
        expect(typeof res.cmd).is.equals("object")
        expect(typeof res.valueFlags).is.equals("object")
        expect(typeof res.valueFlags.path).is.equals("object")
        expect(Array.isArray(res.valueFlags.path)).is.true
        expect(typeof res.valueFlags.path[0]).is.equals("string")
    })

    it("require error", async () => {
        let res = parseCmd({
            cmd: requireCmd,
            args: [],
        })

        expect(typeof res).is.equals("object")
        expect(typeof res.err).is.equals("object")
        expect(res.err.message).is.equals("Flag 'path' is required but not set!")
    })

    it("get process args method", async () => {
        expect(JSON.stringify(getProcessArgs())).is.equals(
            JSON.stringify([
                "--require",
                "ts-node/register",
                "src/test/**/*.test.ts"
            ])
        )
    })
})
