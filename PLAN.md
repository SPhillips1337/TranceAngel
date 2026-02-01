# Plan for Generative Trance Audio Improvement

This document outlines a plan to enhance the audio generation of the Generative Trance application, focusing on leveraging the Ollama endpoint for dynamic content and refining existing Tone.js implementations.

## 1. Ollama Integration for Dynamic Content

### 1.1 Dynamic Melody Generation
- [ ] **Iterative Prompt Engineering:** Experiment with different prompts for `fetchOllamaMelody` to achieve desired melodic characteristics (mood, scale, rhythm, note range).
- [ ] **Contextual Prompts:** Enhance prompts to include `currentState` (Groove, Breakdown, Build-up, The Drop) for more context-aware melody generation.
- [ ] **Dynamic Melody Refresh:** Implement logic to call `fetchOllamaMelody` periodically (e.g., every 8 or 16 bars, or upon `currentState` change) to introduce continuous melodic variation. Implement caching or rate limiting to avoid excessive API calls.

### 1.2 Ollama-Powered Rhythmic Patterns
- [ ] **Kick Drum Patterns:** Develop prompts for Ollama to generate varying kick drum patterns, moving beyond the fixed "four on the floor" in `playKick`.
- [ ] **Snare/Hi-Hat Patterns:** Generate more complex and dynamic snare and hi-hat patterns (if hi-hats are added) using Ollama.

### 1.3 Ollama-Powered Sound Design
- [ ] **Synth Parameter Suggestions:** Investigate prompting Ollama to suggest Tone.js synth parameters (oscillator types, envelope settings, filter frequencies) for `leadSynth` and `bassSynth`. This would require Ollama to output structured data (e.g., JSON).
- [ ] **Effect Parameter Suggestions:** Explore generating parameters for `leadDelay`, `leadReverb`, or other effects.

## 2. Tone.js Sound Design Refinement

### 2.1 Synth Parameter Exploration
- [ ] **`leadSynth`:** Experiment with different `oscillator` types (e.g., 'triangle', 'square', 'pulse', 'pwm'), more complex `envelope` shapes, and `filterEnvelope` settings for richer lead textures.
- [ ] **`bassSynth`:** Adjust `fatsawtooth` `count` and `spread`, and the `filterEnvelope` to create deeper, more evolving bass textures.
- [ ] **`kickSynth`:** Fine-tune `pitchDecay`, `octaves`, and `envelope` for punchier or longer kick sounds.
- [ ] **`noiseSynth` & `snareSynth`:** Adjust noise type and envelope for various percussive elements (e.g., open/closed hi-hats, claps).

### 2.2 New Instruments/Sounds
- [ ] **Pad Synth:** Add a dedicated pad synthesizer for atmospheric layers.
- [ ] **Arpeggiator:** Implement an arpeggiator for the lead or a new synth voice.
- [ ] **Hi-Hats/Percussion:** Introduce separate hi-hat and other percussion synths (e.g., `Tone.MetalSynth` or samples).

## 3. Effects and Mixing

### 3.1 Advanced Sidechain Compression
- [ ] **Implement proper sidechaining:** Reroute `kickSynth` output to a `Tone.Compressor` sidechain input on `bassSynth` and `leadSynth` to achieve a cleaner pumping effect.

### 3.2 Global Effects and Mastering
- [ ] **Mastering Chain:** Add a `Tone.Compressor` and `Tone.Limiter` to the `Tone.Destination` for overall loudness and polish.
- [ ] **Additional Effects:** Introduce `Tone.Chorus`, `Tone.Phaser`, `Tone.Flanger`, or more complex `Tone.Delay` types for spatial depth and movement.

### 3.3 Effect Tuning
- [ ] **Reverb/Delay Tuning:** Fine-tune existing `leadDelay` and `leadReverb` parameters for optimal sonic quality.

## 4. Code Refactoring and Structure

- [ ] **Modularization:** Consider breaking down `main.js` into smaller, more manageable modules (e.g., `synthSetup.js`, `sequencer.js`, `ollamaIntegration.js`) for better organization and maintainability.
- [ ] **Configuration:** Externalize magic numbers and core parameters into a configuration object or separate file for easier tweaking.
- [ ] **Error Handling:** Improve robustness for API calls and audio engine failures.
