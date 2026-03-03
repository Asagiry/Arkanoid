import { CAPSULES, GAME_STATE, PLAYFIELD } from "./constants.js";
import { ArkanoidProgression } from "./ArkanoidProgression.js";
import { clamp, weightedPick } from "./utils.js";

export class ArkanoidPowerups extends ArkanoidProgression {
  spawnCapsuleFromBrick(brick) {
    if (this.capsules.length > 0 || this.balls.length > 1) {
      return;
    }
    if (brick.silver || brick.unbreakable) {
      return;
    }
    this.breakCounter += 1;
    if (this.breakCounter < this.nextCapsuleBreak) {
      return;
    }
    this.breakCounter = 0;
    this.nextCapsuleBreak = this.rollNextCapsuleBreak();

    const capsuleType = weightedPick(CAPSULES, (capsule) => capsule.weight);
    this.capsules.push({
      id: capsuleType.id,
      label: capsuleType.label,
      color: capsuleType.color,
      x: brick.x + brick.w * 0.5,
      y: brick.y + brick.h * 0.5,
      w: 8,
      h: 8,
      vy: 42,
    });
  }

  applyCapsule(id) {
    if (id === "P") {
      this.lives += 1;
      this.addScore(1000);
      this.audio.capsule();
      return;
    }
    if (id === "B") {
      this.gateOpen = true;
      this.activePower = "B";
      this.audio.capsule();
      return;
    }

    this.resetPowerState();

    if (id === "E") {
      this.paddle.w = 48;
      this.paddle.x = clamp(this.paddle.x - 8, PLAYFIELD.left, PLAYFIELD.right - this.paddle.w);
      this.activePower = "E";
    } else if (id === "S") {
      this.activePower = "S";
      for (const ball of this.balls) {
        ball.vx *= 0.75;
        ball.vy *= 0.75;
      }
    } else if (id === "C") {
      this.paddle.mode = "catch";
      this.activePower = "C";
    } else if (id === "L") {
      this.paddle.mode = "laser";
      this.activePower = "L";
    } else if (id === "D") {
      this.activePower = "D";
      this.spawnMultiball();
    }

    this.audio.capsule();
    this.flash = 0.18;
  }

  spawnMultiball() {
    if (this.balls.length !== 1) {
      return;
    }
    const source = this.balls[0];
    if (source.stuck) {
      source.stuck = false;
      source.vx = 0;
      source.vy = -this.getTempoSpeedTarget();
    }
    const speed = Math.hypot(source.vx, source.vy);
    const variants = [-0.55, 0.55];
    for (const delta of variants) {
      const angle = Math.atan2(source.vy, source.vx) + delta;
      this.balls.push({
        x: source.x,
        y: source.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2,
        stuck: false,
        stickOffset: 0,
        exited: false,
        trail: [],
      });
    }
  }

  fireLaser() {
    if (
      (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.BOSS) ||
      this.paddle.mode !== "laser"
    ) {
      return;
    }
    if (this.paddle.laserCooldown > 0) {
      return;
    }
    const y = this.paddle.y - 2;
    this.lasers.push({ x: this.paddle.x + 5, y, vy: -220 });
    this.lasers.push({ x: this.paddle.x + this.paddle.w - 6, y, vy: -220 });
    this.paddle.laserCooldown = 0.21;
    this.audio.laser();
  }

  getSpeedCap() {
    return this.activePower === "S" ? this.ballSpeedCap * 0.78 : this.ballSpeedCap;
  }

  normalizeBallSpeed(ball, lockToTempo = false) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= 0.001) {
      return;
    }
    const cap = this.getSpeedCap();
    const tempoTarget = this.getTempoSpeedTarget();
    const min = lockToTempo ? tempoTarget : this.getBallSpeed(this.ballBaseSpeed * 0.72);
    const target = clamp(lockToTempo ? tempoTarget : speed, min, cap);
    if (Math.abs(target - speed) < 0.0001) {
      return;
    }
    const ratio = target / speed;
    ball.vx *= ratio;
    ball.vy *= ratio;

    // Keep trajectories readable and avoid near-horizontal loops.
    const minVertical = target * 0.34;
    if (Math.abs(ball.vy) < minVertical) {
      const signY = ball.vy < 0 ? -1 : 1;
      const signX = ball.vx < 0 ? -1 : 1;
      ball.vy = signY * minVertical;
      const remaining = Math.max(0, target * target - ball.vy * ball.vy);
      ball.vx = signX * Math.sqrt(remaining);
    }
  }

  resolveBrickHit(brick, fromLaser = false) {
    if (brick.unbreakable && this.activePower !== "B") {
      this.audio.wall();
      this.spawnParticles(brick.x + brick.w * 0.5, brick.y + brick.h * 0.5, "#ffcb67", 7);
      return false;
    }

    brick.hp -= 1;
    if (brick.unbreakable && this.activePower === "B") {
      brick.hp = 0;
    }
    this.audio.brick(brick.silver);
    this.shake = Math.max(this.shake, brick.silver || brick.unbreakable ? 1.6 : 1.1);

    if (brick.hp > 0) {
      this.addScore(brick.points);
      return false;
    }

    brick.alive = false;
    this.addScore(brick.points);
    this.spawnParticles(brick.x + brick.w * 0.5, brick.y + brick.h * 0.5, brick.color, 9);
    this.spawnCapsuleFromBrick(brick);

    if (!fromLaser) {
      this.registerBrickBreak();
      for (const ball of this.balls) {
        this.normalizeBallSpeed(ball, true);
      }
    }
    return true;
  }

  updateCapsules(dt) {
    for (let i = this.capsules.length - 1; i >= 0; i -= 1) {
      const capsule = this.capsules[i];
      capsule.y += capsule.vy * dt;

      const caught =
        capsule.x + capsule.w * 0.5 >= this.paddle.x &&
        capsule.x - capsule.w * 0.5 <= this.paddle.x + this.paddle.w &&
        capsule.y + capsule.h * 0.5 >= this.paddle.y &&
        capsule.y - capsule.h * 0.5 <= this.paddle.y + this.paddle.h;

      if (caught) {
        this.applyCapsule(capsule.id);
        this.capsules.splice(i, 1);
        continue;
      }
      if (capsule.y - capsule.h > PLAYFIELD.bottom + 6) {
        this.capsules.splice(i, 1);
      }
    }
  }

  updateLasers(dt) {
    for (let i = this.lasers.length - 1; i >= 0; i -= 1) {
      const laser = this.lasers[i];
      laser.y += laser.vy * dt;

      let consumed = false;
      for (const brick of this.bricks) {
        if (!brick.alive) {
          continue;
        }
        const hit =
          laser.x >= brick.x &&
          laser.x <= brick.x + brick.w &&
          laser.y >= brick.y &&
          laser.y <= brick.y + brick.h;
        if (!hit) {
          continue;
        }
        this.resolveBrickHit(brick, true);
        consumed = true;
        break;
      }

      if (!consumed && this.boss) {
        const hitCore =
          laser.x >= this.boss.coreX &&
          laser.x <= this.boss.coreX + this.boss.coreW &&
          laser.y >= this.boss.coreY &&
          laser.y <= this.boss.coreY + this.boss.coreH;
        if (hitCore) {
          this.damageBoss();
          consumed = true;
        }
      }

      if (!consumed && this.hitEnemyAt(laser.x, laser.y, true)) {
        consumed = true;
      }

      if (consumed || laser.y < PLAYFIELD.top - 8) {
        this.lasers.splice(i, 1);
      }
    }
  }
}
