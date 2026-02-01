// Audio Setup
let leadSynth, leadFilter, leadDelay, leadReverb, leadGain;
let kickSynth, bassSynth, bassGain;
let sidechainGain;
let noiseSynth, snareSynth;
let analyser, canvas, ctx;

function setupLead() {
    leadFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 1000,
        resonance: 8
    });

    leadDelay = new Tone.PingPongDelay({
        delayTime: "8n",
        feedback: 0.4,
        wet: 0.3
    });

    leadReverb = new Tone.Reverb({
        decay: 3,
        preDelay: 0.01,
        wet: 0.2
    });

    leadGain = new Tone.Gain(0.4);

    leadSynth = new Tone.MonoSynth({
        oscillator: {
            type: "sawtooth"
        },
        envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.2,
            release: 0.5
        },
        filterEnvelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0.1,
            baseFrequency: 200,
            octaves: 4
        }
    }).connect(leadFilter);

    // Serial chain to avoid summing issues
    leadFilter.connect(leadGain);
    leadGain.connect(leadDelay);
    leadDelay.connect(leadReverb);
    leadReverb.connect(sidechainGain);
}

function setupSidechain() {
    sidechainGain = new Tone.Gain(1).toDestination();
}

function triggerSidechain(time) {
    sidechainGain.gain.cancelScheduledValues(time);
    sidechainGain.gain.setValueAtTime(1, time);
    sidechainGain.gain.exponentialRampToValueAtTime(0.01, time + 0.01);
    sidechainGain.gain.exponentialRampToValueAtTime(1, time + 0.16);
}

function setupKick() {
    kickSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.001,
            decay: 0.4,
            sustain: 0.01,
            release: 1.4,
            attackCurve: "exponential"
        }
    }).toDestination();
}

function setupVisualizer() {
    analyser = new Tone.Analyser("waveform", 1024);
    Tone.Destination.connect(analyser);

    canvas = document.getElementById("visualizer");
    ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    function draw() {
        requestAnimationFrame(draw);

        const buffer = analyser.getValue();

        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.lineJoin = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00ffcc";

        for (let i = 0; i < buffer.length; i++) {
            const x = (i / buffer.length) * canvas.width;
            const y = ((buffer[i] + 1) / 2) * canvas.height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Add some "glow" or extra lines for aesthetics if needed
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 255, 204, 0.2)";
        ctx.stroke();
    }
    draw();
}

function setupBass() {
    bassGain = new Tone.Gain(0.5);
    bassSynth = new Tone.PolySynth(Tone.MonoSynth, {
        oscillator: {
            type: "fatsawtooth",
            count: 3,
            spread: 25
        },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.4,
            release: 0.4
        },
        filter: {
            Q: 1,
            type: "lowpass",
            rolloff: -12
        },
        filterEnvelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.1,
            baseFrequency: 100,
            octaves: 2.5
        }
    }).connect(bassGain);
    bassGain.connect(sidechainGain);
}

function setupFX() {
    noiseSynth = new Tone.NoiseSynth({
        noise: {
            type: "white"
        },
        envelope: {
            attack: 4,
            decay: 0.2,
            sustain: 0.5,
            release: 2
        }
    }).toDestination();

    snareSynth = new Tone.NoiseSynth({
        noise: {
            type: "white"
        },
        envelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0
        }
    }).toDestination();
}

// Sequencing and State Machine
const scale = ["G1", "A1", "Bb1", "C2", "D2", "Eb2", "F2", "G2", "A2", "Bb2", "C3", "D3", "Eb3", "F3", "G3", "A3", "Bb3", "C4", "D4", "Eb4", "F4", "G4", "A4", "Bb4"];
// Adjusted scale to have more range. G3 is index 14.
// Degrees 0, 4, 0, 9, 7 relative to G3 (index 14) -> 14, 18, 14, 23, 21
const melodyDegrees = [14, 18, 14, 23, 21];

let currentState = 'A'; // A, B, C, D
let barCount = 0;

function setupSequencer() {
    Tone.Transport.bpm.value = 138; // Classic trance BPM

    Tone.Transport.scheduleRepeat((time) => {
        const step = Tone.Transport.getTicksAtTime(time) / Tone.Transport.PPQ;
        const sixteenth = Math.floor((step * 4) % 16);
        const beat = Math.floor(step % 4);
        const bar = Math.floor(step / 4);

        if (bar !== barCount) {
            barCount = bar;
            handleStateTransitions();
        }

        playKick(time, sixteenth);
        playBass(time, sixteenth);
        playLead(time, sixteenth);
        playFX(time, sixteenth, beat, bar);
    }, "16n");
}

function handleStateTransitions() {
    // Cycle states every 16 bars
    const cyclePos = barCount % 64;
    if (cyclePos < 16) currentState = 'A';
    else if (cyclePos < 32) currentState = 'B';
    else if (cyclePos < 48) currentState = 'C';
    else currentState = 'D';

    document.getElementById('state-display').innerText = `State: ${getStateName(currentState)} (Bar ${barCount % 16 + 1}/16)`;

    // Chaos factor: evolving parameters every bar
    if (bassSynth) {
        bassSynth.set({
            oscillator: {
                spread: 20 + Math.random() * 20
            }
        });
    }
}

function getStateName(state) {
    switch (state) {
        case 'A': return 'Groove';
        case 'B': return 'Breakdown';
        case 'C': return 'Build-up';
        case 'D': return 'The Drop';
        default: return state;
    }
}

function playKick(time, sixteenth) {
    if (currentState === 'B') return; // No kick in breakdown

    // Four on the floor
    if (sixteenth % 4 === 0) {
        kickSynth.triggerAttackRelease("C1", "8n", time);
        triggerSidechain(time);
    }
}

function playBass(time, sixteenth) {
    if (currentState === 'B' || currentState === 'C') return; // No bass in breakdown/buildup

    // Off-beat bass
    if (sixteenth % 4 === 2) {
        const root = scale[0]; // G1
        bassSynth.triggerAttackRelease(root, "16n", time);
    }
}

function playLead(time, sixteenth) {
    // Lead plays in all states but differently
    let prob = 0.3;
    if (currentState === 'D') prob = 0.6;
    if (currentState === 'B') prob = 0.2;

    if (Math.random() < prob) {
        const degree = melodyDegrees[Math.floor(Math.random() * melodyDegrees.length)];
        const note = scale[degree];

        // Evolve filter
        let cutoff = 1000;
        if (currentState === 'A') cutoff = 1500 + Math.sin(barCount) * 500;
        if (currentState === 'B') cutoff = 600;
        if (currentState === 'C') cutoff = 600 + (barCount % 16) * 100;
        if (currentState === 'D') cutoff = 3000;

        // Random detuning for "Chaos" factor
        leadSynth.detune.setValueAtTime((Math.random() - 0.5) * 20, time);

        leadFilter.frequency.rampTo(cutoff, 0.1, time);
        leadSynth.triggerAttackRelease(note, "16n", time);
    }
}

function playFX(time, sixteenth, beat, bar) {
    // Riser in Build-up
    if (currentState === 'C') {
        if (bar % 16 === 0 && sixteenth === 0) {
            noiseSynth.triggerAttackRelease("16n", time);
            // Longer riser logic could be here, but NoiseSynth envelope handles it mostly
            // Actually we might want a longer trigger
            noiseSynth.triggerAttack(time);
            noiseSynth.triggerRelease(time + Tone.Time("16n").toSeconds() * 16 * 4); // 4 bars
        }

        // Snare roll
        let snareProb = 0;
        if (bar % 16 > 8) snareProb = 0.5;
        if (bar % 16 > 12) snareProb = 1.0;

        if (sixteenth % 2 === 0 && Math.random() < snareProb) {
            snareSynth.triggerAttackRelease("16n", time);
        }
    }
}

// Initialization
let isPlaying = false;
let isInitialized = false;

async function startAudio() {
    await Tone.start();
    console.log("Audio started");

    if (!isInitialized) {
        setupSidechain();
        setupLead();
        setupKick();
        setupBass();
        setupFX();
        setupVisualizer();
        setupSequencer();
        isInitialized = true;
    }

    barCount = 0;
    Tone.Transport.position = 0;
    Tone.Transport.start();
    isPlaying = true;
    document.getElementById("start-stop-btn").innerText = "STOP";
}

function stopAudio() {
    Tone.Transport.stop();
    isPlaying = false;
    document.getElementById("start-stop-btn").innerText = "START";
    document.getElementById("state-display").innerText = "State: Stopped";
}

document.getElementById("start-stop-btn").addEventListener("click", () => {
    if (!isPlaying) {
        startAudio();
    } else {
        stopAudio();
    }
});
