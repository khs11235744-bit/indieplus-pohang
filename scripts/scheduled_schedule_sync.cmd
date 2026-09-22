@echo off
cd /d "C:\Users\권형석\Documents\indieplus-pohang"
if not exist reports mkdir reports
python scripts\run_harness.py --data-only --skip-images >> reports\scheduled-schedule.log 2>&1
