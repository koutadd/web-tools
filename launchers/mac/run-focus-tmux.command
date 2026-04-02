export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
#!/bin/zsh

SESSION="lp-ai"

tmux kill-session -t $SESSION 2>/dev/null

tmux new-session -d -s $SESSION

tmux send-keys -t $SESSION "cd ~/web-tools && printf '\e]1;orbit\a' && claude --dangerously-skip-permissions --append-system-prompt-file ~/web-tools/agents/system/project-memory.md --append-system-prompt-file ~/web-tools/agents/prompts/orbit-startup.md" C-m

tmux split-window -v -t $SESSION

tmux send-keys -t $SESSION:0.1 "cd ~/web-tools && printf '\e]1;scribe\a' && claude --dangerously-skip-permissions --append-system-prompt-file ~/web-tools/agents/system/project-memory.md --append-system-prompt-file ~/web-tools/agents/prompts/scribe-startup.md" C-m

tmux split-window -h -t $SESSION:0.1

tmux send-keys -t $SESSION:0.2 "cd ~/web-tools && printf '\e]1;helm\a' && claude --dangerously-skip-permissions --append-system-prompt-file ~/web-tools/agents/system/project-memory.md --append-system-prompt-file ~/web-tools/agents/prompts/helm-startup.md" C-m

tmux select-pane -t $SESSION:0.0
tmux attach -t $SESSION
