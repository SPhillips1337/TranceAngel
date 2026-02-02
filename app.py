import time
import random
import json
import os
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
        self.mutation = 0.0
        self.arp_mode = "UpDown"

    def note_to_midi(self, name):
        base_map = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
        try:
            note_parts = name[:-1]
            octave = int(name[-1])
            return (octave + 1) * 12 + base_map.get(note_parts, 0)
        except:
            return 60

    def snap_to_scale(self, note_name):
        target_midi = self.note_to_midi(note_name)
        closest_note = SCALE[0]
        min_dist = 999
        for s_note in SCALE:
            s_midi = self.note_to_midi(s_note)
            dist = abs(s_midi - target_midi)
            if dist < min_dist:
                min_dist = dist
                closest_note = s_note
        return closest_note

    def process_pattern(self, pattern):
        """Transpose to G Minor and snap to scale."""
        if not pattern or 'tracks' not in pattern:
            return pattern

        # Simple transposition: shift everything so the first note is in G minor scale
        # or just snap everything. Snapping is safer for trance.
        for track in pattern['tracks']:
            for note in track.get('notes', []):
                note['name'] = self.snap_to_scale(note['name'])
        return pattern

    def load_seed_pattern(self, name):
        filepath = f"patterns/{name}.json"
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                pattern = json.load(f)
                self.pattern = self.process_pattern(pattern)
                print(f"Loaded seed pattern: {name}")

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
        self.play_chords()
        self.play_piano()
        self.play_pads()
        self.play_arp()
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
            # Loop pattern every 4 beats
            current_beats_in_bar = self.sixteenth_count * 0.25

            for note_data in track.get('notes', []):
                note_time_beats = note_data.get('time', 0) * (BPM / 60)
                # Loop the pattern time within 4 beats
                pattern_time = note_time_beats % 4

                if abs(pattern_time - current_beats_in_bar) < 0.05:
                    note = note_data.get('name', 'G3')

                    # Apply Mutation
                    if random.random() < self.mutation:
                        note = random.choice(SCALE[7:17]) # Range around center

                    socketio.emit('trigger_lead', {
                        'note': note,
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

    def play_chords(self):
        if self.state != "Groove":
            return
        # Play a G minor chord progression on the first beat of every 2 bars
        if self.sixteenth_count == 0 and self.bar_count % 2 == 0:
            progression = [
                ["G2", "Bb2", "D3"],  # Gm
                ["C3", "Eb3", "G3"],  # Cm
                ["F2", "A2", "C3"],   # F
                ["D3", "F3", "A3"]    # Dm
            ]
            chord = progression[(self.bar_count // 2) % len(progression)]
            socketio.emit('trigger_chords', {'notes': chord, 'duration': '2n'})

    def play_piano(self):
        if self.state != "Breakdown":
            return
        # Sparse, staccato melody in high register
        if self.sixteenth_count in [0, 4, 8, 12] and random.random() < 0.4:
            note = random.choice(SCALE[14:]) # Higher notes
            socketio.emit('trigger_piano', {'note': note, 'duration': '8n'})

    def play_pads(self):
        if self.state not in ["Groove", "Breakdown"]:
            return
        # Long, ambient textures on the first beat of every 4 bars
        if self.sixteenth_count == 0 and self.bar_count % 4 == 0:
            note = random.choice(["G1", "C2", "F1", "D2"]) # Root notes
            socketio.emit('trigger_pads', {'note': note, 'duration': '1m'})

    def play_arp(self):
        if self.state not in ["Drop", "Groove"]:
            return

        g_minor_scale = ["G2", "A2", "Bb2", "C3", "D3", "Eb3", "F3", "G3"]

        if self.arp_mode == "Random":
            note = random.choice(g_minor_scale)
        else:
            if self.arp_mode == "Up":
                arp_pattern = [0, 1, 2, 3, 4, 5, 6, 7]
            elif self.arp_mode == "Down":
                arp_pattern = [7, 6, 5, 4, 3, 2, 1, 0]
            else: # UpDown
                arp_pattern = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1]

            note_index = arp_pattern[self.sixteenth_count % len(arp_pattern)]
            note = g_minor_scale[note_index]

        socketio.emit('trigger_arp', {'note': note, 'duration': '16n'})

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
    sequencer.pattern = sequencer.process_pattern(pattern)

@socketio.on('set_seed_pattern')
def handle_set_seed_pattern(data):
    name = data.get('name')
    if name:
        sequencer.load_seed_pattern(name)

@socketio.on('set_mutation')
def handle_set_mutation(data):
    val = data.get('value', 0)
    sequencer.mutation = float(val) / 100.0
    print(f"Mutation set to {sequencer.mutation}")

@socketio.on('reset_pattern')
def handle_reset_pattern():
    print('Pattern reset')
    sequencer.pattern = None
    sequencer.mutation = 0.0
    sequencer.arp_mode = "UpDown"

@socketio.on('set_arp_mode')
def handle_set_arp_mode(data):
    mode = data.get('mode', 'UpDown')
    sequencer.arp_mode = mode
    print(f"Arp mode set to {mode}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
