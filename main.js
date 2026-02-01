// Audio Setup
let leadSynth, leadFilter, leadDelay, leadReverb, leadGain;
let kickSynth, bassSynth, bassGain;
let sidechainGain;
let noiseSynth, snareSynth, padSynth, hatSynth;
let analyser, canvas, ctx;
let ollamaMelody = []; // Declare global variable for Ollama generated melody
let ollamaKickPattern = "1000100010001000"; // Default four-on-the-floor pattern (1=on, 0=off for 16th notes)
let ollamaPadSynthParams = null; // Declare global variable for Ollama generated pad synth parameters

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
            type: "fatsawtooth", // Changed from "sawtooth"
            count: 3,
            spread: 30
        },
        envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.2,
            release: 0.8 // Changed from 0.5
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
            decay: 0.3, // Changed from 0.4
            sustain: 0.005, // Changed from 0.01
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
            spread: 30 // Changed from 25
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
            octaves: 3 // Changed from 2.5
        }
    }).connect(bassGain);
    bassGain.connect(sidechainGain);
}

function setupPad() {
    padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "sawtooth",
            detune: 0 // Will be overridden by dynamic values
        },
        envelope: {
            attack: 2,
            decay: 1,
            sustain: 0.8,
            release: 3
        },
        filterEnvelope: {
            attack: 1,
            decay: 0.5,
            sustain: 0.5,
            baseFrequency: 200,
            octaves: 3,
            exponent: 1
        }
    }).toDestination(); // Connect directly to destination for now
}

function setupFX() {
    noiseSynth = new Tone.NoiseSynth({
        noise: {
            type: "white"
        },
        envelope: {
            attack: 2, // Changed from 4
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
            decay: 0.08, // Changed from 0.1
            sustain: 0
        }
    }).toDestination();
}

// Function to interact with Ollama for melody generation
async function fetchOllamaMelody(prompt) {
    const ollamaEndpoint = "/ollama-api/generate";
    try {
        const response = await fetch(ollamaEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3", // Assuming a suitable model like llama3 is available
                prompt: prompt,
                stream: false // We want a single response
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Ollama often returns a stream of JSON objects, sometimes with just a "response" field
        // We need to parse each line if stream is true, but we set stream to false.
        // So, we expect a single JSON object with a 'response' field.
        
        // Assuming the relevant response is in data.response
        const generatedText = data.response.trim();
        console.log("Ollama Raw Response:", generatedText);

        // Attempt to parse the generated text into an array of notes
        // Example expected format: "G3, A#3, C4"
        const notes = generatedText.split(',').map(note => note.trim()).filter(note => note !== "");
        return notes;

    } catch (error) {
        console.error("Error fetching melody from Ollama:", error);
        return []; // Return empty array on error
    }
}

// Function to interact with Ollama for kick pattern generation
async function fetchOllamaKickPattern(prompt) {
    const ollamaEndpoint = "/ollama-api/generate";
    try {
        const response = await fetch(ollamaEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3", // Assuming a suitable model like llama3 is available
                prompt: prompt,
                stream: false // We want a single response
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.response.trim();
        console.log("Ollama Raw Kick Pattern Response:", generatedText);

        // Expecting a string of '1's and '0's, potentially with some introductory text.
        // We'll try to extract the pattern.
        const patternMatch = generatedText.match(/[01]+/);
        if (patternMatch && patternMatch[0].length === 16) { // Expecting a 16-step pattern
            return patternMatch[0];
        } else {
            console.warn("Could not extract a valid 16-step kick pattern from Ollama response.");
            return "1000100010001000"; // Fallback to default
        }

    } catch (error) {
        console.error("Error fetching kick pattern from Ollama:", error);
        return "1000100010001000"; // Return default on error
    }
}

// Function to interact with Ollama for sound design parameters (JSON)
async function fetchOllamaSoundParams(prompt) {
    const ollamaEndpoint = "/ollama-api/generate";
    try {
        const response = await fetch(ollamaEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3", // Assuming a suitable model like llama3 is available
                prompt: prompt,
                stream: false // We want a single response
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.response.trim();
        console.log("Ollama Raw Sound Params Response:", generatedText);

        // Attempt to parse the generated text as JSON
        try {
            const params = JSON.parse(generatedText);
            // Basic validation for expected structure
            if (params && typeof params === 'object' && params.oscillator && params.envelope) {
                return params;
            } else {
                console.warn("Ollama response for sound params is not a valid JSON object with expected structure.");
                return null;
            }
        } catch (jsonError) {
            console.warn("Could not parse Ollama response as JSON for sound params:", jsonError);
            return null;
        }

    } catch (error) {
        console.error("Error fetching sound parameters from Ollama:", error);
        return null; // Return null on error
    }
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
        playPad(time, sixteenth); // Play the pad
        playLead(time, sixteenth);
        playFX(time, sixteenth, beat, bar);
    }, "16n");
}

function handleStateTransitions() {
    // Cycle states every 16 bars
    const cyclePos = barCount % 64;
    const oldState = currentState; // Store old state for comparison
    if (cyclePos < 16) currentState = 'A';
    else if (cyclePos < 32) currentState = 'B';
    else if (cyclePos < 48) currentState = 'C';
    else currentState = 'D';

    document.getElementById('state-display').innerText = `State: ${getStateName(currentState)} (Bar ${barCount % 16 + 1}/16)`;

    // Fetch new melody from Ollama when a new major cycle begins (e.g., every 64 bars at the start of 'A')
    if (currentState === 'A' && barCount % 64 === 0 && oldState !== 'A') {
        const prompt = "Generate a short, uplifting trance lead melody using notes from the G minor scale (G, A, Bb, C, D, Eb, F). Provide 5-8 notes as a comma-separated list of Tone.js compatible note strings (e.g., 'G3, A#3, C4'). Ensure notes are between G3 and F4.";
        fetchOllamaMelody(prompt).then(newMelody => {
            if (newMelody.length > 0) {
                ollamaMelody = newMelody;
                console.log("New Ollama Melody fetched:", ollamaMelody);
            } else {
                console.warn("Failed to fetch new Ollama melody. Retaining old melody or falling back to default.");
            }
        });

        const kickPrompt = "Generate a 16-step kick drum pattern suitable for a trance groove. Represent 'kick on' as 1 and 'kick off' as 0. The pattern should be exactly 16 characters long, e.g., '1000100010001000'.";
        fetchOllamaKickPattern(kickPrompt).then(newPattern => {
            if (newPattern.length === 16) {
                ollamaKickPattern = newPattern;
                console.log("New Ollama Kick Pattern fetched:", ollamaKickPattern);
            } else {
                console.warn("Failed to fetch new Ollama kick pattern. Retaining old pattern or falling back to default.");
            }
        });

        // Fetch new sound parameters for pad synth from Ollama
        const padPrompt = "Generate JSON parameters for a 'Tone.PolySynth' to create an evolving, atmospheric trance pad sound. Include 'oscillator' (type, detune), 'envelope' (attack, decay, sustain, release), and 'filterEnvelope' (attack, decay, sustain, baseFrequency, octaves) properties. Ensure parameters are suitable for a soft, long pad. Example: {'oscillator': {'type': 'sawtooth', 'detune': 0}, 'envelope': {'attack': 2, ...}}";
        fetchOllamaSoundParams(padPrompt).then(newParams => {
            if (newParams) {
                ollamaPadSynthParams = newParams;
                // Apply immediately to the padSynth
                if (padSynth) {
                    padSynth.set(ollamaPadSynthParams);
                    console.log("New Ollama Pad Synth Parameters applied:", ollamaPadSynthParams);
                }
            } else {
                console.warn("Failed to fetch new Ollama pad synth parameters. Retaining old parameters or using default.");
            }
        });
    }

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

    if (ollamaKickPattern[sixteenth] === '1') { // Check the pattern at the current 16th note
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

function playPad(time, sixteenth) {
    if (currentState === 'B' || currentState === 'C') return; // No pad in breakdown/buildup

    // Play a chord every beat
    if (sixteenth % 4 === 0) {
        const root = scale[0]; // G1
        const third = scale[2]; // Bb1
        const fifth = scale[4]; // D2
        padSynth.triggerAttackRelease([root, third, fifth], "1m", time); // Hold for 1 measure
    }
}

function playLead(time, sixteenth) {
    // Lead plays in all states but differently
    let prob = 0.3;
    if (currentState === 'D') prob = 0.6;
    if (currentState === 'B') prob = 0.2;

    if (Math.random() < prob) {
        let note;
        if (ollamaMelody.length > 0) {
            // Use Ollama generated melody
            const currentMelodyIndex = Math.floor(barCount / 2) % ollamaMelody.length; // Cycle through melody every 2 bars
            note = ollamaMelody[currentMelodyIndex];
        } else {
            // Fallback to default melody degrees
            const degree = melodyDegrees[Math.floor(Math.random() * melodyDegrees.length)];
            note = scale[degree];
        }

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
        setupPad(); // Initialize pad synth
        setupFX();
        setupVisualizer();
        setupSequencer();
        isInitialized = true;

        // Fetch initial melody from Ollama
        const prompt = "Generate a short, uplifting trance lead melody using notes from the G minor scale (G, A, Bb, C, D, Eb, F). Provide 5-8 notes as a comma-separated list of Tone.js compatible note strings (e.g., 'G3, A#3, C4'). Ensure notes are between G3 and F4.";
        ollamaMelody = await fetchOllamaMelody(prompt);
        if (ollamaMelody.length === 0) {
            console.warn("Ollama melody fetch failed or returned empty. Falling back to default melodyDegrees.");
                    } else {
                        console.log("Ollama Melody fetched:", ollamaMelody);
                    }
        
                    // Fetch initial kick pattern from Ollama
                    const kickPrompt = "Generate a 16-step kick drum pattern suitable for a trance groove. Represent 'kick on' as 1 and 'kick off' as 0. The pattern should be exactly 16 characters long, e.g., '1000100010001000'.";
                    const fetchedKickPattern = await fetchOllamaKickPattern(kickPrompt);
                    if (fetchedKickPattern.length === 16) {
                        ollamaKickPattern = fetchedKickPattern;
                        console.log("Ollama Kick Pattern fetched:", ollamaKickPattern);
                    } else {
                        console.warn("Failed to fetch valid Ollama kick pattern. Using default.");
                    }    }

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
