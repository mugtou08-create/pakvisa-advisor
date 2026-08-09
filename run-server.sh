#!/bin/bash
# Persistent server runner - auto-restarts on crash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..."
  bun run dev 2>&1 | tee -a dev.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
