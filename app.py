import time
import random
from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
BPM = 140
SIXTEENTH_NOTE_DURATION = (60 / BPM) / 4

SCALE = ["G1", "A1", "Bb1", "C2", "D2", "Eb2", "F2", "G2", "A2", "Bb2", "C3", "D3", "Eb3", "F3", "G3", "A3", "Bb3", "C4", "D4", "Eb4", "F4", "G4", "A4", "Bb4"]
MELODY_INDICES = [14, 18, 14, 23, 21]

class Sequencer:
    def __init__(self):
        self.is_running = False
        self.state = "Groove"
        self.bar_count = 0
        self.sixteenth_count = 0
        self.melody_step = 0
        self.thread = None
        self.pattern = None

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.thread = socketio.start_background_task(self.run)

    def stop(self):
        self.is_running = False

    def run(self):
        next_tick = time.time()
        while self.is_running:
            current_time = time.time()
            if current_time >= next_tick:
                self.tick()
                next_tick += SIXTEENTH_NOTE_DURATION
            else:
                socketio.sleep(0.005)

    def tick(self):
        # State Machine (every 32 bars)
        if self.sixteenth_count == 0 and self.bar_count % 32 == 0 and self.bar_count > 0:
            self.update_state()

        # Sequencing Logic
        self.play_kick()
        self.play_bass()
        self.play_lead()
        self.play_fx()
        self.update_params()

        # Increment counts
        self.sixteenth_count += 1
        if self.sixteenth_count == 16:
            self.sixteenth_count = 0
            self.bar_count += 1

    def update_state(self):
        states = ["Groove", "Breakdown", "Build-up", "Drop"]
        current_index = states.index(self.state)
        # Advance state
        self.state = states[(current_index + 1) % len(states)]
        socketio.emit('state_change', {'state': self.state, 'bar': self.bar_count})

    def play_kick(self):
        if self.sixteenth_count % 4 == 0:
            # Ghost Kick: always trigger sidechain for the pumping effect
            socketio.emit('trigger_sidechain')

            if self.state != "Breakdown":
                socketio.emit('trigger_kick', {'note': 'C1', 'duration': '8n'})

    def play_bass(self):
        if self.state in ["Breakdown", "Build-up"]:
            return
        # Off-beat bass (on 3rd sixteenth of every beat)
        if self.sixteenth_count % 4 == 2:
            socketio.emit('trigger_bass', {'note': SCALE[0], 'duration': '16n'})

    def play_lead(self):
        # Use MIDI pattern if available
        if self.pattern and 'tracks' in self.pattern:
            track = self.pattern['tracks'][0]
            # Find notes that should play at this time
            # current_time_in_beats = self.bar_count * 4 + self.sixteenth_count * 0.25
            # For simplicity, we loop through the notes in the track
            # and trigger them based on their time
            for note_data in track.get('notes', []):
                note_time_beats = note_data.get('time', 0) * (BPM / 60) # Convert time in seconds to beats
                current_beats = self.bar_count * 4 + self.sixteenth_count * 0.25
                if abs(note_time_beats - current_beats) < 0.05: # Close enough to the tick
                    socketio.emit('trigger_lead', {
                        'note': note_data.get('name', 'G3'),
                        'duration': '16n',
                        'detune': (random.random() - 0.5) * 20
                    })
            return

        prob = 0.3
        if self.state == "Drop": prob = 0.6
        if self.state == "Breakdown": prob = 0.2

        if random.random() < prob:
            note_index = MELODY_INDICES[self.melody_step % len(MELODY_INDICES)]
            self.melody_step += 1
            note = SCALE[note_index]

            # Chaos factor: random detune
            detune = (random.random() - 0.5) * 20
            socketio.emit('trigger_lead', {'note': note, 'duration': '16n', 'detune': detune})

    def play_fx(self):
        if self.state == "Build-up":
            # Riser start every 8 bars
            if self.sixteenth_count == 0 and self.bar_count % 8 == 0:
                socketio.emit('trigger_riser', {'duration': 8})

            # Snare roll
            phase_pos = self.bar_count % 32
            snare_prob = 0
            if phase_pos > 16: snare_prob = 0.3
            if phase_pos > 24: snare_prob = 0.6
            if phase_pos > 28: snare_prob = 1.0

            if self.sixteenth_count % 2 == 0 and random.random() < snare_prob:
                 socketio.emit('trigger_snare', {'duration': '16n'})

    def update_params(self):
        # Evolve filter
        cutoff = 1000
        if self.state == "Groove":
            cutoff = 1500 + 500 * (self.bar_count % 8) / 8
        elif self.state == "Breakdown":
            cutoff = 600
        elif self.state == "Build-up":
            cutoff = 600 + (self.bar_count % 32) * 100
        elif self.state == "Drop":
            cutoff = 3000

        socketio.emit('param_update', {'param': 'lead_cutoff', 'value': cutoff})

        # Chaos factor for bass
        spread = 20 + random.random() * 20
        socketio.emit('param_update', {'param': 'bass_spread', 'value': spread})

sequencer = Sequencer()

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    sequencer.start()
    # Send initial state
    emit('state_change', {'state': sequencer.state, 'bar': sequencer.bar_count})

@socketio.on('start_music')
def handle_start():
    print('Starting music')
    sequencer.start()
    # Sync client state
    emit('state_change', {'state': sequencer.state, 'bar': sequencer.bar_count})

@socketio.on('stop_music')
def handle_stop():
    print('Stopping music')
    sequencer.stop()

@socketio.on('update_pattern')
def handle_update_pattern(pattern):
    print('Pattern updated')
    sequencer.pattern = pattern

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
