#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  fixWindowsPaths: () => fixWindowsPaths
});
module.exports = __toCommonJS(index_exports);
var import_claude_code_hooks = require("@fnrhombus/claude-code-hooks");
if (process.platform !== "win32") process.exit(0);
var ESCAPE = "\u27EA!\u27EB";
var POWERSHELL_RE = /\b(Get-|Set-|New-|Remove-|Invoke-|Select-|Where-Object|ForEach-Object|\$PSVersionTable|\$env:)/i;
(0, import_claude_code_hooks.runHook)({
  preToolUse: {
    Bash: ({ tool_input }) => {
      const command = tool_input.command;
      if (!command) return;
      if (command.startsWith(ESCAPE)) {
        return (0, import_claude_code_hooks.updateInput)({
          ...tool_input,
          command: command.slice(ESCAPE.length)
        });
      }
      if (POWERSHELL_RE.test(command)) return;
      const fixed = fixWindowsPaths(command);
      if (fixed === command) return;
      return (0, import_claude_code_hooks.updateInput)({ ...tool_input, command: fixed });
    }
  }
});
function fixWindowsPaths(command) {
  let result = command.replace(
    /"([A-Za-z]):((?:\\[^"*?<>|\n\r]+?)+\\?)"/g,
    (_, drive, tail) => '"/' + drive.toLowerCase() + tail.replace(/\\/g, "/") + '"'
  );
  result = result.replace(
    /(?<![/\w])([A-Za-z]):((?:\\[^\s\\*?"<>|]+)+\\?)/g,
    (_, drive, tail) => "/" + drive.toLowerCase() + tail.replace(/\\/g, "/")
  );
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fixWindowsPaths
});
