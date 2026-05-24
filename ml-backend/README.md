---
title: ML Workers
emoji: 🤖
colorFrom: red
colorTo: yellow
sdk: docker
pinned: true
app_port: 7860
---

# ML Production Workers

Real-time ML streaming pipeline running 24/7.

## Workers Running
1. data_ingestion — RSS feeds → Redis every 5 minutes
2. prediction_worker — Redis → ML Model → Supabase