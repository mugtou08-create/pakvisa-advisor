#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    echo "[$(date)] Restarting Next.js dev server..." >> /home/z/my-project/dev.log
    npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    sleep 10
  fi
  sleep 15
done
