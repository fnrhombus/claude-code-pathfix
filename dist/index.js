#!/usr/bin/env node
"use strict";

// src/index.ts
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
  return command.replace(
    /"([A-Za-z]):((?:\\[^"*?<>|\n\r]+?)+\\?)"/g,
    (_, drive, tail) => '"/' + drive.toLowerCase() + tail.replace(/\\/g, "/") + '"'
  ).replace(
    /(?<![/\w])([A-Za-z]):((?:\\[^\s\\*?"<>|]+)+\\?)/g,
    (_, drive, tail) => "/" + drive.toLowerCase() + tail.replace(/\\/g, "/")
  );
}
