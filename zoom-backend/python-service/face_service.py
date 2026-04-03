from flask import Flask, request, jsonify, send_from_directory
import cv2
import numpy as np
import base64
from PIL import Image
import io
import os
import json
import librosa

# ── FFmpeg for Windows Decoding ──────────────────
FFMPEG_PATH = r'D:\ffmpeg-2026-03-30-git-e54e117998-full_build\ffmpeg-2026-03-30-git-e54e117998-full_build\bin'
if os.path.exists(FFMPEG_PATH) and FFMPEG_PATH not in os.environ['PATH']:
    os.environ['PATH'] += os.pathsep + FFMPEG_PATH

app = Flask(__name__)

FACES_DIR = 'faces'
if not os.path.exists(FACES_DIR):
    os.makedirs(FACES_DIR)

def get_face_region(image):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(image, 1.1, 4)
    if len(faces) == 0:
        return None
    (x, y, w, h) = faces[0]
    return image[y:y+h, x:x+w]

@app.route('/face/register', methods=['POST'])
def register_face():
    try:
        if 'face_image' not in request.files:
            return jsonify({'success': False, 'message': 'No face image provided'}), 400
        
        file = request.files['face_image']
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user') # Default to temp_user if not provided
        
        # Read image to verify there is a face
        file_bytes = file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        if get_face_region(gray) is None:
            return jsonify({'success': False, 'message': 'No face detected in the image. Please try again.'}), 400

        filename = f"{role}_{user_id}.jpg"
        filepath = os.path.join(FACES_DIR, filename)
        
        # Save the original image
        cv2.imwrite(filepath, img)
        
        print(f"Registered face for {filename}")
        return jsonify({'success': True, 'message': 'Face registered successfully'})
    except Exception as e:
        print(f"Error in register: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/face/verify', methods=['POST'])
def verify_face():
    try:
        if 'face_image' not in request.files:
            return jsonify({'verified': False, 'message': 'No face image provided'}), 400
        
        file = request.files['face_image']
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user')
        
        reg_filename = f"{role}_{user_id}.jpg"
        reg_filepath = os.path.join(FACES_DIR, reg_filename)
        
        if not os.path.exists(reg_filepath):
            return jsonify({'verified': False, 'message': 'No registered face found for this user'}), 404
        
        # Read uploaded image
        file_bytes = file.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_login = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        gray_login = cv2.cvtColor(img_login, cv2.COLOR_BGR2GRAY)
        
        # Read registered image
        img_reg = cv2.imread(reg_filepath)
        gray_reg = cv2.cvtColor(img_reg, cv2.COLOR_BGR2GRAY)
        
        face1 = get_face_region(gray_reg)
        face2 = get_face_region(gray_login)
        
        if face1 is None or face2 is None:
            return jsonify({'verified': False, 'message': 'Face not detected in image'}), 400
            
        face1 = cv2.resize(face1, (100, 100))
        face2 = cv2.resize(face2, (100, 100))
        
        # Histogram comparison
        hist1 = cv2.calcHist([face1], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([face2], [0], None, [256], [0, 256])
        cv2.normalize(hist1, hist1, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist2, hist2, 0, 1, cv2.NORM_MINMAX)
        score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        
        # Template Matching
        res = cv2.matchTemplate(face1, face2, cv2.TM_CCOEFF_NORMED)
        template_score = float(res[0][0])
        
        match = score > 0.7 or template_score > 0.4
        
        print(f"Verification for {reg_filename}: Score={score}, Template={template_score}, Match={match}")
        
        return jsonify({
            'verified': bool(match),
            'score': float(max(score, template_score)),
            'message': 'Face verified' if match else 'Face not recognized'
        })
    except Exception as e:
        print(f"Error in verify: {str(e)}")
        return jsonify({'verified': False, 'message': str(e)}), 500

VOICE_DIR = 'voices'
if not os.path.exists(VOICE_DIR):
    os.makedirs(VOICE_DIR)

FINGER_DB = 'biometrics.json'
if not os.path.exists(FINGER_DB):
    with open(FINGER_DB, 'w') as f:
        json.dump({}, f)

@app.route('/voice/register', methods=['POST'])
def register_voice():
    try:
        if 'voice_sample' not in request.files:
            return jsonify({'success': False, 'message': 'No voice sample provided'}), 400
        
        file = request.files['voice_sample']
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user')
        
        filename = f"{role}_{user_id}.wav"
        filepath = os.path.join(VOICE_DIR, filename)
        file.save(filepath)

        print(f"✅ Voice Saved: {filename} for {user_id}")
        return jsonify({'success': True, 'message': 'Voice registered successfully'})
    except Exception as e:
        print(f"❌ Voice Register Error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/voice/verify', methods=['POST'])
def verify_voice():
    try:
        if 'voice_sample' not in request.files:
            return jsonify({'verified': False, 'message': 'No voice sample provided'}), 400
        
        file = request.files['voice_sample']
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user')
        
        reg_filename = f"{role}_{user_id}.wav"
        reg_filepath = os.path.join(VOICE_DIR, reg_filename)
        
        if not os.path.exists(reg_filepath):
            return jsonify({'verified': False, 'message': 'No registered voice found'}), 404
        
        # Save temp verify sample
        verify_filename = f"verify_{role}_{user_id}.wav"
        verify_filepath = os.path.join(VOICE_DIR, verify_filename)
        file.save(verify_filepath)
        
        # Simple MFCC Comparison (Basic Similarity)
        try:
            # use sr=None for native sampling rate
            y1, sr1 = librosa.load(reg_filepath, sr=None)
            y2, sr2 = librosa.load(verify_filepath, sr=None)
            
            mfcc1 = librosa.feature.mfcc(y=y1, sr=sr1)
            mfcc2 = librosa.feature.mfcc(y=y2, sr=sr2)
            
            avg1 = np.mean(mfcc1, axis=1)
            avg2 = np.mean(mfcc2, axis=1)
            
            dist = np.linalg.norm(avg1 - avg2)
            match = dist < 70.0 # Adjusted threshold
            print(f"📊 Voice Comparison: User={user_id}, Distance={dist}, Match={match}")
        except Exception as e:
            print(f"⚠️ Audio Loading/Processing Error: {str(e)}")
            return jsonify({'verified': False, 'message': f'Audio error: {str(e)}'}), 500
        
        if os.path.exists(verify_filepath):
            try:
                os.remove(verify_filepath)
            except:
                pass
        
        return jsonify({
            'verified': bool(match),
            'distance': float(dist),
            'message': 'Voice verified' if match else 'Voice not recognized'
        })
    except Exception as e:
        print(f"❌ General Voice Verify Error: {str(e)}")
        return jsonify({'verified': False, 'message': str(e)}), 500

@app.route('/finger/register', methods=['POST'])
def register_finger():
    try:
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user')
        
        with open(FINGER_DB, 'r') as f:
            db = json.load(f)
        db[f"{role}_{user_id}"] = True
        with open(FINGER_DB, 'w') as f:
            json.dump(db, f)
            
        return jsonify({'success': True, 'message': 'Fingerprint registered'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/finger/verify', methods=['POST'])
def verify_finger():
    try:
        role = request.form.get('role', 'student')
        user_id = request.form.get('user_id', 'temp_user')
        
        with open(FINGER_DB, 'r') as f:
            db = json.load(f)
        verified = db.get(f"{role}_{user_id}", False)
            
        return jsonify({'verified': bool(verified)})
    except Exception as e:
        return jsonify({'verified': False, 'message': str(e)}), 500

@app.route('/faces/<path:filename>')
def serve_face(filename):
    return send_from_directory(FACES_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)