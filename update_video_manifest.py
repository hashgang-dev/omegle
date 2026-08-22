#!/usr/bin/env python3
import os
import json

VIDEO_DIR = os.path.join(os.path.dirname(__file__), "assets", "simulated_videos")
MANIFEST_FILE = os.path.join(VIDEO_DIR, "manifest.json")
ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv", ".avi"}

def update_manifest():
    if not os.path.exists(VIDEO_DIR):
        print(f"Directory {VIDEO_DIR} does not exist.")
        return

    video_files = []
    for f in sorted(os.listdir(VIDEO_DIR)):
        ext = os.path.splitext(f)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            rel_path = f"assets/simulated_videos/{f}"
            video_files.append(rel_path)

    with open(MANIFEST_FILE, "w", encoding="utf-8") as out:
        json.dump(video_files, out, indent=2)

    print(f"Successfully updated manifest.json with {len(video_files)} video files:")
    for v in video_files:
        print(f" - {v}")

if __name__ == "__main__":
    update_manifest()
