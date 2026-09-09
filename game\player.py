"""
Player Entity and Animation Controller for Terminal Runner
Procedurally generates retro pixel-art character sprites and handles responsive physics.
"""

import math
import pygame
from game.config import (
    GROUND_Y, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DUCK_WIDTH, PLAYER_DUCK_HEIGHT,
    PLAYER_START_X, GRAVITY, JUMP_VELOCITY, VARIABLE_JUMP_REDUCTION,
    FAST_FALL_ACCEL, COLOR_NEON_GREEN, COLOR_NEON_CYAN, COLOR_NEON_AMBER,
    COLOR_NEON_RED, COLOR_WHITE, COLOR_SURFACE, COLOR_BG
)


class Player:
    """The cyber-runner player character."""

    def __init__(self, x: float = PLAYER_START_X, ground_y: float = GROUND_Y):
        self.start_x = x
        self.ground_y = ground_y
        self.x = float(x)
        self.y = float(ground_y - PLAYER_HEIGHT)
        self.vy = 0.0

        # States
        self.is_grounded = True
        self.is_ducking = False
        self.is_crashed = False
        self.is_invulnerable = False
        self.invulnerable_timer = 0.0

        # Jump controls
        self.jump_requested = False
        self.jump_held = False
        self.coyote_timer = 0.0
        self.jump_buffer_timer = 0.0

        # Power-up status
        self.has_shield = False
        self.shield_angle = 0.0

        # Animation state
        self.anim_timer = 0.0
        self.anim_frame = 0
        self.trail_history = []  # For motion shadow trails

        # Hitbox dimensions
        self.width = PLAYER_WIDTH
        self.height = PLAYER_HEIGHT
        self.rect = pygame.Rect(int(self.x), int(self.y), self.width, self.height)

        # Procedurally generate character sprite frames
        self.sprites = self._generate_sprites()
        self._update_hitbox()

    def _create_sprite_surface(self, width: int, height: int) -> pygame.Surface:
        """Helper to create transparent surface for pixel art."""
        surf = pygame.Surface((width, height), pygame.SRCALPHA)
        return surf

    def _generate_sprites(self) -> dict:
        """Procedurally draws high-definition retro pixel-art character sprites."""
        sprites = {}

        # 1. RUNNING FRAMES (6-frame running cycle)
        run_frames = []
        for i in range(6):
            surf = self._create_sprite_surface(PLAYER_WIDTH, PLAYER_HEIGHT)
            # Body coordinates
            leg_phase = i / 6.0 * math.tau

            # Torso (Cyber armor with neon core)
            torso_rect = pygame.Rect(10, 16, 20, 22)
            pygame.draw.rect(surf, COLOR_SURFACE, torso_rect, border_radius=3)
            pygame.draw.rect(surf, COLOR_NEON_GREEN, torso_rect, width=2, border_radius=3)
            # Chest glowing core
            pygame.draw.rect(surf, COLOR_NEON_CYAN, (17, 22, 6, 6))

            # Head & Helmet
            head_rect = pygame.Rect(12, 4, 16, 14)
            pygame.draw.rect(surf, (30, 36, 44), head_rect, border_radius=4)
            pygame.draw.rect(surf, COLOR_NEON_GREEN, head_rect, width=1, border_radius=4)
            # Glowing cyber visor
            visor_rect = pygame.Rect(18, 8, 11, 4)
            pygame.draw.rect(surf, COLOR_NEON_CYAN, visor_rect)
            pygame.draw.line(surf, COLOR_WHITE, (20, 9), (28, 9))

            # Jetpack / battery on back
            pygame.draw.rect(surf, (40, 48, 58), (6, 18, 5, 12))
            pygame.draw.rect(surf, COLOR_NEON_AMBER, (7, 20, 3, 4))

            # Animated Legs
            leg_offset_1 = math.sin(leg_phase) * 8
            leg_offset_2 = math.sin(leg_phase + math.pi) * 8

            # Left leg
            p1_start = (14, 38)
            p1_mid = (14 + int(leg_offset_1 * 0.5), 45)
            p1_end = (14 + int(leg_offset_1), 54)
            pygame.draw.lines(surf, COLOR_NEON_GREEN, False, [p1_start, p1_mid, p1_end], 3)
            pygame.draw.rect(surf, COLOR_WHITE, (p1_end[0] - 2, p1_end[1] - 2, 6, 3))

            # Right leg
            p2_start = (24, 38)
            p2_mid = (24 + int(leg_offset_2 * 0.5), 45)
            p2_end = (24 + int(leg_offset_2), 54)
            pygame.draw.lines(surf, (0, 200, 80), False, [p2_start, p2_mid, p2_end], 3)
            pygame.draw.rect(surf, COLOR_WHITE, (p2_end[0] - 2, p2_end[1] - 2, 6, 3))

            # Arms
            arm_swing = math.sin(leg_phase + math.pi) * 6
            pygame.draw.line(surf, COLOR_WHITE, (18, 22), (18 + int(arm_swing), 32), 2)

            run_frames.append(surf)
        sprites["run"] = run_frames

        # 2. JUMPING FRAME
        jump_surf = self._create_sprite_surface(PLAYER_WIDTH, PLAYER_HEIGHT)
        # Tucked streamlined airborne pose
        torso_rect = pygame.Rect(10, 12, 20, 22)
        pygame.draw.rect(jump_surf, COLOR_SURFACE, torso_rect, border_radius=3)
        pygame.draw.rect(jump_surf, COLOR_NEON_GREEN, torso_rect, width=2, border_radius=3)
        pygame.draw.rect(jump_surf, COLOR_NEON_CYAN, (17, 18, 6, 6))

        # Head looking upward/forward
        head_rect = pygame.Rect(13, 2, 16, 13)
        pygame.draw.rect(jump_surf, (30, 36, 44), head_rect, border_radius=4)
        pygame.draw.rect(jump_surf, COLOR_NEON_GREEN, head_rect, width=1, border_radius=4)
        pygame.draw.rect(jump_surf, COLOR_NEON_CYAN, (19, 6, 11, 4))

        # Tucked legs
        pygame.draw.lines(jump_surf, COLOR_NEON_GREEN, False, [(14, 34), (10, 42), (16, 46)], 3)
        pygame.draw.lines(jump_surf, (0, 200, 80), False, [(24, 34), (20, 42), (28, 44)], 3)

        # Jet thruster firing on back
        pygame.draw.rect(jump_surf, (40, 48, 58), (5, 16, 6, 12))
        pygame.draw.polygon(jump_surf, COLOR_NEON_CYAN, [(6, 28), (10, 28), (8, 38)])
        pygame.draw.polygon(jump_surf, COLOR_WHITE, [(7, 28), (9, 28), (8, 34)])

        sprites["jump"] = jump_surf

        # 3. FALLING FRAME
        fall_surf = self._create_sprite_surface(PLAYER_WIDTH, PLAYER_HEIGHT)
        torso_rect = pygame.Rect(10, 14, 20, 22)
        pygame.draw.rect(fall_surf, COLOR_SURFACE, torso_rect, border_radius=3)
        pygame.draw.rect(fall_surf, COLOR_NEON_GREEN, torso_rect, width=2, border_radius=3)
        pygame.draw.rect(fall_surf, COLOR_NEON_CYAN, (17, 20, 6, 6))
        # Head
        head_rect = pygame.Rect(12, 4, 16, 13)
        pygame.draw.rect(fall_surf, (30, 36, 44), head_rect, border_radius=4)
        pygame.draw.rect(fall_surf, COLOR_NEON_CYAN, (18, 8, 11, 4))
        # Extended legs bracing for impact
        pygame.draw.lines(fall_surf, COLOR_NEON_GREEN, False, [(14, 36), (12, 46), (14, 54)], 3)
        pygame.draw.lines(fall_surf, (0, 200, 80), False, [(24, 36), (26, 46), (28, 54)], 3)
        sprites["fall"] = fall_surf

        # 4. DUCKING / SLIDING FRAMES (Horizontal low profile)
        duck_frames = []
        for i in range(2):
            d_surf = self._create_sprite_surface(PLAYER_DUCK_WIDTH, PLAYER_DUCK_HEIGHT)
            # Low elongated torso
            torso_rect = pygame.Rect(12, 8, 26, 14)
            pygame.draw.rect(d_surf, COLOR_SURFACE, torso_rect, border_radius=3)
            pygame.draw.rect(d_surf, COLOR_NEON_GREEN, torso_rect, width=2, border_radius=3)
            pygame.draw.rect(d_surf, COLOR_NEON_CYAN, (20, 12, 8, 5))

            # Head stretched forward
            head_rect = pygame.Rect(36, 6, 14, 13)
            pygame.draw.rect(d_surf, (30, 36, 44), head_rect, border_radius=3)
            pygame.draw.rect(d_surf, COLOR_NEON_GREEN, head_rect, width=1, border_radius=3)
            # Visor forward
            pygame.draw.rect(d_surf, COLOR_NEON_CYAN, (42, 10, 8, 4))

            # Trailing sliding legs
            leg_y = 18 + (i * 2)
            pygame.draw.line(d_surf, COLOR_NEON_GREEN, (14, 14), (2, leg_y), 4)
            pygame.draw.rect(d_surf, COLOR_WHITE, (0, leg_y - 2, 4, 4))

            # Thruster sparks backwards
            pygame.draw.line(d_surf, COLOR_NEON_AMBER, (6, 12), (0, 12), 2)
            duck_frames.append(d_surf)
        sprites["duck"] = duck_frames

        # 5. CRASHED / GLITCH FRAME
        crash_surf = self._create_sprite_surface(PLAYER_WIDTH, PLAYER_HEIGHT)
        pygame.draw.rect(crash_surf, COLOR_NEON_RED, (8, 10, 24, 34), width=2, border_radius=4)
        pygame.draw.line(crash_surf, COLOR_NEON_RED, (4, 15), (36, 45), 2)
        pygame.draw.line(crash_surf, COLOR_WHITE, (6, 35), (34, 15), 1)
        sprites["crash"] = crash_surf

        return sprites

    def reset(self):
        """Resets the player to start a new game run."""
        self.x = float(self.start_x)
        self.y = float(self.ground_y - PLAYER_HEIGHT)
        self.vy = 0.0
        self.is_grounded = True
        self.is_ducking = False
        self.is_crashed = False
        self.is_invulnerable = False
        self.invulnerable_timer = 0.0
        self.has_shield = False
        self.shield_angle = 0.0
        self.jump_requested = False
        self.jump_held = False
        self.coyote_timer = 0.0
        self.jump_buffer_timer = 0.0
        self.anim_timer = 0.0
        self.anim_frame = 0
        self.trail_history.clear()
        self._update_hitbox()

    def jump(self):
        """Initiates or buffers a jump action."""
        if self.is_crashed:
            return
        self.jump_held = True
        self.jump_buffer_timer = 0.12  # Jump buffer window

    def release_jump(self):
        """Variable jump height handling."""
        self.jump_held = False
        if not self.is_grounded and self.vy < 0:
            self.vy *= VARIABLE_JUMP_REDUCTION

    def duck(self, is_down: bool):
        """Toggles ducking / sliding state."""
        if self.is_crashed:
            return
        self.is_ducking = is_down

    def apply_hit(self) -> bool:
        """
        Handles collision damage.
        Returns True if crash is fatal, False if absorbed by shield/invulnerability.
        """
        if self.is_invulnerable or self.is_crashed:
            return False

        if self.has_shield:
            # Shield absorbs the lethal blow!
            self.has_shield = False
            self.is_invulnerable = True
            self.invulnerable_timer = 0.8  # 0.8s grace invulnerability
            return False

        # Fatal crash
        self.is_crashed = True
        self.vy = -6.0
        return True

    def _update_hitbox(self):
        """Adjusts the player's bounding rect dynamically."""
        if self.is_ducking and self.is_grounded:
            self.width = PLAYER_DUCK_WIDTH
            self.height = PLAYER_DUCK_HEIGHT
            # Forgiving collision margins
            margin_x = 4
            margin_y = 3
            self.rect = pygame.Rect(
                int(self.x + margin_x),
                int(self.y + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT) + margin_y),
                self.width - (margin_x * 2),
                self.height - (margin_y * 2)
            )
        else:
            self.width = PLAYER_WIDTH
            self.height = PLAYER_HEIGHT
            margin_x = 5
            margin_y = 4
            self.rect = pygame.Rect(
                int(self.x + margin_x),
                int(self.y + margin_y),
                self.width - (margin_x * 2),
                self.height - (margin_y * 2)
            )

    def update(self, dt: float, particle_manager=None, audio_manager=None):
        """Updates physics, timers, animations, and particle emissions."""
        # Timers
        if self.invulnerable_timer > 0:
            self.invulnerable_timer -= dt
            if self.invulnerable_timer <= 0:
                self.is_invulnerable = False

        if self.jump_buffer_timer > 0:
            self.jump_buffer_timer -= dt

        if self.is_grounded:
            self.coyote_timer = 0.09
        elif self.coyote_timer > 0:
            self.coyote_timer -= dt

        # Handle Crash physics
        if self.is_crashed:
            self.vy += GRAVITY * dt * 60.0
            self.y += self.vy * dt * 60.0
            if self.y > self.ground_y - PLAYER_HEIGHT:
                self.y = self.ground_y - PLAYER_HEIGHT
                self.vy = 0.0
            self._update_hitbox()
            return

        # Execute buffered jump
        if self.jump_buffer_timer > 0 and (self.is_grounded or self.coyote_timer > 0):
            self.vy = JUMP_VELOCITY
            self.is_grounded = False
            self.coyote_timer = 0.0
            self.jump_buffer_timer = 0.0
            if particle_manager:
                particle_manager.emit_jump_burst(self.x + PLAYER_WIDTH // 2, self.ground_y)
            if audio_manager:
                audio_manager.play("jump")

        # Gravity & Vertical Movement
        curr_gravity = GRAVITY
        if self.is_ducking and not self.is_grounded:
            # Fast fall downward
            curr_gravity *= FAST_FALL_ACCEL
        elif self.vy > 0:
            # Natural falling weight
            curr_gravity *= 1.15

        self.vy += curr_gravity * dt * 60.0
        self.y += self.vy * dt * 60.0

        # Ground collision check
        standing_y = self.ground_y - PLAYER_HEIGHT
        if self.y >= standing_y:
            self.y = standing_y
            self.vy = 0.0
            self.is_grounded = True
        else:
            self.is_grounded = False

        self._update_hitbox()

        # Animation timing
        self.anim_timer += dt
        if self.is_grounded:
            anim_speed = 0.07 if not self.is_ducking else 0.12
            if self.anim_timer >= anim_speed:
                self.anim_timer = 0.0
                self.anim_frame = (self.anim_frame + 1) % 6
        else:
            self.anim_frame = 0

        # Shield rotation
        if self.has_shield:
            self.shield_angle = (self.shield_angle + 120.0 * dt) % 360.0

        # Particle emissions
        if particle_manager and self.is_grounded:
            if self.is_ducking:
                particle_manager.emit_duck_sparks(self.x + 8, self.ground_y - 2)
            else:
                particle_manager.emit_run_sparks(self.x + 12, self.ground_y - 1)

        # Motion trail recording
        if len(self.trail_history) > 4:
            self.trail_history.pop(0)
        self.trail_history.append((self.x, self.y, self.is_ducking, self.is_grounded))

    def draw(self, surface: pygame.Surface):
        """Renders the player character, motion trails, and shield aura."""
        # Draw motion trail shadows if moving
        for idx, (tx, ty, t_duck, t_ground) in enumerate(self.trail_history[:-1]):
            alpha = int(35 * (idx + 1) / len(self.trail_history))
            trail_surf = pygame.Surface((PLAYER_WIDTH if not t_duck else PLAYER_DUCK_WIDTH,
                                        PLAYER_HEIGHT if not t_duck else PLAYER_DUCK_HEIGHT),
                                       pygame.SRCALPHA)
            trail_surf.fill((*COLOR_NEON_CYAN, alpha))
            py = ty if not (t_duck and t_ground) else ty + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT)
            surface.blit(trail_surf, (int(tx), int(py)))

        # Invulnerability flicker (flicker visibility every 0.08s)
        if self.is_invulnerable and int(self.invulnerable_timer * 20) % 2 == 0:
            return

        # Select sprite
        if self.is_crashed:
            sprite = self.sprites["crash"]
            draw_y = self.y
        elif self.is_ducking and self.is_grounded:
            sprite = self.sprites["duck"][self.anim_frame % len(self.sprites["duck"])]
            draw_y = self.y + (PLAYER_HEIGHT - PLAYER_DUCK_HEIGHT)
        elif not self.is_grounded:
            sprite = self.sprites["jump"] if self.vy < 1.0 else self.sprites["fall"]
            draw_y = self.y
        else:
            sprite = self.sprites["run"][self.anim_frame % len(self.sprites["run"])]
            draw_y = self.y

        surface.blit(sprite, (int(self.x), int(draw_y)))

        # Draw Shield Hologram
        if self.has_shield and not self.is_crashed:
            self._draw_shield(surface)

    def _draw_shield(self, surface: pygame.Surface):
        """Renders a rotating holographic hexagon shield."""
        center_x = int(self.x + PLAYER_WIDTH // 2)
        center_y = int(self.y + PLAYER_HEIGHT // 2)
        radius = 32

        # Draw hexagon points
        points = []
        for i in range(6):
            rad = math.radians(self.shield_angle + i * 60)
            px = center_x + int(radius * math.cos(rad))
            py = center_y + int(radius * math.sin(rad))
            points.append((px, py))

        # Glowing outer hexagon
        shield_surf = pygame.Surface((radius * 2 + 16, radius * 2 + 16), pygame.SRCALPHA)
        local_center = (radius + 8, radius + 8)
        local_points = []
        for px, py in points:
            local_points.append((px - center_x + local_center[0], py - center_y + local_center[1]))

        # Semi-transparent shield interior
        pygame.draw.polygon(shield_surf, (0, 240, 255, 35), local_points)
        pygame.draw.polygon(shield_surf, COLOR_NEON_CYAN, local_points, width=2)
        # Orbiting node sparks
        for lp in local_points:
            pygame.draw.circle(shield_surf, COLOR_WHITE, lp, 2)

        surface.blit(shield_surf, (center_x - local_center[0], center_y - local_center[1]))
