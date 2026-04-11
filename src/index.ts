#!/usr/bin/env node

// claude-code-pathfix
// PreToolUse hook: transparently converts Windows paths to POSIX in Bash commands
// https://github.com/fnrhombus/claude-code-pathfix

import { runHook, updateInput } from "@fnrhombus/claude-code-hooks";

// No-op on non-Windows platforms (safe for symlinked settings across WSL/Windows).
if (process.platform !== "win32") process.exit(0);

const ESCAPE = "⟪!⟫";

// Characters that suggest a PowerShell command — skip path conversion if we see them.
const POWERSHELL_RE =
  /\b(Get-|Set-|New-|Remove-|Invoke-|Select-|Where-Object|ForEach-Object|\$PSVersionTable|\$env:)/i;

runHook({
  preToolUse: {
    Bash: ({ tool_input }) => {
      const command = tool_input.command;
      if (!command) return;

      // Escape prefix: strip it and run the remainder unmodified.
      if (command.startsWith(ESCAPE)) {
        return updateInput({
          ...tool_input,
          command: command.slice(ESCAPE.length),
        });
      }

      // Looks like PowerShell — don't touch it.
      if (POWERSHELL_RE.test(command)) return;

      const fixed = fixWindowsPaths(command);
      if (fixed === command) return;

      return updateInput({ ...tool_input, command: fixed });
    },
  },
});

/**
 * Convert Windows-style absolute paths to POSIX (Git Bash / MSYS2) format.
 *
 *   D:\Users\Tom\file.txt        →  /d/Users/Tom/file.txt
 *   "C:\Program Files\Git\bin"   →  "/c/Program Files/Git/bin"
 *   C:\repo\src\index.ts         →  /c/repo/src/index.ts
 */
function fixWindowsPaths(command: string): string {
  return command
    // Pass 1: paths inside double quotes (may contain spaces).
    .replace(
      /"([A-Za-z]):((?:\\[^"*?<>|\n\r]+?)+\\?)"/g,
      (_, drive: string, tail: string) =>
        `"/${drive.toLowerCase()}${tail.replace(/\\/g, "/")}"`,
    )
    // Pass 2: unquoted paths (no spaces).
    .replace(
      /(?<![/\w])([A-Za-z]):((?:\\[^\s\\*?"<>|]+)+\\?)/g,
      (_, drive: string, tail: string) =>
        `/${drive.toLowerCase()}${tail.replace(/\\/g, "/")}`,
    );
}
