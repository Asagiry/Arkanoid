import {
  BRICK_TYPES,
  EXTRA_LIFE_FIRST,
  EXTRA_LIFE_STEP,
  GAME_STATE,
  PLAYFIELD,
} from "./constants.js";
import { ArkanoidCore } from "./ArkanoidCore.js";
import { buildBricksFromPattern, getMaxRounds, getRoundPattern } from "./levels.js";
import { Particle } from "./particle.js";
import { clamp } from "./utils.js";

const FAST_LEVELS = new Set([8, 10, 14, 16, 23, 27, 29]);
const SLOW_LEVELS = new Set([11, 13, 17, 28]);
const ENEMY_SPAWN_PATTERN = Object.freeze([1, 0.86, 1.16, 0.93, 1.06]);

const getEnemyDirectorForRound = (roundIndex) => {
  const level = roundIndex + 1;
  if (level <= 3) {
    return { total: 0, limit: 0, interval: 99 };
  }
  if (level <= 11) {
    return { total: 3, limit: 2, interval: 8.8 };
  }
  if (level <= 16) {
    return { total: 4, limit: 2, interval: 7.6 };
  }
  if (level <= 23) {
    return { total: 5, limit: 3, interval: 6.4 };
  }
  return { total: 6, limit: 3, interval: 5.8 };
};

export class ArkanoidProgression extends ArkanoidCore {
  startNewGame({ toMenu = false } = {}) {
    this.score = 0;
    this.lives = 3;
    this.nextExtraLife = EXTRA_LIFE_FIRST;
    this.roundIndex = 0;
    this.boss = null;
    this.bossShots.length = 0;
    this.enemies.length = 0;
    this.serveDirection = 1;
    this.resetBallTempo();
    this.resetPowerState();
    this.loadRound(this.roundIndex);
    this.resetLifeAndServe();

    if (toMenu) {
      this.menuPage = 0;
      this.menuPageTimer = 8;
      this.menuLeaderboardOpened = false;
      this.menuSelection = 1;
      this.menuNotice = "";
      this.menuNoticeTimer = 0;
      this.tutorialPage = 0;
      this.resetMenuDemo();
      this.paddle.x = PLAYFIELD.left + (PLAYFIELD.right - PLAYFIELD.left - this.paddle.w) * 0.5;
      this.paddle.vx = 0;
      const serveBall = this.balls[0];
      if (serveBall) {
        this.attachBallToPaddle(serveBall, 0);
      }
      this.state = GAME_STATE.MENU;
      this.setBootNote("PRESS SPACE TO START", true);
      return;
    }

    this.state = GAME_STATE.ROUND_INTRO;
    this.setBootNote("READY", false);
  }

  loadRound(index) {
    this.roundIndex = index;
    const level = index + 1;
    const phase = Math.floor(index / 8);
    const phaseBase = 102 + phase * 5;
    let modifier = 0;
    if (FAST_LEVELS.has(level)) {
      modifier = 8;
    } else if (SLOW_LEVELS.has(level)) {
      modifier = -6;
    }
    this.ballBaseSpeed = clamp(phaseBase + modifier, 96, 168);
    this.ballSpeedCap = clamp(this.ballBaseSpeed + 86, 182, 244);
    const pattern = getRoundPattern(index);
    this.bricks = buildBricksFromPattern(pattern, index, BRICK_TYPES);
    this.capsules.length = 0;
    this.lasers.length = 0;
    this.breakCounter = 0;
    this.nextCapsuleBreak = this.rollNextCapsuleBreak();
    this.gateOpen = false;
    this.boss = null;
    this.bossShots.length = 0;
    this.enemies.length = 0;
    this.scorePopups.length = 0;
    this.resetBallTempo();
    this.configureEnemyDirector(index);
  }

  initBossRound() {
    this.roundIndex = getMaxRounds();
    this.bricks = [];
    this.capsules.length = 0;
    this.lasers.length = 0;
    this.bossShots.length = 0;
    this.boss = {
      x: 118,
      y: PLAYFIELD.top + 10,
      w: 20,
      h: 12,
      coreX: 127,
      coreY: PLAYFIELD.top + 16,
      coreW: 4,
      coreH: 4,
      hp: 16,
      moveDir: 1,
      moveSpeed: 30,
      shotCooldown: 1.2,
      phase: 0,
    };
    this.ballBaseSpeed = 148;
    this.ballSpeedCap = 250;
    this.enemies.length = 0;
    this.scorePopups.length = 0;
    this.resetBallTempo();
    this.ballTempoTier = 1;
    this.enemySpawnTotal = 0;
    this.enemySpawnRemaining = 0;
    this.enemySpawnLimit = 0;
    this.gateOpen = false;
    this.setBootNote("DOH BATTLE", false);
  }

  resetPowerState() {
    this.activePower = "NONE";
    this.paddle.mode = "normal";
    this.paddle.w = 32;
    this.paddle.laserCooldown = 0;
  }

  resetLifeAndServe() {
    this.resetPowerState();
    this.gateOpen = false;
    this.capsules.length = 0;
    this.lasers.length = 0;
    this.enemies.length = 0;
    this.scorePopups.length = 0;
    this.resetEnemyDirector();
    this.resetBallTempo();
    this.paddle.x = PLAYFIELD.right + 20;
    this.paddle.vx = 0;
    this.balls = [this.createBall()];
    this.attachBallToPaddle(this.balls[0], 0);
    this.roundIntroTimer = 0.8;
    this.state = GAME_STATE.ROUND_INTRO;
    this.setBootNote("READY", false);
  }

  createBall() {
    return {
      x: this.paddle.x + this.paddle.w * 0.5,
      y: this.paddle.y - 3,
      vx: 0,
      vy: 0,
      r: 2,
      stuck: true,
      stickOffset: 0,
      exited: false,
      trail: [],
    };
  }

  attachBallToPaddle(ball, offset = null) {
    const chosenOffset =
      offset === null ? clamp(ball.stickOffset || 0, -this.paddle.w * 0.4, this.paddle.w * 0.4) : offset;
    ball.stickOffset = chosenOffset;
    ball.x = this.paddle.x + this.paddle.w * 0.5 + chosenOffset;
    ball.y = this.paddle.y - ball.r - 1;
    ball.vx = 0;
    ball.vy = 0;
    ball.stuck = true;
    ball.trail.length = 0;
  }

  launchServe() {
    if (this.state !== GAME_STATE.SERVE && this.state !== GAME_STATE.BOSS) {
      return;
    }
    const ball = this.balls[0];
    if (!ball || !ball.stuck) {
      return;
    }

    const speed = this.getTempoSpeedTarget();
    const baseAngle = this.serveDirection >= 0 ? 0.48 : -0.48;
    const angle = clamp(baseAngle, -1.2, 1.2);
    this.serveDirection *= -1;

    ball.stuck = false;
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.abs(Math.cos(angle) * speed);
    this.state = this.boss ? GAME_STATE.BOSS : GAME_STATE.PLAYING;
    this.audio.launch();
    this.setBootNote("BALL IN PLAY", true);
  }

  releaseCaughtBalls() {
    let released = false;
    for (const ball of this.balls) {
      if (!ball.stuck) {
        continue;
      }
      const offsetNorm = clamp(ball.stickOffset / (this.paddle.w * 0.5), -1, 1);
      const angle = this.getPaddleBounceAngle(offsetNorm);
      const speed = this.getTempoSpeedTarget();
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.abs(Math.cos(angle) * speed);
      ball.stuck = false;
      released = true;
    }
    if (released && (this.state === GAME_STATE.SERVE || this.state === GAME_STATE.BOSS)) {
      this.state = this.boss ? GAME_STATE.BOSS : GAME_STATE.PLAYING;
      this.setBootNote("BALL IN PLAY", true);
      this.audio.launch();
    }
    return released;
  }

  getBallSpeed(base) {
    if (this.activePower === "S") {
      return base * 0.75;
    }
    return base;
  }

  configureEnemyDirector(roundIndex) {
    const config = getEnemyDirectorForRound(roundIndex);
    this.enemySpawnTotal = config.total;
    this.enemySpawnRemaining = config.total;
    this.enemySpawnLimit = config.limit;
    this.enemySpawnInterval = config.interval;
    this.enemySpawnPattern = ENEMY_SPAWN_PATTERN.slice();
    this.enemySpawnPatternIndex = 0;
    this.enemySpawnTimer = this.enemySpawnInterval * 0.72;
  }

  resetEnemyDirector() {
    this.enemySpawnRemaining = this.enemySpawnTotal;
    this.enemySpawnPatternIndex = 0;
    this.enemySpawnTimer = this.enemySpawnInterval * 0.72;
  }

  resetBallTempo() {
    this.ballBrickHits = 0;
    this.ballTempoTier = 0;
    this.ceilingBoostTimer = 0;
  }

  updateBallTempo(dt) {
    if (this.ceilingBoostTimer > 0) {
      this.ceilingBoostTimer = Math.max(0, this.ceilingBoostTimer - dt);
    }
  }

  registerBrickBreak() {
    this.ballBrickHits += 1;
    if (this.ballBrickHits >= 26) {
      this.ballTempoTier = Math.max(this.ballTempoTier, 3);
    } else if (this.ballBrickHits >= 12) {
      this.ballTempoTier = Math.max(this.ballTempoTier, 2);
    } else if (this.ballBrickHits >= 4) {
      this.ballTempoTier = Math.max(this.ballTempoTier, 1);
    }
  }

  markTopWallBounce() {
    this.ballTempoTier = Math.max(this.ballTempoTier, 1);
    this.ceilingBoostTimer = 1.35;
  }

  getTempoSpeedTarget() {
    const tierScale = [1, 1.07, 1.15, 1.23];
    let speed = this.getBallSpeed(this.ballBaseSpeed) * tierScale[this.ballTempoTier];
    if (this.ceilingBoostTimer > 0) {
      speed *= 1.05;
    }
    return Math.min(speed, this.getSpeedCap());
  }

  getPaddleBounceAngle(offsetNorm) {
    const segments = [-1.05, -0.79, -0.52, 0.52, 0.79, 1.05];
    const zone = Math.floor(clamp((offsetNorm + 1) * 0.5, 0, 0.9999) * segments.length);
    return segments[zone];
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  spawnScorePopup(x, y, text, color = "#fff4b6") {
    this.scorePopups.push({
      x,
      y,
      text,
      color,
      life: 0.72,
      maxLife: 0.72,
    });
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    while (this.score >= this.nextExtraLife) {
      this.lives += 1;
      this.nextExtraLife =
        this.nextExtraLife === EXTRA_LIFE_FIRST
          ? EXTRA_LIFE_STEP
          : this.nextExtraLife + EXTRA_LIFE_STEP;
    }
  }

  finishRun(didWin) {
    this.lastRunResult = {
      score: this.score,
      didWin,
      rank: this.getLeaderboardRank(this.score),
    };
    if (this.qualifiesForLeaderboard(this.score)) {
      this.beginNameEntry(this.score, didWin);
      return;
    }
    this.state = didWin ? GAME_STATE.WIN : GAME_STATE.GAME_OVER;
    this.setBootNote(didWin ? "CONGRATULATIONS - SPACE FOR NEW GAME" : "GAME OVER - SPACE TO RESTART", false);
    if (didWin) {
      this.audio.win();
    } else {
      this.audio.gameOver();
    }
  }

  loseLife() {
    this.lives -= 1;
    this.audio.loseLife();
    this.flash = 0.2;
    this.shake = 2.4;

    if (this.lives <= 0) {
      this.finishRun(false);
      return;
    }
    this.resetLifeAndServe();
  }

  completeRound(viaGate) {
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    if (viaGate) {
      this.addScore(10000);
    }
    this.state = GAME_STATE.ROUND_CLEAR;
    this.roundClearTimer = 1.25;
    this.capsules.length = 0;
    this.lasers.length = 0;
    this.enemies.length = 0;
    this.gateOpen = false;
    this.setBootNote("ROUND CLEAR", false);
    this.audio.roundClear();
  }

  hasBreakableBricks() {
    return this.bricks.some((brick) => brick.alive && !brick.unbreakable);
  }
}
