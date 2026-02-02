I want to build an endless, generative Trance music creator script. I would like you to use JavaScript with Tone.js to generate the audio in real-time.

Task: Create a script that procedurally generates an infinite Trance track based on the techniques used in the "Switch Angel" live coding method, see https://www.youtube.com/watch?v=iu5rnQkfO6M&list=LL&index=7&pp=iAQBsAgC.

Technical Requirements:

Music Theory Logic:

Set the root key to G Minor.

Use a sequencer logic based on 16th notes.

Implement a generative melody algorithm that selects notes from the G Minor scale (specifically 0, 4, 0, 9, 7 intervals).

Synthesizer Design (The Instruments):

Lead Synth: Create a Sawtooth Wave oscillator. Add a Low-Pass Filter with high resonance ("Acid" style) and map a slider/automation to the cutoff frequency to evolve the sound over time.

Kick Drum: Synthesize a "Trance Kick" (sine sweep) that plays a "four-on-the-floor" beat (every quarter note).

Bassline: Create a "Super Saw" (multiple detuned sawtooth waves stacked). This should play a simple off-beat pattern or follow the root notes 2 octaves down. Add random detuning to the Super Saw for a "chaotic/thick" texture.

FX/Riser: Create a White Noise generator with a long attack envelope to act as a "Riser" during transition phases.

Audio Effects & Mixing:

Sidechain Ducking: This is critical. Apply volume ducking (compression) to the Lead and Bass whenever the Kick drum hits. Set the ducking attack to approx 160ms to get that pumping Trance feel.

Delay/Reverb: Add stereo delay to the lead synth during breakdowns to create atmospheric space.

Arrangement Loop (The "Endless" Logic):

Do not just loop one bar. Create a state machine that cycles through:

State A (Groove): Kick + Bass + Acid Lead (Filter open).

State B (Breakdown): Remove Kick/Bass. Isolate the Lead. Close the filter slightly. Add Delay.

State C (Build-up): Introduce the White Noise Riser and a Snare/Clap roll.

State D (The Drop): Bring back full Kick, Bass, and Lead with maximum energy ("Heat").

Output: Please write the complete code to run this generative audio stream. Ensure the "Chaos" factor (random detuning and filter modulation) changes slightly every loop to keep it interesting.

UI Requirements (Crucial):

Start/Stop Button: Browsers block auto-playing audio. A simple, prominently styled button initializes Tone.start() and toggles the transport.

Mixer UI: A dedicated 'MIXER' button toggles the display of a separate mixer panel, featuring individual volume faders for each instrument (kick, bass, lead, chords, piano, pads, arp).

Action Button Styling: Prominent action buttons (START/STOP, MIXER, Save MIDI) share a consistent, larger green-and-black styling. Secondary action buttons (RESET, HIDE UI, BACK) have a smaller, consistent green-and-black styling.

Visualizer: Includes a <canvas> element that renders a real-time waveform or frequency analysis (Oscilloscope style) of the Master output, similar to the video's aesthetic.

Technical & Musical Requirements:

Music Theory Logic:

Scale: G Minor.

Sequencer: Use a 16th-note loop foundation.

Melody Algorithm: Implement the specific "Switch Angel" motif: Use scale degrees 0, 4, 0, 9, 7 (representing Root, 5th, Root, High 3rd, Octave). Randomize the probability of these notes triggering to keep it generative.

Synthesizer Design (Tone.js):

Lead Synth: Uses Tone.PolySynth with a Fatsawtooth oscillator for a rich, wide sound. Features an aggressive Low-Pass Filter with reduced Q and filter envelope octaves, and an LFO for controlled sweeps (range adjusted for mellower sound). Volume is explicitly set lower to prevent overpowering other elements.

Bassline (Super Saw): Use Tone.PolySynth with Tone.FatOscillator (type: "fatsawtooth"). Set spread to 20-30 and count to 3 for that wide, detuned trance sound. It should play a simple off-beat rhythm or follow the root notes.

Kick Drum: Use Tone.MembraneSynth to create a punchy "Trance Kick" playing 4/4 (four-on-the-floor).

Arp Synth: Uses Tone.FMSynth with a square oscillator, now routed through its own low-pass filter to prevent harsh high frequencies. The Arp Synth is correctly triggered and controlled.

Effects & Mixing:

Sidechain Ducking: Use Tone.Gain nodes to "duck" the volume of the Lead and Bass every time the Kick hits. Set the release/recovery time to approx 160ms for a heavy pumping effect.

Atmosphere: Add Tone.PingPongDelay and Tone.Reverb to the Lead, especially active during breakdown states.

Arrangement (The "Endless" State Machine):

Implement a state machine that cycles every 16 or 32 bars:

State A (Groove): Kick + Bass + Acid Lead (Filter Open).

State B (Breakdown): Mute Kick/Bass. Isolate the Lead. Lower the filter cutoff. Increase Delay/Reverb.

State C (Build-up): Introduce a White Noise Riser (using Tone.NoiseSynth with a long attack) and a fast Snare/Clap roll.

State D (Drop): Full energy. Max filter cutoff.

Output: Provide the complete, runnable HTML/JS code. Ensure the sequencing uses Tone.Transport so it stays perfectly in sync.
