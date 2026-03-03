import { GAME_STATE, PLAYFIELD, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants.js";
import { ArkanoidTutorial } from "./ArkanoidTutorial.js";
import { SoundEngine } from "./sound.js";
import { randomIn } from "./utils.js";

export class ArkanoidCore extends ArkanoidTutorial {
  constructor(canvas, bootNote) {
    super();
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.bootNote = bootNote;
    this.audio = new SoundEngine();

    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.scale = 1;
    this.renderOffsetX = 0;
    this.renderOffsetY = 0;

    this.state = GAME_STATE.MENU;
    this.lastState = this.state;
    this.autoPaused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 120;
    this.maxFrameDt = 1 / 30;
    this.roundClearTimer = 0;
    this.roundIntroTimer = 0;
    this.pauseSelection = 0;

    this.roundIndex = 0;
    this.score = 0;
    const storedHighScore = this.readHighScore();
    this.leaderboard = this.readLeaderboard();
    const boardHighScore = this.leaderboard[0]?.score || 0;
    this.highScore = Math.max(storedHighScore, boardHighScore);
    if (this.highScore !== storedHighScore) {
      this.saveHighScore();
    }
    this.lastRunResult = null;
    this.lives = 3;
    this.nextExtraLife = 20000;
    this.nameEntry = {
      chars: ["A", "A", "A"],
      index: 0,
      score: 0,
      didWin: false,
      rank: null,
    };

    this.paddle = {
      x: PLAYFIELD.left + 72,
      y: PLAYFIELD.bottom - 10,
      w: 32,
      h: 8,
      speed: 168,
      vx: 0,
      mode: "normal",
      laserCooldown: 0,
    };

    this.ballBaseSpeed = 102;
    this.ballSpeedCap = 188;
    this.balls = [];
    this.lasers = [];
    this.capsules = [];
    this.particles = [];
    this.scorePopups = [];
    this.bricks = [];
    this.boss = null;
    this.bossShots = [];
    this.enemies = [];
    this.enemySpawnTimer = 5.2;
    this.enemySpawnInterval = 8.2;
    this.enemySpawnLimit = 2;
    this.enemySpawnTotal = 2;
    this.enemySpawnRemaining = 2;
    this.enemySpawnPattern = [1];
    this.enemySpawnPatternIndex = 0;

    this.activePower = "NONE";
    this.gateOpen = false;
    this.breakCounter = 0;
    this.nextCapsuleBreak = this.rollNextCapsuleBreak();

    this.menuPage = 0;
    this.menuPageTimer = 8;
    this.menuSelection = 1;
    this.menuLeaderboardOpened = false;
    this.menuNotice = "";
    this.menuNoticeTimer = 0;
    this.menuDemo = {
      areaX: PLAYFIELD.left + 24,
      areaY: 118,
      areaW: PLAYFIELD.right - PLAYFIELD.left - 48,
      areaH: 58,
      paddleX: 0,
      paddleW: 22,
      paddleH: 4,
      paddleY: 0,
      ballX: 0,
      ballY: 0,
      ballVx: 66,
      ballVy: -82,
      flash: 0,
    };
    this.resetMenuDemo();
    this.tutorialPage = 0;
    this.tutorialDemo = {
      areaX: 0,
      areaY: 0,
      areaW: 0,
      areaH: 0,
      paddleX: 0,
      paddleY: 0,
      paddleW: 0,
      paddleH: 0,
      ballX: 0,
      ballY: 0,
      ballVx: 0,
      ballVy: 0,
      ballR: 2,
      flash: 0,
      respawnTimer: 0,
      exitFlash: 0,
      ballExited: false,
      bricks: [],
      gateTop: 0,
      gateBottom: 0,
      gateOpen: false,
      capsuleX: 0,
      capsuleY: 0,
      capsuleVy: 0,
      capsuleActive: false,
      capsuleLabel: "E",
      capsuleTimer: 0,
    };
    this.resetTutorialDemo();

    this.stars = [];
    this.shake = 0;
    this.flash = 0;

    this.input = {
      left: false,
      right: false,
      pointerX: null,
      fastForwardLeftMouse: false,
      fastForwardRightMouse: false,
    };

    this.bindEvents();
    this.resize();
    this.startNewGame({ toMenu: true });
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  setBootNote(text, hidden = false) {
    this.bootNote.textContent = text;
    this.bootNote.classList.toggle("hidden", hidden);
  }

  resize() {
    this.viewportWidth = Math.max(320, window.innerWidth);
    this.viewportHeight = Math.max(240, window.innerHeight);
    this.canvas.width = this.viewportWidth;
    this.canvas.height = this.viewportHeight;
    this.canvas.style.width = `${this.viewportWidth}px`;
    this.canvas.style.height = `${this.viewportHeight}px`;
    this.ctx.imageSmoothingEnabled = false;

    this.scale = Math.max(
      1,
      Math.floor(Math.min(this.viewportWidth / VIRTUAL_WIDTH, this.viewportHeight / VIRTUAL_HEIGHT))
    );
    this.renderOffsetX = Math.floor((this.viewportWidth - VIRTUAL_WIDTH * this.scale) * 0.5);
    this.renderOffsetY = Math.floor((this.viewportHeight - VIRTUAL_HEIGHT * this.scale) * 0.5);

    this.rebuildStars();
  }

  rebuildStars() {
    this.stars = [];
    for (let i = 0; i < 40; i += 1) {
      this.stars.push({
        x: Math.floor(randomIn(0, VIRTUAL_WIDTH)),
        y: Math.floor(randomIn(0, VIRTUAL_HEIGHT)),
        size: Math.random() > 0.75 ? 2 : 1,
        speed: randomIn(2, 8),
      });
    }
  }

  rollNextCapsuleBreak() {
    return Math.floor(randomIn(8, 17));
  }

  frame(timestamp) {
    if (!this.lastTime) {
      this.lastTime = timestamp;
    }
    const dt = Math.min((timestamp - this.lastTime) / 1000, this.maxFrameDt);
    this.lastTime = timestamp;
    this.accumulator += dt * this.getTimeScale();

    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.draw();
    requestAnimationFrame(this.frame);
  }

  getTimeScale() {
    const left = this.input.fastForwardLeftMouse;
    const right = this.input.fastForwardRightMouse;
    const pointerScale = left ? (right ? 4 : 2) : 1;
    if (pointerScale === 1) {
      return 1;
    }
    if (
      this.state === GAME_STATE.PLAYING ||
      this.state === GAME_STATE.BOSS ||
      this.state === GAME_STATE.SERVE ||
      this.state === GAME_STATE.ROUND_INTRO ||
      this.state === GAME_STATE.ROUND_CLEAR
    ) {
      return pointerScale;
    }
    return 1;
  }
}
