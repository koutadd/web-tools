#!/bin/zsh
cd "$HOME/web-tools"
printf '\e]1;helm\a'
claude --dangerously-skip-permissions \
  --append-system-prompt-file "$HOME/web-tools/agents/system/project-memory.md" \
  --append-system-prompt-file "$HOME/web-tools/agents/prompts/helm-startup.md"
