# Serve the static web app with Flask (optional - more features)
# Usage: python server-flask.py

from flask import Flask, send_from_directory
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    print("🟢 Flask server running at http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)