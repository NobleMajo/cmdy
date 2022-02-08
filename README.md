# cmdy

![uses npm](https://img.shields.io/npm/v/cmdy.svg?style=plastic&logo=npm&color=red)
![uses typescript](https://img.shields.io/badge/dynamic/json?style=plastic&color=blue&label=Typescript&prefix=v&query=devDependencies.typescript&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmajo418%2Fcmdy%2Fmain%2Fpackage.json)
![uses github](https://img.shields.io/badge/dynamic/json?style=plastic&color=darkviolet&label=GitHub&prefix=v&query=version&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmajo418%2Fcmdy%2Fmain%2Fpackage.json)
![can't load images](https://img.shields.io/badge/dynamic/json?style=plastic&color=orange&label=UnixTime&query=unixtime&suffix=sec&url=http%3A%2F%2Fworldtimeapi.org%2Fapi%2Ftimezone%2FEtc%2FUTC)

![](https://img.shields.io/badge/dynamic/json?color=darkred&label=open%20issues&query=open_issues&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fmajo418%2Fcmdy)
![](https://img.shields.io/badge/dynamic/json?color=navy&label=forks&query=forks&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fmajo418%2Fcmdy)
![](https://img.shields.io/badge/dynamic/json?color=green&label=subscribers&query=subscribers_count&suffix=x&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fmajo418%2Fcmdy)

"cmdy" js cmd argument framework that looks like the docker cli tool.

# table of contents 
- [cmdy](#cmdy)
- [table of contents](#table-of-contents)
- [Features](#features)
  - [General](#general)
  - [cmd (sub cmd)](#cmd-sub-cmd)
  - [flags](#flags)
- [Getting started](#getting-started)
  - [1. Install package](#1-install-package)
  - [2. Add example code](#2-add-example-code)
- [contribution](#contribution)

# Features

## General
 - root and sub commands
 - differend cmd callbacks
 - state and value flags

## cmd (sub cmd)
 - own flags
 - global gflas
 - premade or custom help function/generator
 - cmd groups

## flags
 - value flags with types
 - default values
 - aliases
 - shorthand

# Getting started
## 1. Install package
```sh
npm i cmdy
```

## 2. Add example code
```ts
import { Flag, parseCmd, CmdDefinition } from "../src/index"

const force: Flag = {
    name: "force",
    description: "The force flag",
}

const port: Flag = {
    name: "port",
    description: "The port flag",
    shorthand: "p",
    types: ["number"]
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

const ps: CmdDefinition = {
    name: "ps",
    description: "The ps command",
    flags: [
        port
    ],
    allowUnknownArgs: true,
    exe: async (res) => console.log("ps: ", res.cmd.name + "\nres-data:\n", res.flags, res.valueFlags)
}

const start: CmdDefinition = {
    name: "start",
    description: "The start command",
    flags: [
        port
    ],
    exe: async (res) => console.log("start: ", res.cmd.name + "\nres-data:\n", res.flags, res.valueFlags)
}

const stop: CmdDefinition = {
    name: "stop",
    description: "The stop command",
    flags: [
        force
    ],
    exe: async (res) => console.log("stop: ", res.cmd.name + "\nres-data:\n", res.flags, res.valueFlags)
}

const root: CmdDefinition = {
    name: "testcmd",
    description: "The root testcmd command",
    cmds: [
        start,
        stop,
        ps,
    ],
     flags: [
        version
    ],
    //exe: async () => console.log("asdasdd")
}

parseCmd({
    cmd: root,
    globalFlags: [
        verbose
    ]
}).exe()
```

# contribution
 - 1. fork the project
 - 2. implement your idea
 - 3. create a pull/merge request
```ts
// please create seperated forks for different kind of featues/ideas/structure changes/implementations
```

---
**cya ;3**  
*by majo418*
