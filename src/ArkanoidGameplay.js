import { GAME_STATE, PLAYFIELD } from "./constants.js";
import { ArkanoidEnemies } from "./ArkanoidEnemies.js";
import { getMaxRounds } from "./levels.js";
import { clamp, randomIn } from "./utils.js";

export class ArkanoidGameplay extends ArkanoidEnemies {
  updateMenu(dt) {
    this.updatePaddle(dt);
    if (this.menuLeaderboardOpened) {
      return;
    }
    this.updateMenuDemo(dt);
    if (this.menuNoticeTimer > 0) {
      this.menuNoticeTimer = Math.max(0, this.menuNoticeTimer - dt);
      if (this.menuNoticeTimer === 0) {
        this.menuNotice = "";
      }
    }
    this.menuPageTimer -= dt;
    if (this.menuPageTimer <= 0) {
      this.menuPage = (this.menuPage + 1) % 3;
      this.menuPageTimer = 8;
    }
  }

  updateReadyIntro(dt) {
    if (this.state !== GAME_STATE.ROUND_INTRO) {
      return;
    }

    const targetX = PLAYFIELD.left + (PLAYFIELD.right - PLAYFIELD.left - this.paddle.w) * 0.5;
    const prevX = this.paddle.x;
    const introSpeed = 170;
    this.paddle.x = Math.max(targetX, this.paddle.x - introSpeed * dt);
    this.paddle.vx = (this.paddle.x - prevX) / Math.max(dt, 1e-5);

    const serveBall = this.balls[0];
    if (serveBall) {
      this.attachBallToPaddle(serveBall, 0);
    }

    this.roundIntroTimer -= dt;
    if (this.paddle.x <= targetX && this.roundIntroTimer <= 0) {
      this.paddle.x = targetX;
      this.paddle.vx = 0;
      this.state = GAME_STATE.SERVE;
      this.setBootNote("PRESS SPACE TO LAUNCH", false);
    }
  }

  updatePaddle(dt) {
    const prevX = this.paddle.x;
    if (this.input.pointerX !== null) {
      const target = clamp(
        this.input.pointerX - this.paddle.w * 0.5,
        PLAYFIELD.left,
        PLAYFIELD.right - this.paddle.w
      );
      this.paddle.x += (target - this.paddle.x) * clamp(dt * 24, 0, 1);
    }

    let axis = 0;
    if (this.input.left) {
      axis -= 1;
    }
    if (this.input.right) {
      axis += 1;
    }
    this.paddle.x += axis * this.paddle.speed * dt;
    this.paddle.x = clamp(this.paddle.x, PLAYFIELD.left, PLAYFIELD.right - this.paddle.w);
    this.paddle.vx = (this.paddle.x - prevX) / Math.max(dt, 1e-5);

    if (this.state === GAME_STATE.SERVE || this.state === GAME_STATE.BOSS) {
      const serveBall = this.balls[0];
      if (serveBall && serveBall.stuck) {
        this.attachBallToPaddle(serveBall, 0);
      }
    } else {
      for (const ball of this.balls) {
        if (ball.stuck) {
          this.attachBallToPaddle(ball, ball.stickOffset);
        }
      }
    }

    if (this.paddle.laserCooldown > 0) {
      this.paddle.laserCooldown -= dt;
    }
  }

  updateBall(ball, dt) {
    if (ball.stuck) {
      this.attachBallToPaddle(ball, ball.stickOffset);
      return;
    }

    const prevX = ball.x;
    const prevY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const inGateRange = ball.y + ball.r >= PLAYFIELD.gateTop && ball.y - ball.r <= PLAYFIELD.gateBottom;

    if (ball.x - ball.r <= PLAYFIELD.left) {
      ball.x = PLAYFIELD.left + ball.r;
      ball.vx = Math.abs(ball.vx);
      this.audio.wall();
    } else if (ball.x + ball.r >= PLAYFIELD.right) {
      if (this.gateOpen && inGateRange) {
        if (ball.x - ball.r > PLAYFIELD.right + 6) {
          ball.exited = true;
          return;
        }
      } else {
        ball.x = PLAYFIELD.right - ball.r;
        ball.vx = -Math.abs(ball.vx);
        this.audio.wall();
      }
    }

    if (ball.y - ball.r <= PLAYFIELD.top) {
      ball.y = PLAYFIELD.top + ball.r;
      ball.vy = Math.abs(ball.vy);
      this.markTopWallBounce();
      this.normalizeBallSpeed(ball, true);
      this.audio.wall();
    }

    const paddleHit =
      ball.vy > 0 &&
      ball.x + ball.r >= this.paddle.x &&
      ball.x - ball.r <= this.paddle.x + this.paddle.w &&
      ball.y + ball.r >= this.paddle.y &&
      ball.y - ball.r <= this.paddle.y + this.paddle.h;

    if (paddleHit) {
      ball.y = this.paddle.y - ball.r - 0.1;
      const hitOffset = (ball.x - (this.paddle.x + this.paddle.w * 0.5)) / (this.paddle.w * 0.5);
      if (this.paddle.mode === "catch") {
        this.attachBallToPaddle(ball, hitOffset * this.paddle.w * 0.35);
        this.audio.paddle();
        return;
      }

      const angle = this.getPaddleBounceAngle(hitOffset);
      const speed = this.getTempoSpeedTarget();
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.abs(Math.cos(angle) * speed);
      this.audio.paddle();
      this.shake = Math.max(this.shake, 1.3);
    }

    for (const brick of this.bricks) {
      if (!brick.alive) {
        continue;
      }
      const overlap =
        ball.x + ball.r >= brick.x &&
        ball.x - ball.r <= brick.x + brick.w &&
        ball.y + ball.r >= brick.y &&
        ball.y - ball.r <= brick.y + brick.h;
      if (!overlap) {
        continue;
      }

      const fromTop = prevY + ball.r <= brick.y;
      const fromBottom = prevY - ball.r >= brick.y + brick.h;
      const fromLeft = prevX + ball.r <= brick.x;
      const fromRight = prevX - ball.r >= brick.x + brick.w;

      if (fromTop) {
        ball.y = brick.y - ball.r - 0.1;
        ball.vy = -Math.abs(ball.vy);
      } else if (fromBottom) {
        ball.y = brick.y + brick.h + ball.r + 0.1;
        ball.vy = Math.abs(ball.vy);
      } else if (fromLeft) {
        ball.x = brick.x - ball.r - 0.1;
        ball.vx = -Math.abs(ball.vx);
      } else if (fromRight) {
        ball.x = brick.x + brick.w + ball.r + 0.1;
        ball.vx = Math.abs(ball.vx);
      } else {
        ball.vy *= -1;
      }

      this.resolveBrickHit(brick, false);
      break;
    }

    if (this.boss) {
      const hitBossBody =
        ball.x + ball.r >= this.boss.x &&
        ball.x - ball.r <= this.boss.x + this.boss.w &&
        ball.y + ball.r >= this.boss.y &&
        ball.y - ball.r <= this.boss.y + this.boss.h;
      if (hitBossBody) {
        const hitCore =
          ball.x + ball.r >= this.boss.coreX &&
          ball.x - ball.r <= this.boss.coreX + this.boss.coreW &&
          ball.y + ball.r >= this.boss.coreY &&
          ball.y - ball.r <= this.boss.coreY + this.boss.coreH;

        const prevWasAbove = prevY + ball.r <= this.boss.y;
        const prevWasBelow = prevY - ball.r >= this.boss.y + this.boss.h;
        if (prevWasAbove) {
          ball.y = this.boss.y - ball.r - 0.1;
          ball.vy = -Math.abs(ball.vy);
        } else if (prevWasBelow) {
          ball.y = this.boss.y + this.boss.h + ball.r + 0.1;
          ball.vy = Math.abs(ball.vy);
        } else {
          const hitLeft = prevX + ball.r <= this.boss.x;
          if (hitLeft) {
            ball.x = this.boss.x - ball.r - 0.1;
            ball.vx = -Math.abs(ball.vx);
          } else {
            ball.x = this.boss.x + this.boss.w + ball.r + 0.1;
            ball.vx = Math.abs(ball.vx);
          }
        }

        if (hitCore) {
          this.damageBoss();
        } else {
          this.audio.wall();
        }
      }
    }

    this.normalizeBallSpeed(ball);

    if (ball.y - ball.r > PLAYFIELD.bottom + 8) {
      ball.dead = true;
      return;
    }

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) {
      ball.trail.shift();
    }
  }

  updateBalls(dt) {
    for (const ball of this.balls) {
      this.updateBall(ball, dt);
    }
    this.balls = this.balls.filter((ball) => !ball.dead);

    const exitedBall = this.balls.some((ball) => ball.exited);
    if (exitedBall) {
      this.completeRound(true);
      return;
    }

    if (this.balls.length === 0) {
      this.loseLife();
      return;
    }

    if (this.boss) {
      return;
    }

    if (!this.hasBreakableBricks()) {
      this.completeRound(false);
    }
  }

  updateStars(dt) {
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > 242) {
        star.y = -2;
        star.x = Math.floor(randomIn(0, 256));
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      this.particles[i].update(dt);
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateScorePopups(dt) {
    for (let i = this.scorePopups.length - 1; i >= 0; i -= 1) {
      const popup = this.scorePopups[i];
      popup.y -= 18 * dt;
      popup.life -= dt;
      if (popup.life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  update(dt) {
    this.updateStars(dt);
    this.updateParticles(dt);
    this.updateScorePopups(dt);
    this.updateBallTempo(dt);
    this.shake *= 0.9;
    if (this.shake < 0.02) {
      this.shake = 0;
    }
    this.flash = Math.max(0, this.flash - dt * 0.9);

    if (this.state === GAME_STATE.MENU) {
      this.updateMenu(dt);
      return;
    }

    if (this.state === GAME_STATE.TUTORIAL) {
      this.updateTutorial(dt);
      return;
    }

    if (this.state === GAME_STATE.PAUSED) {
      this.updatePaddle(dt);
      return;
    }

    if (this.state === GAME_STATE.ROUND_CLEAR) {
      this.roundClearTimer -= dt;
      if (this.roundClearTimer <= 0) {
        const nextRound = this.roundIndex + 1;
        if (nextRound >= getMaxRounds()) {
          this.initBossRound();
          this.resetLifeAndServe();
        } else {
          this.loadRound(nextRound);
          this.resetLifeAndServe();
        }
      }
      this.updatePaddle(dt);
      return;
    }

    if (this.state === GAME_STATE.ROUND_INTRO) {
      this.updateReadyIntro(dt);
      return;
    }

    if (this.state === GAME_STATE.SERVE) {
      this.updatePaddle(dt);
      return;
    }

    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.BOSS) {
      return;
    }

    this.updatePaddle(dt);
    this.updateCapsules(dt);
    this.updateLasers(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateBalls(dt);
  }
}
