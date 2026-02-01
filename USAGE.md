# Generative Trance - Usage Guide

This project is a full-stack real-time music generator that uses Python as the "Brain" (sequencer) and Tone.js as the "Audio Engine" (performer).

## Architecture

- **Backend (Python/Flask-SocketIO):** Handles the BPM clock, musical logic (G Minor scale, Switch Angel motif), and the state machine transitions (Groove, Breakdown, Build-up, Drop).
- **Frontend (JavaScript/Tone.js):** Receives musical events via WebSockets and synthesizes the audio in real-time. It also includes a live visualizer.

## Prerequisites

- Python 3.7+
- A modern web browser (Chrome, Firefox, Edge)

## Installation

1. **Clone the repository** (if applicable).
2. **Install the required Python dependencies:**

   ```bash
   pip install flask flask-socketio eventlet
   ```

   *Note: `eventlet` is recommended for high-performance WebSocket handling.*

## How to Run

1. **Start the Python server:**

   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5000`.

2. **Open the Frontend:**
   - Navigate to `http://localhost:5000` in your web browser.

3. **Start the Music:**
   - Click the **START** button on the page.
   - *Note: Most browsers require a user interaction (like clicking a button) before allowing audio to play.*

## Features

- **Endless Generation:** The music never stops and evolves over time.
- **State Machine:** Cycles through different musical phases every 32 bars.
- **Chaos Factor:** Random detuning and parameter modulation keep the sound organic and evolving.
- **Visualizer:** Real-time waveform analysis of the audio output.

## Troubleshooting

- **No Audio:** Ensure your system volume is up and you have clicked the "START" button. Check the browser console for any Tone.js or Socket.IO errors.
- **Connection Issues:** If the page fails to connect to the server, ensure `app.py` is running and no other process is using port 5000.
