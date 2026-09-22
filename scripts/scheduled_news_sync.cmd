@echo off
cd /d "C:\Users\권형석\Documents\indieplus-pohang"
if not exist reports mkdir reports
python scripts\run_harness.py --news-only >> reports\scheduled-news.log 2>&1
