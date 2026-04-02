const { app } = require('electron')
const { exec } = require('child_process')

app.whenReady().then(() => {

  exec(`osascript -e 'tell application "Terminal" to do script "cd ~/web-tools && claude --dangerously-skip-permissions --name orbit"'`)

  setTimeout(() => {
    exec(`osascript -e 'tell application "Terminal" to do script "cd ~/web-tools && claude --dangerously-skip-permissions --name scribe"'`)
  }, 500)

  setTimeout(() => {
    exec(`osascript -e 'tell application "Terminal" to do script "cd ~/web-tools && claude --dangerously-skip-permissions --name helm"'`)
  }, 1000)

  setTimeout(() => {
    app.quit()
  }, 1500)
})

