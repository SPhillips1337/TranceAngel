#!/usr/bin/env python3
import random
import json
import math

class TranceAI:
    def __init__(self):
        self.gm_scale = [67, 70, 72, 74, 77]  # G minor pentatonic
        self.switch_angel = [67, 77, 67, 79, 74]  # Classic motif
        
    def generate_state_pattern(self, state="groove", energy=0.7):
        """Generate patterns based on trance state machine"""
        patterns = {}
        
        if state == "groove":
            patterns["kick"] = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
            patterns["bass"] = self._bass_groove()
            patterns["lead"] = self._lead_melody(energy)
            
        elif state == "breakdown":
            patterns["kick"] = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
            patterns["bass"] = [None] * 16
            patterns["lead"] = self._atmospheric_lead()
            
        elif state == "buildup":
            patterns["kick"] = [1,0,1,0, 1,0,1,0, 1,1,1,1, 1,1,1,1]
            patterns["bass"] = self._rising_bass()
            patterns["lead"] = self._tension_lead()
            
        elif state == "drop":
            patterns["kick"] = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
            patterns["bass"] = self._heavy_bass()
            patterns["lead"] = self._switch_angel_lead()
            
        return patterns
    
    def _bass_groove(self):
        return [
            {"note": 43, "vel": 90} if i % 4 == 0 or i == 6 or i == 14 
            else None for i in range(16)
        ]
    
    def _lead_melody(self, energy):
        pattern = [None] * 16
        
        # Determine number of notes to place based on energy
        # For a clearer, less noisy arpeggio, we'll aim for a consistent number of active steps.
        # Min 4 notes, max around 8-12 for a 16-step pattern.
        num_active_steps = max(4, min(12, int(energy * 12)))
        
        # Create a melodic sequence based on the G minor pentatonic scale (arpeggio)
        arpeggio_sequence = []
        scale_length = len(self.gm_scale)
        for i in range(num_active_steps):
            # Simple ascending pattern, cycling through the scale
            arpeggio_sequence.append(self.gm_scale[i % scale_length])

        # Distribute these notes across the 16 steps
        # To make it "plucky" and avoid "high pitch noise", we'll use:
        # - Shorter durations
        # - Moderate velocities
        # - Place notes on selected steps to create a rhythmic arpeggio, not every step.
        
        current_note_idx = 0
        # Iterate through 16 steps, placing notes typically every 2nd or 4th step.
        # Let's start by placing notes every 2nd step (8th note feel)
        for i in range(16):
            # Only place a note if we have notes left in our arpeggio_sequence
            # and if the current step is an even step (i.e., every 2nd step)
            if i % 2 == 0 and current_note_idx < num_active_steps:
                pattern[i] = {
                    "note": arpeggio_sequence[current_note_idx],
                    "vel": random.randint(50, 75),  # Softer velocities for "soft pluck"
                    "dur": random.choice([0.125, 0.25]) # Shorter durations for "soft pluck"
                }
                current_note_idx += 1
            
            # If all notes from the arpeggio sequence have been placed, stop.
            if current_note_idx >= num_active_steps:
                break
                
        return pattern
    
    def _atmospheric_lead(self):
        # Sparse, ambient lead for breakdown
        pattern = [None] * 16
        for i in [0, 4, 8, 12]:
            if random.random() > 0.3:
                pattern[i] = {
                    "note": random.choice(self.gm_scale),
                    "vel": random.randint(40, 70),
                    "dur": 2.0
                }
        return pattern
    
    def _switch_angel_lead(self):
        # Classic Switch Angel motif
        pattern = [None] * 16
        for i, note in enumerate(self.switch_angel):
            if i < 16:
                pattern[i] = {"note": note, "vel": 85, "dur": 0.5}
        return pattern
    
    def _rising_bass(self):
        # Ascending bass for buildup
        notes = [43, 45, 47, 48]  # G2, A2, B2, C3
        return [
            {"note": notes[i//4], "vel": 70 + i*2} if i % 2 == 0 
            else None for i in range(16)
        ]
    
    def _heavy_bass(self):
        # Powerful bass for drop
        return [
            {"note": 43, "vel": 100} if i % 4 == 0 
            else {"note": 43, "vel": 60} if i % 8 == 6 
            else None for i in range(16)
        ]
    
    def _tension_lead(self):
        # High energy lead for buildup
        high_notes = [79, 81, 82, 84]  # Higher octave
        pattern = [None] * 16
        
        for i in range(8, 16):  # Second half gets busier
            if random.random() > 0.2:
                pattern[i] = {
                    "note": random.choice(high_notes),
                    "vel": 80 + i,
                    "dur": 0.25
                }
        return pattern

if __name__ == "__main__":
    ai = TranceAI()
    
    # Generate patterns for each state
    states = ["groove", "breakdown", "buildup", "drop"]
    
    for state in states:
        pattern = ai.generate_state_pattern(state, energy=0.8)
        print(f"\n=== {state.upper()} ===")
        print(json.dumps(pattern, indent=2))
