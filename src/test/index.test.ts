import "mocha"
import "chai"
import { parseCmd, CmdDefinition, Flag } from "../index"
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

    it("cmd with args infront", async () => {
        exec = false
        let res = parseCmd({
            cmd: simpleCmd,
            args: ["simple", "asdasd", "adsd", "test"],
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res).is.not.undefined
        expect(res.flags).is.not.undefined
        expect(getType(res.flags)).is.equals("array")
        expect(res.flags.length).is.equals(0)

        expect(res.valueFlags).is.not.undefined
        expect(getType(res.valueFlags)).is.equals("object")
        expect(Object.keys(res.valueFlags).length).is.equals(0)
    })

    it("cmd without args infront", async () => {
        exec = false
        let res = parseCmd({
            cmd: simpleCmd,
            args: ["asdasd", "adsd", "test"],
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res).is.not.undefined
        expect(res.flags).is.not.undefined
        expect(getType(res.flags)).is.equals("array")
        expect(res.flags.length).is.equals(0)
    })

    it("cmd flag tests", async () => {
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
            args: ["asdasd", "adsd", "--qwe1", "test", "--test"]
        })

        expect(exec).is.false
        res = await res.exe()
        expect(exec).is.true

        expect(res.flags.includes("test")).is.true
        expect(res.flags.includes("qwer")).is.false

        expect(res.valueFlags.qwe1).is.not.undefined
        expect(res.valueFlags.qwe2).is.not.undefined
        expect(res.valueFlags.qwe1.length).is.equals(1)
        expect(res.valueFlags.qwe2.length).is.equals(0)

        expect(res.valueFlags.qwe1[0]).is.equals("test")
    })
})
