#!/usr/bin/env node

// claude-code-pathfix
// PreToolUse hook: transparently converts Windows paths to POSIX in Bash commands
// https://github.com/fnrhombus/claude-code-pathfix

// No-op on non-Windows platforms (safe for symlinked settings across WSL/Windows)
if (process.platform !== 'win32') process.exit(0);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    if (data.tool_name !== 'Bash') return;

    const command = data.tool_input?.command;
    if (!command) return;

    // Skip if the command looks like PowerShell (user may have switched shells)
    if (/\b(Get-|Set-|New-|Remove-|Invoke-|Select-|Where-Object|ForEach-Object|\$PSVersionTable|\$env:)/i.test(command)) return;

    const fixed = fixWindowsPaths(command);

    if (fixed === command) return;

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        updatedInput: { ...data.tool_input, command: fixed },
      },
    }));
  } catch {
    // Silent failure — never block the command
  }
});

/**
 * Convert Windows-style absolute paths to POSIX (Git Bash / MSYS2) format.
 *
 *   D:\Users\Tom\file.txt        →  /d/Users/Tom/file.txt
 *   "C:\Program Files\Git\bin"   →  "/c/Program Files/Git/bin"
 *   C:\repo\src\index.ts         →  /c/repo/src/index.ts
 */
function fixWindowsPaths(command) {
  // Pass 1: paths inside double quotes (may contain spaces)
  let result = command.replace(
    /"([A-Za-z]):((?:\\[^"*?<>|\n\r]+?)+\\?)"/g,
    (_, drive, tail) => '"/' + drive.toLowerCase() + tail.replace(/\\/g, '/') + '"',
  );

  // Pass 2: unquoted paths (no spaces)
  result = result.replace(
    /(?<![/\w])([A-Za-z]):((?:\\[^\s\\*?"<>|]+)+\\?)/g,
    (_, drive, tail) => '/' + drive.toLowerCase() + tail.replace(/\\/g, '/'),
  );

  return result;
}

module.exports = { fixWindowsPaths };
