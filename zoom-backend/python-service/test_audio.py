import librosa
import os

# ── Force FFmpeg PATH for testing ──
FFMPEG_PATH = r'D:\ffmpeg-2026-03-30-git-e54e117998-full_build\ffmpeg-2026-03-30-git-e54e117998-full_build\bin'
if os.path.exists(FFMPEG_PATH) and FFMPEG_PATH not in os.environ['PATH']:
    os.environ['PATH'] += os.pathsep + FFMPEG_PATH

path = r'c:\Users\ma\Desktop\MY PERHAI\react native course\zoom-backend\python-service\voices\teacher_temp_user.wav'
try:
    if os.path.exists(path):
        y, sr = librosa.load(path, sr=None)
        print(f"✅ Success! SR: {sr}, Samples: {len(y)}")
    else:
        print("❌ File not found")
except Exception as e:
    print(f"❌ Error: {str(e)}")
