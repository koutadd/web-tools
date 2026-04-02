#!/bin/zsh
cd "$HOME/web-tools"
printf '\e]1;scribe\a'
claude --dangerously-skip-permissions \
  --append-system-prompt-file "$HOME/web-tools/agents/system/project-memory.md" \
  --append-system-prompt-file "$HOME/web-tools/agents/prompts/scribe-startup.md"
