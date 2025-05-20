git init
git add .
git commit -m "Initial commit"

@echo off
setlocal

set REMOTE_PATH=demon@192.168.4.32:/home/demon/KpopCardCollectingBot
scp -r ./cards ./assests ./commands ./moderation ./commands.js ./config.json ./index.js ./channel.js ./package.json %REMOTE_PATH%

pause