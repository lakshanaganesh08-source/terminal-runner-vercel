"""
Procedural 8-bit Sound Synthesizer & Audio Manager for Terminal Runner
Generates retro chiptune sound effects in-memory using pure math & WAV synthesis.
Gracefully handles environments without sound hardware (headless, docker, etc.).
"""

import math
import struct
import io
import wave
import random
import pygame
from game.config import AUDIO_SAMPLE_RATE, DEFAULT_VOLUME


class AudioManager:
    """Manages audio playback with procedurally synthesized 8-bit retro sound effects."""

    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self.initialized = False
        self.sounds = {}
        self.volume = DEFAULT_VOLUME

        if self.enabled:
            self._init_mixer()

    def _init_mixer(self):
        """Attempts to initialize Pygame mixer safely."""
        try:
            # Check if mixer is already initialized
            if not pygame.mixer.get_init():
                pygame.mixer.pre_init(AUDIO_SAMPLE_RATE, -16, 1, 512)
                pygame.mixer.init()
            self.initialized = True
            self._generate_all_sounds()
        except Exception as e:
            # Audio device might not be available in headless/Docker environments
            self.initialized = False
            self.enabled = False

    def _create_wav_sound(self, sample_generator, duration: float) -> pygame.mixer.Sound:
        """Helper to create a Pygame Sound object from a mathematical sample generator function."""
        num_samples = int(AUDIO_SAMPLE_RATE * duration)
        raw_data = bytearray()

        for i in range(num_samples):
            t = i / AUDIO_SAMPLE_RATE
            progress = i / max(1, num_samples - 1)
            # Sample generator should return float between -1.0 and 1.0
            val = sample_generator(t, progress)
            val = max(-1.0, min(1.0, val))  # Clamp
            # Convert to 16-bit signed integer
            int_val = int(val * 32767.0)
            raw_data.extend(struct.pack("<h", int_val))

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(AUDIO_SAMPLE_RATE)
            wav_file.writeframes(raw_data)

        buffer.seek(0)
        sound = pygame.mixer.Sound(file=buffer)
        sound.set_volume(self.volume)
        return sound

    def _generate_all_sounds(self):
        """Generates all 8-bit sound effects procedurally."""
        if not self.initialized:
            return

        # 1. JUMP SOUND (Frequency sweep upwards with subtle square/triangle harmonics)
        def jump_gen(t, p):
            freq = 220.0 + 580.0 * (p ** 0.8)
            env = (1.0 - p) ** 0.5
            phase = 2.0 * math.pi * freq * t
            # Square-wave with softened edge
            wave_val = 0.7 * (1.0 if math.sin(phase) > 0 else -1.0) + 0.3 * math.sin(phase)
            return wave_val * env

        # 2. DUCK / SLIDE SOUND (Low whoosh with slight grit)
        def duck_gen(t, p):
            freq = 320.0 * (1.0 - p * 0.7)
            env = math.sin(p * math.pi)
            noise = (random.random() * 2.0 - 1.0) * 0.25
            tone = math.sin(2.0 * math.pi * freq * t)
            return (tone * 0.75 + noise) * env

        # 3. COLLECT DATA PACKET (High crisp arpeggio chime)
        def collect_gen(t, p):
            # 3-step arpeggio: C6, E6, G6
            if p < 0.33:
                freq = 1046.50
            elif p < 0.66:
                freq = 1318.51
            else:
                freq = 1567.98
            env = (1.0 - (p % 0.33) / 0.33) * (1.0 - p * 0.4)
            wave_val = math.sin(2.0 * math.pi * freq * t)
            return wave_val * env

        # 4. POWER-UP SOUND (Heroic 4-note ascending fanfare)
        def powerup_gen(t, p):
            # C5 -> E5 -> G5 -> C6
            if p < 0.25:
                freq = 523.25
            elif p < 0.50:
                freq = 659.25
            elif p < 0.75:
                freq = 783.99
            else:
                freq = 1046.50
            local_p = (p * 4.0) % 1.0
            env = 1.0 - local_p * 0.4
            phase = 2.0 * math.pi * freq * t
            wave_val = 0.6 * math.sin(phase) + 0.4 * (1.0 if math.sin(phase) > 0 else -1.0)
            return wave_val * env

        # 5. SHIELD BREAK SOUND (Glass shatter / high-pass laser noise)
        def shield_break_gen(t, p):
            env = (1.0 - p) ** 1.8
            freq = 1600.0 * (1.0 - p * 0.8)
            tone = math.sin(2.0 * math.pi * freq * t) * (1.0 - p)
            noise = (random.random() * 2.0 - 1.0) * 0.7
            return (tone * 0.4 + noise * 0.6) * env

        # 6. CRASH / EXPLOSION SOUND (Heavy bitcrushed impact drop)
        def crash_gen(t, p):
            env = (1.0 - p) ** 1.5
            freq = 180.0 * (1.0 - p * 0.8)
            tone = math.sin(2.0 * math.pi * freq * t)
            noise = (random.random() * 2.0 - 1.0)
            return (tone * 0.35 + noise * 0.65) * env

        # 7. UI BEEP / CLICK (Short high-pitch terminal blip)
        def ui_beep_gen(t, p):
            freq = 980.0
            env = 1.0 - p
            return math.sin(2.0 * math.pi * freq * t) * env

        # 8. PAUSE SOUND (Dual blip down)
        def pause_gen(t, p):
            freq = 880.0 if p < 0.5 else 440.0
            env = 1.0 - (p % 0.5) / 0.5
            return math.sin(2.0 * math.pi * freq * t) * env

        try:
            self.sounds["jump"] = self._create_wav_sound(jump_gen, 0.16)
            self.sounds["duck"] = self._create_wav_sound(duck_gen, 0.14)
            self.sounds["collect"] = self._create_wav_sound(collect_gen, 0.20)
            self.sounds["powerup"] = self._create_wav_sound(powerup_gen, 0.36)
            self.sounds["shield_break"] = self._create_wav_sound(shield_break_gen, 0.28)
            self.sounds["crash"] = self._create_wav_sound(crash_gen, 0.45)
            self.sounds["ui_beep"] = self._create_wav_sound(ui_beep_gen, 0.05)
            self.sounds["pause"] = self._create_wav_sound(pause_gen, 0.18)
        except Exception:
            # Fallback if synthesis fails
            self.sounds.clear()

    def play(self, sound_name: str):
        """Plays a named sound effect if audio is active."""
        if not self.enabled or not self.initialized:
            return
        sound = self.sounds.get(sound_name)
        if sound:
            try:
                sound.play()
            except Exception:
                pass

    def set_volume(self, volume: float):
        """Updates sound effect volume (0.0 to 1.0)."""
        self.volume = max(0.0, min(1.0, volume))
        for sound in self.sounds.values():
            try:
                sound.set_volume(self.volume)
            except Exception:
                pass
