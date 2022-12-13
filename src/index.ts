import { type } from "os"


export type ValueOverwriteFunc = (v: any) => void
export type TypeCheckFunc = (v: any, typeOf: string, overwirte: ValueOverwriteFunc) => undefined | string
export type MultiTypeDef = TypeCheckFunc[] | TypeCheckFunc


export namespace Types {
    export const STRING: TypeCheckFunc = (value, typeOf, overwirte) => {
        if (typeOf == "string") {
            return null
        }
        switch (typeOf) {
            case "boolean":
            case "number":
                overwirte("" + value)
            case "string":
                return null
        }
        return "Value of type '" + typeOf + "' is not a string"
    }

    export const NUMBER: TypeCheckFunc = (value, typeOf, overwirte) => {
        switch (typeOf) {
            case "number":
                return null
            case "string":
                const value2 = Number(value)
                if (!isNaN(value2)) {
                    overwirte(value2)
                    return null
                }
                return "Value is not a valid number: '" + (value as string).substring(0, 16) + "'"
        }
        return "Value of type '" + typeOf + "' is not a number"
    }

    export const BOOLEAN: TypeCheckFunc = (value, typeOf, overwirte) => {
        switch (typeOf) {
            case "boolean":
                return null
            case "string":
                let value2 = value.toLowerCase()
                while (
                    value2.startsWith(" ") ||
                    value2.startsWith("_") ||
                    value2.startsWith("-") ||
                    value2.startsWith(".") ||
                    value2.startsWith(":") ||
                    value2.startsWith(",")
                ) {
                    value2 = value2.substring(1)
                }
                while (
                    value2.endsWith(" ") ||
                    value2.endsWith("_") ||
                    value2.endsWith("-") ||
                    value2.endsWith(".") ||
                    value2.endsWith(":") ||
                    value2.endsWith(",")
                ) {
                    value2 = value2.slice(0, -1)
                }
                if (value2.length > 0) {
                    switch (value2.toLowerCase()) {
                        case "yes":
                        case "ye":
                        case "y":
                        case "true":
                        case "tru":
                        case "tr":
                        case "t":
                        case "1":
                        case "on":
                        case "do":
                            overwirte(true)
                            return null
                        case "no":
                        case "n":
                        case "false":
                        case "fals":
                        case "fal":
                        case "fa":
                        case "f":
                        case "0":
                        case "off":
                        case "dont":
                            overwirte(false)
                            return null
                    }
                }
                return "Value is not a valid boolean: '" + (value as string).substring(0, 16) + "'"
        }
        return "Value of type '" + typeOf + "' is not a boolean"
    }

    export const NULL: TypeCheckFunc = (value, typeOf) => {
        if (
            value == null ||
            value == "null"
        ) {
            return null
        }
        return "Value of type '" + typeOf + "' is not null"
    }

    export const UNDEFINED: TypeCheckFunc = (value, typeOf) => {
        if (value == undefined) {
            return null
        }
        return "Value of type '" + typeOf + "' is not undefined"
    }

    export function OBJECT(
        keyDef: undefined | {
            [key: string]: MultiTypeDef
        },
        wildcardKeys?: MultiTypeDef,
    ): TypeCheckFunc {
        return (value, typeOf, overwirte) => {
            if (typeOf == "string") {
                try {
                    value = JSON.parse(value)
                    overwirte(value)
                } catch (err) {
                }
            }
            if (Array.isArray(value)) {
                return "Value is an array and not an object"
            } else if (value == null) {
                return "Value is null and not an object"
            }
            const keys = Object.keys(value)
            if (keyDef) {
                const keyDefKeys = Object.keys(keyDef)
                for (const keyDefKey of keyDefKeys) {
                    const typeChecks = keyDef[keyDefKey]
                    if (Array.isArray(typeChecks)) {
                        for (const check of typeChecks) {

                        }
                    }
                    value[keyDefKey]
                }
            }
        }

    }

    export type TypeCheckRes = [false, ...string[]] | [true, any]

    export function isTypeOf(
        value: any,
        typeChecks: MultiTypeDef,
    ): TypeCheckRes {
        let cached = value
        const overwrite = (value: any): void => {
            cached = value
        }
        if (Array.isArray(typeChecks)) {
            for (const typeCheckFunc of typeChecks) {
                
            }
        } else {

        }
    }
}

export const test = {
    verbose: TypeId.BOOLEAN,
    port: TypeId.NUMBER,
    hostMap: Types.OBJECT(
        undefined,
        [TypeId.STRING, TypeId.NUMBER],
    ),
    cert: Types.OBJECT(
        {
            key: TypeId.STRING,
            cert: TypeId.STRING,
            ca: TypeId.STRING,
        },
    ),
    test: Types.ARRAY(
        TypeId.STRING,
        TypeId.NUMBER
    ),
}

/*
export type TypeCheckFunction = (v: any) => null | string
export type SettingsTypeIp =
    TypeId.STRING | TypeId.NUMBER |
    TypeId.BOOLEAN | TypeId.OBJECT |
    TypeId.ARRAY | TypeId.OWN

export interface BaseTypeSettings {
    type: SettingsTypeIp
    check?: TypeCheckFunction
}

export interface OwnTypeSettings extends BaseTypeSettings {
    type: TypeId.OWN,
    baseType: TypeDef,
    def?: any,
}

export interface StringTypeSettings extends BaseTypeSettings {
    type: TypeId.STRING,
    startsWith?: string,
    endsWith?: string,
    minLength?: number,
    maxLength?: number,
    regex?: RegExp,
    def?: string,
}

export interface NumberTypeSettings extends BaseTypeSettings {
    type: TypeId.NUMBER,
    min?: number,
    max?: number,
    minDecimalPlaces?: number,
    maxDecimalPlaces?: number,
    decimalPlaces?: number,
    minIntegerPlaces?: number,
    maxIntegerPlaces?: number,
    integerPlaces?: number,
    def?: number,
}

export interface BooleanTypeSettings extends BaseTypeSettings {
    type: TypeId.BOOLEAN,
    def?: boolean,
}

export interface ObjectTypeSettings<V extends TypeDef, K extends GenObject<TypeDef>> extends BaseTypeSettings {
    type: TypeId.OBJECT
    keyValues?: K,
    values?: V,
    def?: {
        [key: string]: RealTypeOf<V>
    } & {
        [key in keyof K]: RealTypeOf<K[key]>
    }
}

export interface ArrayTypeSettings<V extends TypeDef> extends BaseTypeSettings {
    type: TypeId.ARRAY,
    values?: V,
    def?: RealTypeOf<V>[]
}

export type TypeSettings =
    StringTypeSettings | NumberTypeSettings |
    BooleanTypeSettings | ObjectTypeSettings<any, any> |
    ArrayTypeSettings<any> | OwnTypeSettings

export type SingleTypeDef =
    TypeId.STRING | TypeId.NUMBER |
    TypeId.BOOLEAN | TypeId.NULL |
    TypeSettings
export type MultiTypeDef = [SingleTypeDef, ...SingleTypeDef[]]
export type TypeDef = MultiTypeDef | SingleTypeDef | TypeId.ANY

export type RealIdType<T extends TypeId> =
    (
        T extends TypeId.STRING ?
        string :
        never
    ) | (
        T extends TypeId.NUMBER ?
        number :
        never
    ) | (
        T extends TypeId.BOOLEAN ?
        boolean :
        never
    ) | (
        T extends TypeId.NULL ?
        null :
        never
    ) | (
        T extends TypeId.ANY ?
        any :
        never
    )

export type RealSettingsType<T extends TypeSettings> =
    (
        T extends StringTypeSettings ?
        string :
        never
    ) | (
        T extends NumberTypeSettings ?
        number :
        never
    ) | (
        T extends BooleanTypeSettings ?
        boolean :
        never
    ) | (
        T extends ArrayTypeSettings<any> ?
        RealTypeOf<T["values"]>[] :
        never
    ) | (
        T extends ObjectTypeSettings<any, any> ?
        {
            [key: string]: RealTypeOf<T["values"]>
        } & {
            [key in keyof T["keyValues"]]: RealTypeOf<T["keyValues"][key]>
        } :
        never
    )

export type AnyRealTypeOf<T> =
    T extends TypeSettings ?
    RealSettingsType<T> :
    T extends TypeId ?
    RealIdType<T> :
    never

export type RealTypeOf<T> =
    T extends MultiTypeDef ?
    AnyRealTypeOf<T[number]> :
    AnyRealTypeOf<T>

export interface Config {
    [key: string]: TypeDef
}

export type RealConfig<C extends Config> = {
    [key in keyof C]: RealTypeOf<C[key]>
}

export type MostlyRealConfig<C extends Config> = {
    [key in keyof C]: RealTypeOf<C[key]>
}

export type ConfigErrors<C extends Config> = {
    [key in keyof C]?: string
}

export type ConfigParseResult<C extends Config> = {
    errors: ConfigErrors<C>
    values: MostlyRealConfig<C>
} | {
    errors: undefined
    values: RealConfig<C>
}

export function parseConfig<C extends Config>(
    value: {
        [key: string]: any
    },
    config: C,
): ConfigParseResult<C> {
    const res: ConfigParseResult<C> = {
        errors: undefined,
        values: {} as any,
    }
    for (const key of getKeysOfObj(config)) {
        try {
            res.values[key] = checkType(
                getKeyOfObj(value, key as string),
                config[key]
            )
        } catch (err: string | Error | unknown) {
            if (typeof err == "string") {
                if (!res.errors) {
                    res.errors = {}
                }
                res.errors[key] = err
            }
        }
    }
    return res
}

export type TypeCheckRes = {
    err: false,
    value: any
} | {
    err: true,
    msg: string
}

export function collectCheckType(
    value: any,
    def: TypeDef,
): TypeCheckRes {
    try {
        return {
            err: false,
            value: checkType(
                value, def
            )
        }
    } catch (err: string | Error | unknown) {
        if (typeof err == "string") {
            return {
                err: true,
                msg: err
            }
        }
        throw err
    }
}

export function checkType(
    value: any,
    def: TypeDef,
): any {
    let msg: string | null
    if (Array.isArray(def)) {
        const defs = def.sort((a, b) => {
            const at = typeof a
            const bt = typeof b
            if (at != bt) {
                if (at == "number") {
                    return -1
                } else {
                    return 1
                }
            }
            if (at == "object") {
                if ((a as TypeSettings).type > (b as TypeSettings).type) {
                    return -1
                } else {
                    return 1
                }
            }
            if (a > b) {
                return -1
            } else {
                return 1
            }
        })
        for (const def of defs) {
            msg = checkType(value, def)
            if (msg == null) {
                return value
            }
        }
        throw msg
    } else if (typeof def == "object") {
        if (typeof value == "undefined") {
            return def.def
        }
        switch (def.type) {
            case TypeId.STRING:
                if (typeof value != "string") {
                    throw "value(" + (typeof value) + ") is not a string"
                }
                if (def.minLength < def.maxLength) {
                    const min = def.maxLength
                    def.maxLength = def.minLength
                    def.minLength = min
                }
                if (
                    def.minLength &&
                    value.length <= def.minLength
                ) {
                    throw "string value length (" + value.length + ") " +
                    "is smaler then the minimum value (" + def.minLength + ")"
                }
                if (
                    def.maxLength &&
                    value.length >= def.maxLength
                ) {
                    throw "string value length (" + value.length + ") " +
                    "is bigger then the maximum value " + def.maxLength
                }
                if (
                    def.startsWith &&
                    !value.startsWith(def.startsWith)
                ) {
                    throw "string value starts not with '" + def.startsWith + "'"
                }
                if (
                    def.endsWith &&
                    !value.endsWith(def.endsWith)
                ) {
                    throw "string value ends not with '" + def.endsWith + "'"
                }
                if (def.regex && def.regex.test(value)) {
                    throw "string value does not match the regular expression: '" + def.regex.source + "'"
                }
                break
            case TypeId.NUMBER:
                if (typeof value != "number") {
                    throw "value(" + (typeof value) + ") is not a number"
                }
                if (
                    def.min &&
                    def.max &&
                    def.min < def.max
                ) {
                    const min = def.max
                    def.max = def.min
                    def.min = min
                }
                if (value < def.min) {
                    throw "number value (" + value + ") is smaller then minimum value (" + def.min + ")"
                }
                if (value > def.max) {
                    throw "number value (" + value + ") is bigger then maximum value (" + def.max + ")"
                }
                if (
                    typeof def.minDecimalPlaces == "number" ||
                    typeof def.maxDecimalPlaces == "number" ||
                    typeof def.decimalPlaces == "number" ||
                    typeof def.minIntegerPlaces == "number" ||
                    typeof def.minIntegerPlaces == "number" ||
                    typeof def.integerPlaces == "number"
                ) {
                    let value2 = "" + value
                    if (!value2.includes(".")) {
                        value2 += ".0"
                    }
                    const [integer, decimal] = value2.split(".")
                    const intPlaces = integer == "0" ? 0 : integer.length
                    const decPlaces = decimal == "0" ? 0 : decimal.length
                    if (
                        typeof def.decimalPlaces == "number" &&
                        decPlaces != def.decimalPlaces
                    ) {
                        throw "number of decimal places must be a exact " +
                        def.decimalPlaces + " and not " + decPlaces
                    }
                    if (
                        typeof def.integerPlaces == "number" &&
                        intPlaces != def.integerPlaces
                    ) {
                        throw "number of integer places must be a exact " +
                        def.integerPlaces + " and not " + intPlaces
                    }

                    if (
                        typeof def.minDecimalPlaces == "number" &&
                        typeof def.maxDecimalPlaces == "number" &&
                        def.minDecimalPlaces > def.maxDecimalPlaces
                    ) {
                        const min = def.maxDecimalPlaces
                        def.maxDecimalPlaces = def.minDecimalPlaces
                        def.minDecimalPlaces = min
                    }
                    if (
                        typeof def.minDecimalPlaces == "number" &&
                        decPlaces >= def.minDecimalPlaces
                    ) {
                        throw "number of decimal places must be a minimum " +
                        def.decimalPlaces + " and not " + decPlaces
                    }
                    if (
                        typeof def.maxDecimalPlaces == "number" &&
                        decPlaces <= def.maxDecimalPlaces
                    ) {
                        throw "number of decimal places must be a maximum " +
                        def.decimalPlaces + " and not " + decPlaces
                    }
                    if (
                        typeof def.minIntegerPlaces == "number" &&
                        typeof def.maxIntegerPlaces == "number" &&
                        def.minIntegerPlaces > def.maxIntegerPlaces
                    ) {
                        const min = def.maxIntegerPlaces
                        def.maxIntegerPlaces = def.minIntegerPlaces
                        def.minIntegerPlaces = min
                    }
                    if (
                        typeof def.minIntegerPlaces == "number" &&
                        intPlaces >= def.minIntegerPlaces
                    ) {
                        throw "number of integer places must be a minimum " +
                        def.integerPlaces + " and not " + intPlaces
                    }
                    if (
                        typeof def.maxIntegerPlaces == "number" &&
                        intPlaces <= def.maxIntegerPlaces
                    ) {
                        throw "number of integer places must be a maximum " +
                        def.integerPlaces + " and not " + intPlaces
                    }
                }
                break
            case TypeId.BOOLEAN:
                if (typeof value != "boolean") {
                    throw "value(" + (typeof value) + ") is not a boolean"
                }
                break
            case TypeId.ARRAY:
                if (
                    typeof value != "object" ||
                    !Array.isArray(value) &&
                    value == null
                ) {
                    throw "value(" + (typeof value) + ") is not an array"
                }
                for (let i = 0; i < value.length; i++) {
                    msg = checkType(value[i], def.values)
                    if (msg != null) {
                        if (!msg.startsWith("[")) {
                            msg = ": " + msg
                        }
                        throw "[" + i + "]: " + msg
                    }
                }
                break
            case TypeId.OBJECT:
                if (
                    typeof value != "object" ||
                    Array.isArray(value) &&
                    value == null
                ) {
                    throw "value(" + (typeof value) + ") is not an object"
                }
                const keys = Object.keys(value)
                for (let i = 0; i < keys.length; i++) {
                    msg = checkType(value[keys[i]], def.values)
                    if (msg != null) {
                        if (!msg.startsWith("[")) {
                            msg = ": " + msg
                        }
                        throw "[" + keys[i] + "]: " + msg
                    }
                }
                break
            case TypeId.OWN:
                msg = checkType(value, def.baseType)
                if (msg != null) {
                    throw msg
                }
                break
        }
        if (def.check) {
            def.check(value)
        }
        return value
    } else {
        switch (def) {
            case TypeId.STRING:
                if (typeof value != "string") {
                    throw "value(" + (typeof value) + ") is not a string"
                }
                break
            case TypeId.NUMBER:
                if (typeof value != "number") {
                    throw "value(" + (typeof value) + ") is not a number"
                }
                break
            case TypeId.BOOLEAN:
                if (typeof value != "boolean") {
                    throw "value(" + (typeof value) + ") is not a boolean"
                }
                break
            case TypeId.NULL:
                if (value != null) {
                    throw "value(" + (typeof value) + ") is not null"
                }
                break
        }
        return value
    }
}

export namespace Types {
    export function defineOwnType<T extends TypeDef>(
        options: {
            baseType?: T,
            check?: TypeCheckFunction,
        }
    ): OwnTypeSettings {
        return {
            type: TypeId.OWN,
            baseType: options.baseType,
            check: options.check,
        }
    }

    export function defineObjectType<T extends TypeDef, G extends GenObject<TypeDef>>(
        options: {
            keyValues?: G,
            values?: T,
            def?: {
                [key: string]: RealTypeOf<T>
            } & {
                [key in keyof G]: RealTypeOf<G[key]>
            },
            check?: TypeCheckFunction,
        }
    ): ObjectTypeSettings<T, G> {
        return {
            type: TypeId.OBJECT,
            keyValues: options.keyValues,
            values: options.values,
            def: options.def,
            check: options.check,
        }
    }

    export function defineArrayType<V extends TypeDef>(
        options: {
            values?: V,
            def?: RealTypeOf<V>[]
        }
    ): ArrayTypeSettings<V> {
        return {
            type: TypeId.ARRAY,
            values: options.values,
            def: options.def,
        }
    }

    export const PORT_TYPE: NumberTypeSettings = {
        type: TypeId.NUMBER,
        min: 0,
        max: 65535,
        def: 8080,
        decimalPlaces: 0,
    }

    export const PERCENT_TYPE: NumberTypeSettings = {
        type: TypeId.NUMBER,
        min: 0,
        max: 100,
        def: 50,
        maxDecimalPlaces: 2,
    }

    export const TRUST_ALL_CERTS_TYPE: BooleanTypeSettings = {
        type: TypeId.BOOLEAN,
        def: false,
    }

    export const VERBOSE_TYPE: BooleanTypeSettings = {
        type: TypeId.BOOLEAN,
        def: false,
    }

    export const DOMAIN_TYPE: StringTypeSettings = {
        type: TypeId.STRING,
        minLength: 1,
        regex: /^(?!-)[A-Za-z0-9-]+([\\-\\.]{1}[a-z0-9]+)*\\.[A-Za-z]{2,6}$/gm,
    }

    export const IP_V4_ADDRESS_TYPE: StringTypeSettings = {
        type: TypeId.STRING,
        minLength: 1,
        regex: /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/gm,
    }

    export const IP_V6_ADDRESS_TYPE: StringTypeSettings = {
        type: TypeId.STRING,
        minLength: 1,
        regex: /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/gm,
    }

    export const IP_ADDRESS_TYPE: StringTypeSettings = {
        type: TypeId.STRING,
        minLength: 1,
        regex: /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/gm,
    }

    export const EMAIL_TYPE: StringTypeSettings = {
        type: TypeId.STRING,
        minLength: 1,
        regex: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/gm,
    }

    export const HOSTNAME_TYPE: MultiTypeDef = [
        DOMAIN_TYPE,
        IP_ADDRESS_TYPE
    ]

    export const DOMAIN_ARRAY_TYPE = defineArrayType({
        values: DOMAIN_TYPE,
    })

    export const HOSTNAME_ARRAY_TYPE = defineArrayType({
        values: HOSTNAME_TYPE,
    })

    export const IP_ADDRESS_ARRAY_TYPE = defineArrayType({
        values: IP_ADDRESS_TYPE,
    })

    export const IP_V4_ADDRESS_ARRAY_TYPE = defineArrayType({
        values: IP_V4_ADDRESS_TYPE,
    })

    export const IP_V6_ADDRESS_ARRAY_TYPE = defineArrayType({
        values: IP_V6_ADDRESS_TYPE,
    })
}

export type ValueResolvFunc<V> = (
    value: V
) => void
export type ValueRejectFunc = (
    reason: Error
) => void

export type ValueParser<V> = (
    res: ValueResolvFunc<V>,
    rej: ValueRejectFunc,
) => Awaitable<void>

export type ConfigParser<C extends GenObject<any>> = {
    [key in keyof C]: ValueParser<C[key]>
}
*/
