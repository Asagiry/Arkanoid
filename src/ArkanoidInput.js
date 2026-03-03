import { GAME_STATE, VIRTUAL_WIDTH } from "./constants.js";
import { ArkanoidPersistence } from "./ArkanoidPersistence.js";
import { clamp } from "./utils.js";

export class ArkanoidInput extends ArkanoidPersistence {
  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.input.fastForwardLeftMouse = false;
        this.input.fastForwardRightMouse = false;
        if (
          this.state === GAME_STATE.PLAYING ||
          this.state === GAME_STATE.ROUND_INTRO ||
          this.state === GAME_STATE.SERVE ||
          this.state === GAME_STATE.BOSS
        ) {
          this.lastState = this.state;
          this.state = GAME_STATE.PAUSED;
          this.autoPaused = true;
          this.pauseSelection = 0;
          this.setBootNote("PAUSE", false);
        }
        return;
      }

      if (this.autoPaused && this.state === GAME_STATE.PAUSED) {
        this.resumeFromPause();
      }
    });

    window.addEventListener("blur", () => {
      this.input.fastForwardLeftMouse = false;
      this.input.fastForwardRightMouse = false;
    });

    window.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    document.addEventListener("selectstart", (event) => {
      event.preventDefault();
    });
    document.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
    window.addEventListener("mousedown", (event) => {
      this.syncMouseButtons(event.buttons);
    });
    window.addEventListener("mouseup", (event) => {
      this.syncMouseButtons(event.buttons);
    });

    window.addEventListener("keydown", (event) => {
      if (event.repeat) {
        return;
      }
      if (this.state === GAME_STATE.NAME_ENTRY) {
        event.preventDefault();
        this.audio.unlock();
        this.handleNameEntryInput(event);
        return;
      }
      if (this.state === GAME_STATE.TUTORIAL) {
        event.preventDefault();
        this.audio.unlock();
        this.handleTutorialInput(event);
        return;
      }
      if (this.state === GAME_STATE.MENU) {
        if (this.menuLeaderboardOpened) {
          if (
            event.code === "Space" ||
            event.code === "Enter" ||
            event.code === "Escape" ||
            event.code === "Backspace"
          ) {
            event.preventDefault();
            this.closeLeaderboardView();
            return;
          }
          if (
            event.code === "ArrowUp" ||
            event.code === "KeyW" ||
            event.code === "ArrowLeft" ||
            event.code === "KeyA" ||
            event.code === "ArrowDown" ||
            event.code === "KeyS" ||
            event.code === "ArrowRight" ||
            event.code === "KeyD"
        ) {
          event.preventDefault();
          this.closeLeaderboardView();
          if (
            event.code === "ArrowUp" ||
            event.code === "KeyW" ||
            event.code === "ArrowLeft" ||
            event.code === "KeyA"
          ) {
            this.selectMenuItem(-1);
          } else {
            this.selectMenuItem(1);
          }
          return;
        }
      }
        if (
          event.code === "ArrowUp" ||
          event.code === "KeyW" ||
          event.code === "ArrowLeft" ||
          event.code === "KeyA"
        ) {
          event.preventDefault();
          this.selectMenuItem(-1);
          return;
        }
        if (
          event.code === "ArrowDown" ||
          event.code === "KeyS" ||
          event.code === "ArrowRight" ||
          event.code === "KeyD"
        ) {
          event.preventDefault();
          this.selectMenuItem(1);
          return;
        }
        if (event.code === "Digit1") {
          this.menuSelection = 1;
          this.menuPage = 0;
          this.menuPageTimer = 8;
          return;
        }
        if (event.code === "Digit2") {
          this.menuSelection = 2;
          this.menuPage = 0;
          this.menuPageTimer = 8;
          return;
        }
        if (event.code === "Digit3") {
          this.menuSelection = 3;
          this.menuPage = 0;
          this.menuPageTimer = 8;
          return;
        }
        if (event.code === "F1" || event.code === "KeyT") {
          event.preventDefault();
          this.openTutorial();
          return;
        }
      }
      if (this.state === GAME_STATE.PAUSED) {
        if (
          event.code === "ArrowUp" ||
          event.code === "KeyW" ||
          event.code === "ArrowLeft" ||
          event.code === "KeyA"
        ) {
          event.preventDefault();
          this.pauseSelection = 0;
          return;
        }
        if (
          event.code === "ArrowDown" ||
          event.code === "KeyS" ||
          event.code === "ArrowRight" ||
          event.code === "KeyD"
        ) {
          event.preventDefault();
          this.pauseSelection = 1;
          return;
        }
      }
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        this.input.pointerX = null;
        this.input.left = true;
        return;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD") {
        this.input.pointerX = null;
        this.input.right = true;
        return;
      }

      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        this.audio.unlock();
        this.handlePrimaryAction();
        return;
      }

      if (event.code === "KeyX") {
        this.audio.unlock();
        this.fireLaser();
        return;
      }

      if (event.code === "KeyP" || event.code === "Escape") {
        this.togglePause();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        this.input.left = false;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD") {
        this.input.right = false;
      }
    });

    this.canvas.addEventListener("pointermove", (event) => {
      this.syncMouseButtons(event.buttons);
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const gameX = (x - this.renderOffsetX) / this.scale;
      this.input.pointerX = clamp(gameX, 0, VIRTUAL_WIDTH);
    });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.syncMouseButtons(event.buttons);
      this.audio.unlock();
      if (event.button !== 0) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const gameX = (x - this.renderOffsetX) / this.scale;
      this.input.pointerX = clamp(gameX, 0, VIRTUAL_WIDTH);
      if (this.canUsePrimaryAction()) {
        this.handlePrimaryAction();
      }
    });

    this.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    window.addEventListener("pointerup", (event) => {
      this.syncMouseButtons(event.buttons);
    });
    window.addEventListener("pointercancel", () => {
      this.input.fastForwardLeftMouse = false;
      this.input.fastForwardRightMouse = false;
    });
  }

  handlePrimaryAction() {
    if (this.state === GAME_STATE.MENU) {
      this.tryStartFromMenu();
      return;
    }
    if (this.state === GAME_STATE.TUTORIAL) {
      this.nextTutorialPage();
      return;
    }
    if (this.state === GAME_STATE.NAME_ENTRY) {
      this.commitNameEntry();
      return;
    }
    if (this.state === GAME_STATE.ROUND_INTRO) {
      this.roundIntroTimer = 0;
      return;
    }
    if (
      this.state === GAME_STATE.SERVE ||
      (this.state === GAME_STATE.BOSS && this.balls.some((ball) => ball.stuck))
    ) {
      this.launchServe();
      return;
    }
    if (this.state === GAME_STATE.PAUSED) {
      if (this.pauseSelection === 1) {
        this.returnToMainMenu();
      } else {
        this.resumeFromPause();
      }
      return;
    }
    if (this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.WIN) {
      this.startNewGame();
      return;
    }
    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.BOSS) {
      return;
    }

    if (this.releaseCaughtBalls()) {
      return;
    }
    this.fireLaser();
  }

  togglePause() {
    if (
      this.state === GAME_STATE.PLAYING ||
      this.state === GAME_STATE.ROUND_INTRO ||
      this.state === GAME_STATE.SERVE ||
      this.state === GAME_STATE.BOSS
    ) {
      this.lastState = this.state;
      this.state = GAME_STATE.PAUSED;
      this.autoPaused = false;
      this.pauseSelection = 0;
      this.setBootNote("PAUSE", false);
    } else if (this.state === GAME_STATE.PAUSED) {
      this.resumeFromPause();
    }
  }

  selectMenuItem(step) {
    this.menuSelection = clamp(this.menuSelection + step, 0, 3);
    this.menuPage = 0;
    this.menuPageTimer = 8;
  }

  tryStartFromMenu() {
    if (this.menuLeaderboardOpened) {
      this.closeLeaderboardView();
      return;
    }
    this.menuPage = 0;
    this.menuPageTimer = 8;
    if (this.menuSelection === 0) {
      this.openTutorial();
      return;
    }
    if (this.menuSelection === 1) {
      this.startNewGame();
      return;
    }
    if (this.menuSelection === 2) {
      this.menuNotice = "2 PLAYER MODE NOT AVAILABLE";
      this.menuNoticeTimer = 2.2;
      this.setBootNote("2P MODE NOT AVAILABLE", false);
      this.audio.wall();
      return;
    }
    this.openLeaderboardView();
  }

  returnToMainMenu() {
    this.autoPaused = false;
    this.startNewGame({ toMenu: true });
  }

  resumeFromPause() {
    this.state = this.lastState;
    this.autoPaused = false;
    this.pauseSelection = 0;
    if (this.state === GAME_STATE.ROUND_INTRO) {
      this.setBootNote("READY", false);
    } else {
      this.setBootNote("BALL IN PLAY", true);
    }
  }

  openLeaderboardView() {
    this.menuPage = 2;
    this.menuPageTimer = 999;
    this.menuLeaderboardOpened = true;
    this.menuNotice = "";
    this.menuNoticeTimer = 0;
    this.setBootNote("LEADERBOARD", true);
  }

  closeLeaderboardView() {
    this.menuPage = 0;
    this.menuPageTimer = 8;
    this.menuLeaderboardOpened = false;
    this.menuNotice = "";
    this.menuNoticeTimer = 0;
    this.setBootNote("PRESS SPACE TO START", true);
  }

  syncMouseButtons(buttons) {
    this.input.fastForwardLeftMouse = (buttons & 1) !== 0;
    this.input.fastForwardRightMouse = (buttons & 2) !== 0;
  }

  canUsePrimaryAction() {
    return (
      this.state === GAME_STATE.MENU ||
      this.state === GAME_STATE.NAME_ENTRY ||
      this.state === GAME_STATE.ROUND_INTRO ||
      this.state === GAME_STATE.SERVE ||
      this.state === GAME_STATE.PAUSED ||
      this.state === GAME_STATE.GAME_OVER ||
      this.state === GAME_STATE.WIN ||
      (this.state === GAME_STATE.PLAYING && this.balls.some((ball) => ball.stuck)) ||
      (this.state === GAME_STATE.BOSS && this.balls.some((ball) => ball.stuck))
    );
  }

  handleTutorialInput(event) {
    if (
      event.code === "ArrowLeft" ||
      event.code === "KeyA" ||
      event.code === "ArrowUp" ||
      event.code === "KeyW"
    ) {
      this.prevTutorialPage();
      return;
    }
    if (
      event.code === "ArrowRight" ||
      event.code === "KeyD" ||
      event.code === "ArrowDown" ||
      event.code === "KeyS"
    ) {
      this.nextTutorialPage();
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      this.nextTutorialPage();
      return;
    }
    if (event.code === "Escape" || event.code === "Backspace" || event.code === "KeyM") {
      this.leaveTutorialToMenu();
    }
  }
}
