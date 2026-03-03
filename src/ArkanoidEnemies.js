import { ENEMY_TYPES, GAME_STATE, PLAYFIELD } from "./constants.js";
import { ArkanoidBoss } from "./ArkanoidBoss.js";
import { clamp, randomIn } from "./utils.js";

const ENEMY_PHASE = Object.freeze({
  EMERGE: "emerge",
  ROAM: "roam",
});

export class ArkanoidEnemies extends ArkanoidBoss {
  getEnemyTypeForRound() {
    const round = this.roundIndex;
    const pool =
      round < 6
        ? [0, 0, 1]
        : round < 16
          ? [0, 1, 1, 2]
          : [0, 1, 2, 2];
    const idx = pool[Math.floor(randomIn(0, pool.length))];
    return ENEMY_TYPES[idx];
  }

  getEnemyLimit() {
    return this.enemySpawnLimit || 0;
  }

  shouldSpawnEnemy() {
    if (this.enemySpawnRemaining <= 0) {
      return false;
    }
    if (this.state !== GAME_STATE.PLAYING || this.boss || this.enemies.length >= this.getEnemyLimit()) {
      return false;
    }
    if (!this.hasBreakableBricks()) {
      return false;
    }
    return this.balls.some((ball) => !ball.stuck);
  }

  spawnEnemy() {
    if (!this.shouldSpawnEnemy()) {
      return false;
    }

    const type = this.getEnemyTypeForRound();
    const topRange = PLAYFIELD.top + 24;
    const bottomRange = PLAYFIELD.bottom - 30;
    const spawnY = randomIn(PLAYFIELD.gateTop + 3, PLAYFIELD.gateBottom - 7);
    const targetY = randomIn(topRange, bottomRange);
    const w = 10;
    const h = 6;
    const emergeStartX = PLAYFIELD.right + randomIn(3, 7);
    const emergeEndX = PLAYFIELD.right - w - 2;
    const baseSpeed = type.speed + Math.min(14, this.roundIndex * 0.45);
    let vy = randomIn(-30, 30);
    if (Math.abs(vy) < 10) {
      vy = vy < 0 ? -12 : 12;
    }

    this.enemies.push({
      id: type.id,
      color: type.color,
      shade: type.shade,
      eye: type.eye,
      points: type.points,
      x: emergeStartX,
      y: spawnY,
      w,
      h,
      vx: 0,
      vy: 0,
      vySeed: vy,
      roamSpeed: baseSpeed,
      turnTimer: randomIn(1.4, 2.6),
      frame: 0,
      anim: 0,
      phase: ENEMY_PHASE.EMERGE,
      emergeT: 0,
      emergeDur: randomIn(0.5, 0.8),
      emergeStartX,
      emergeEndX,
      emergeStartY: spawnY,
      targetY,
      arc: randomIn(-8, 8),
    });
    return true;
  }

  destroyEnemyAt(index, fromLaser = false) {
    const enemy = this.enemies[index];
    if (!enemy) {
      return;
    }
    const bonus = fromLaser ? 40 : 0;
    const gain = enemy.points + bonus;
    this.addScore(gain);
    this.spawnScorePopup(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, String(gain), "#fff3b2");
    this.spawnParticles(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, enemy.color, 10);
    this.audio.enemy();
    this.flash = Math.max(this.flash, 0.12);
    this.shake = Math.max(this.shake, 1.4);
    this.enemies.splice(index, 1);
  }

  hitEnemyAt(x, y, fromLaser = false) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      const hit = x >= enemy.x && x <= enemy.x + enemy.w && y >= enemy.y && y <= enemy.y + enemy.h;
      if (!hit) {
        continue;
      }
      this.destroyEnemyAt(i, fromLaser);
      return true;
    }
    return false;
  }

  updateEnemySpawn(dt) {
    if (this.enemySpawnRemaining <= 0) {
      return;
    }
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      const spawned = this.spawnEnemy();
      if (spawned) {
        this.enemySpawnRemaining -= 1;
        const pattern = this.enemySpawnPattern;
        const mult = pattern[this.enemySpawnPatternIndex % pattern.length];
        this.enemySpawnPatternIndex += 1;
        this.enemySpawnTimer = this.enemySpawnInterval * mult;
      } else {
        this.enemySpawnTimer = 0.22;
      }
    }
  }

  updateEmergingEnemy(enemy, dt) {
    enemy.emergeT += dt;
    const p = clamp(enemy.emergeT / enemy.emergeDur, 0, 1);
    const eased = 1 - (1 - p) * (1 - p);
    enemy.x = enemy.emergeStartX + (enemy.emergeEndX - enemy.emergeStartX) * eased;
    const baseY = enemy.emergeStartY + (enemy.targetY - enemy.emergeStartY) * eased;
    enemy.y = baseY + Math.sin(eased * Math.PI) * enemy.arc;
    enemy.y = clamp(enemy.y, PLAYFIELD.top + 18, PLAYFIELD.bottom - 24 - enemy.h);
    if (p < 1) {
      return;
    }
    enemy.phase = ENEMY_PHASE.ROAM;
    enemy.x = clamp(enemy.x, PLAYFIELD.left + 1, PLAYFIELD.right - enemy.w - 1);
    enemy.y = clamp(enemy.y, PLAYFIELD.top + 18, PLAYFIELD.bottom - 24 - enemy.h);
    enemy.vx = -enemy.roamSpeed;
    enemy.vy = enemy.vySeed;
  }

  updateRoamingEnemy(enemy, dt) {
    const minY = PLAYFIELD.top + 18;
    const maxY = PLAYFIELD.bottom - 24;
    enemy.turnTimer -= dt;
    if (enemy.turnTimer <= 0) {
      enemy.vy *= -1;
      enemy.turnTimer = randomIn(1.2, 2.6);
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.x <= PLAYFIELD.left + 1) {
      enemy.x = PLAYFIELD.left + 1;
      enemy.vx = Math.abs(enemy.vx);
    } else if (enemy.x + enemy.w >= PLAYFIELD.right - 1) {
      enemy.x = PLAYFIELD.right - enemy.w - 1;
      enemy.vx = -Math.abs(enemy.vx);
    }
    if (enemy.y <= minY) {
      enemy.y = minY;
      enemy.vy = Math.abs(enemy.vy);
    } else if (enemy.y + enemy.h >= maxY) {
      enemy.y = maxY - enemy.h;
      enemy.vy = -Math.abs(enemy.vy);
    }

    const paddleHit =
      enemy.x + enemy.w >= this.paddle.x &&
      enemy.x <= this.paddle.x + this.paddle.w &&
      enemy.y + enemy.h >= this.paddle.y &&
      enemy.y <= this.paddle.y + this.paddle.h;
    if (paddleHit) {
      enemy.y = this.paddle.y - enemy.h - 1;
      enemy.vy = -Math.abs(enemy.vy);
    }
  }

  updateEnemies(dt) {
    if (this.state !== GAME_STATE.PLAYING || this.boss) {
      return;
    }

    this.updateEnemySpawn(dt);

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.anim += dt * (enemy.phase === ENEMY_PHASE.EMERGE ? 8 : 12);
      enemy.frame = Math.floor(enemy.anim) % 2;

      if (enemy.phase === ENEMY_PHASE.EMERGE) {
        this.updateEmergingEnemy(enemy, dt);
      } else {
        this.updateRoamingEnemy(enemy, dt);
      }

      let removed = false;
      for (const ball of this.balls) {
        const closestX = clamp(ball.x, enemy.x, enemy.x + enemy.w);
        const closestY = clamp(ball.y, enemy.y, enemy.y + enemy.h);
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        if (dx * dx + dy * dy > ball.r * ball.r) {
          continue;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          ball.vx = dx >= 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
        } else {
          ball.vy = dy >= 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
        }
        this.normalizeBallSpeed(ball, true);
        this.destroyEnemyAt(i, false);
        removed = true;
        break;
      }
      if (removed) {
        continue;
      }
    }
  }
}
