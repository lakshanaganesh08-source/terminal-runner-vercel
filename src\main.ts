/**
 * Application Entry Point and Event Dispatcher for Terminal Runner
 */

import { Game } from './game.ts';
import { GameState } from './types.ts';

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element #game-canvas not found");
    return;
  }

  const game = new Game(canvas);
  game.start();

  // Helper to unlock audio on first interaction
  const unlockAudio = () => {
    game.audio.init();
  };

  // Keyboard Event Listeners
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    unlockAudio();

    // Prevent default scrolling for game keys
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }

    // Instant restart anytime
    if (e.code === "KeyR") {
      game.startNewGame();
      return;
    }

    // Pause toggle
    if (e.code === "KeyP" || e.code === "Escape") {
      game.togglePause();
      return;
    }

    // Audio mute toggle
    if (e.code === "KeyM") {
      const isMuted = game.audio.toggleMute();
      updateMuteButtonUI(isMuted);
      return;
    }

    // Jump / Initiate Run
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      if (game.state === GameState.START || game.state === GameState.GAME_OVER) {
        game.startNewGame();
      } else if (game.state === GameState.PLAYING) {
        game.player.jump();
      }
      return;
    }

    // Duck / Slide
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      if (game.state === GameState.PLAYING) {
        game.player.duck(true);
        game.audio.play("duck");
      }
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }

    // Jump Release (Variable jump height damping)
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      if (game.state === GameState.PLAYING) {
        game.player.releaseJump();
      }
    }

    // Duck Release
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      if (game.state === GameState.PLAYING) {
        game.player.duck(false);
      }
    }
  });

  // Canvas Click/Touch for Game Start / Jump
  canvas.addEventListener("pointerdown", () => {
    unlockAudio();
    if (game.state === GameState.START || game.state === GameState.GAME_OVER) {
      game.startNewGame();
    } else if (game.state === GameState.PLAYING) {
      game.player.jump();
    }
  });

  canvas.addEventListener("pointerup", () => {
    if (game.state === GameState.PLAYING) {
      game.player.releaseJump();
    }
  });

  // Mobile / On-screen Touch Controls Binding
  const btnJump = document.getElementById("btn-jump");
  const btnDuck = document.getElementById("btn-duck");
  const btnPause = document.getElementById("btn-pause");
  const btnRestart = document.getElementById("btn-restart");
  const btnSound = document.getElementById("btn-sound");

  if (btnJump) {
    btnJump.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      unlockAudio();
      if (game.state === GameState.START || game.state === GameState.GAME_OVER) {
        game.startNewGame();
      } else if (game.state === GameState.PLAYING) {
        game.player.jump();
      }
    });
    btnJump.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (game.state === GameState.PLAYING) {
        game.player.releaseJump();
      }
    });
  }

  if (btnDuck) {
    btnDuck.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      unlockAudio();
      if (game.state === GameState.PLAYING) {
        game.player.duck(true);
        game.audio.play("duck");
      }
    });
    btnDuck.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (game.state === GameState.PLAYING) {
        game.player.duck(false);
      }
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", () => {
      unlockAudio();
      game.togglePause();
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      unlockAudio();
      game.startNewGame();
    });
  }

  if (btnSound) {
    btnSound.addEventListener("click", () => {
      unlockAudio();
      const isMuted = game.audio.toggleMute();
      updateMuteButtonUI(isMuted);
    });
  }

  function updateMuteButtonUI(isMuted: boolean) {
    if (btnSound) {
      btnSound.textContent = isMuted ? "🔇 SOUND: OFF" : "🔊 SOUND: ON";
      btnSound.classList.toggle("active", !isMuted);
    }
  }
});
