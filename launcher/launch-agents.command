#!/bin/bash

osascript <<APPLESCRIPT
tell application "Terminal"
    activate

    do script "cd ~/web-tools && claude --dangerously-skip-permissions --name orbit"
    delay 0.5
    do script "cd ~/web-tools && claude --dangerously-skip-permissions --name scribe"
    delay 0.5
    do script "cd ~/web-tools && claude --dangerously-skip-permissions --name helm"
end tell
APPLESCRIPT
