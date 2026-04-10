# claude-code-pathfix

**Stop burning tokens on Windows path errors.**

[![npm version](https://img.shields.io/npm/v/claude-code-pathfix)](https://www.npmjs.com/package/claude-code-pathfix)
[![license](https://img.shields.io/npm/l/claude-code-pathfix)](./LICENSE)

Every time Claude Code generates a Bash command on Windows, there's a coin flip: will it use `D:\Users\Tom\file.txt` or `/d/Users/Tom/file.txt`? The wrong one fails, Claude reasons about the error, retries, sometimes fails again — and you pay for every token.

**`claude-code-pathfix` makes the problem disappear.** It's a zero-config [PreToolUse hook](https://docs.anthropic.com/en/docs/claude-code/hooks) that silently rewrites Windows paths to POSIX format before Bash commands execute. No errors. No retries. No wasted tokens.

## The problem

Claude Code runs Bash (Git Bash / MSYS2) on Windows, but the AI constantly generates Windows-style paths:

```bash
# What Claude generates
cat D:\Users\Tom\.claude\settings.json
git -C C:\dev\myproject status
ls "C:\Program Files\Git\bin"

# What Git Bash actually needs
cat /d/Users/Tom/.claude/settings.json
git -C /c/dev/myproject status
ls "/c/Program Files/Git/bin"
```

Each failure triggers a retry loop:

1. Command fails → error message (tokens spent)
2. Claude reasons about the error (more tokens spent)
3. Claude retries with a corrected path (even more tokens)
4. Sometimes repeats 3-4 times before succeeding

This is **the most common source of wasted tokens on Windows.** There are [15+ open issues](https://github.com/anthropics/claude-code/issues?q=is%3Aissue+windows+path) about it in the Claude Code repo.

## The fix

Install `claude-code-pathfix` and add two lines to your settings. Every Bash command is silently intercepted, paths are converted, and the corrected command executes on the first try.

```
Before: 3-4 attempts per path error × multiple errors per session = hundreds of wasted tokens
After:  zero failures, zero retries, zero wasted tokens
```

## Prior art

The blog post [*Fixing Claude Code's PowerShell Problem with Hooks*](https://blog.netnerds.net/2026/02/claude-code-powershell-hooks/) pioneered the idea of using hooks to catch Windows path errors. That approach **blocks** commands with bad paths and forces Claude to retry with the correct format — a "block-and-correct" pattern. The author reported going from *"three attempts per PowerShell operation"* to *"zero failures."*

`claude-code-pathfix` takes this further:

| | netnerds.net approach | claude-code-pathfix |
|---|---|---|
| **Mechanism** | Block the command, force a retry | Transparently rewrite the command |
| **Retries needed** | 1 (Claude must resubmit) | 0 (fixed before execution) |
| **Tokens saved** | ~60% of retry cost | ~100% of retry cost |
| **Claude awareness** | Claude sees the block, reasons about it | Claude never knows — command just works |
| **Scope** | PowerShell commands | All Bash commands |

The key difference: blocking still costs a round-trip. Claude sees the error, thinks about it, and resubmits — that's tokens spent on reasoning about a problem that could have been silently fixed. `claude-code-pathfix` uses Claude Code's [`updatedInput`](https://docs.anthropic.com/en/docs/claude-code/hooks) feature (shipped in v2.0.10) to rewrite the command in-flight. The AI never sees an error because there isn't one.

## Install

Add this to your Claude Code settings (`~/.claude/settings.json`):

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "npx -y claude-code-pathfix"
          }
        ]
      }
    ]
  }
}
```

That's it. One step. `npx` downloads and caches the package automatically on first run — no global install needed.

## What it converts

| Input | Output |
|---|---|
| `D:\Users\Tom\file.txt` | `/d/Users/Tom/file.txt` |
| `C:\dev\myproject\src\index.ts` | `/c/dev/myproject/src/index.ts` |
| `"C:\Program Files\Git\bin"` | `"/c/Program Files/Git/bin"` |
| `E:\data\export\` | `/e/data/export/` |

### What it doesn't touch

- Paths that are already POSIX (`/d/Users/Tom/...`)
- Relative paths (`../src/file.ts`)
- URLs (`https://example.com`)
- Escape sequences (`\n`, `\t`)
- Non-path backslash usage (`grep 'foo\|bar'`)

## Cross-platform safe

**If your Claude Code settings are symlinked across Windows and WSL** (a common setup), `claude-code-pathfix` detects the platform at startup and silently exits on non-Windows systems. It will never interfere with native Linux or macOS Bash commands.

## Performance

The hook is a single Node.js script with **zero dependencies**. It starts in under 10ms — compared to 200-500ms for hooks that spawn a Bash subshell ([#34457](https://github.com/anthropics/claude-code/issues/34457)). You won't notice it's there.

## How it works

1. Claude Code's `PreToolUse` event fires before every Bash command
2. `claude-code-pathfix` reads the command from stdin
3. A two-pass regex converts Windows absolute paths to POSIX format:
   - Pass 1: quoted paths (handles spaces in paths like `"C:\Program Files\..."`)
   - Pass 2: unquoted paths
4. If any paths were converted, the fixed command is returned via `updatedInput`
5. If nothing changed, the hook exits silently (no output = no modification)

## Requirements

- **Claude Code** v2.0.10+ (for `updatedInput` hook support)
- **Node.js** 14+ (any version that ships with Claude Code works)
- **Windows** with Git Bash or MSYS2

## License

MIT
