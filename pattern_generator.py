#!/usr/bin/env python3
import random
import json
import time

def generate_trance_pattern():
    # G minor pentatonic scale (matching TranceAngel frontend)
    gm_scale = [67, 70, 72, 74, 77]  # G4, Bb4, C5, D5, F5
    
    # Switch Angel motif: scale degrees 0, 4, 0, 9, 7
    switch_angel = [67, 77, 67, 79, 74]  # G, F, G, G5, D
    
    patterns = {
        "kick": [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        "bass": generate_bass_pattern(),
        "lead": generate_lead_pattern(gm_scale),
        "switch_angel": switch_angel
    }
    
    return patterns

def generate_bass_pattern():
    # Trance bass: root on 1, syncopated hits
    pattern = []
    for i in range(16):
        if i % 4 == 0 or (i % 8 == 6):  # 1st beat + syncopation
            pattern.append({"note": 43, "velocity": 80})  # G2
        else:
            pattern.append(None)
    return pattern

def generate_lead_pattern(scale):
    pattern = []
    for i in range(16):
        if random.random() > 0.4:  # 60% note probability
            note = random.choice(scale)
            pattern.append({
                "note": note,
                "velocity": random.randint(60, 100),
                "duration": random.choice([0.25, 0.5, 1.0])
            })
        else:
            pattern.append(None)
    return pattern

if __name__ == "__main__":
    pattern = generate_trance_pattern()
    print(json.dumps(pattern, indent=2))
