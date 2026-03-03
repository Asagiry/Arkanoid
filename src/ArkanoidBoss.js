import { GAME_STATE, PLAYFIELD } from "./constants.js";
import { ArkanoidPowerups } from "./ArkanoidPowerups.js";

export class ArkanoidBoss extends ArkanoidPowerups {
  damageBoss() {
    if (!this.boss) {
      return;
    }
    this.boss.hp -= 1;
    this.addScore(500);
    this.spawnParticles(this.boss.coreX + 2, this.boss.coreY + 2, "#ffd79a", 10);
    this.audio.brick(true);
    this.flash = 0.16;
    this.shake = Math.max(this.shake, 2);
    if (this.boss.hp <= 0) {
      this.boss = null;
      this.bossShots.length = 0;
      this.finishRun(true);
    }
  }

  updateBoss(dt) {
    if (!this.boss || this.state !== GAME_STATE.BOSS) {
      return;
    }

    this.boss.x += this.boss.moveDir * this.boss.moveSpeed * dt;
    if (this.boss.x <= PLAYFIELD.left + 8) {
      this.boss.x = PLAYFIELD.left + 8;
      this.boss.moveDir = 1;
    } else if (this.boss.x + this.boss.w >= PLAYFIELD.right - 8) {
      this.boss.x = PLAYFIELD.right - 8 - this.boss.w;
      this.boss.moveDir = -1;
    }
    this.boss.coreX = Math.floor(this.boss.x + this.boss.w * 0.5 - this.boss.coreW * 0.5);

    this.boss.shotCooldown -= dt;
    if (this.boss.shotCooldown <= 0) {
      this.boss.phase += 1;
      const speed = 86 + Math.min(40, this.boss.phase * 1.5);
      const left = this.boss.x + 3;
      const right = this.boss.x + this.boss.w - 4;
      this.bossShots.push({ x: left, y: this.boss.y + this.boss.h, vy: speed });
      this.bossShots.push({ x: right, y: this.boss.y + this.boss.h, vy: speed });
      this.boss.shotCooldown = Math.max(0.36, 1.12 - this.boss.phase * 0.03);
    }

    for (let i = this.bossShots.length - 1; i >= 0; i -= 1) {
      const shot = this.bossShots[i];
      shot.y += shot.vy * dt;

      const hitPaddle =
        shot.x >= this.paddle.x &&
        shot.x <= this.paddle.x + this.paddle.w &&
        shot.y >= this.paddle.y &&
        shot.y <= this.paddle.y + this.paddle.h;
      if (hitPaddle) {
        this.bossShots.splice(i, 1);
        this.loseLife();
        return;
      }

      let consumed = false;
      for (const ball of this.balls) {
        if (Math.abs(ball.x - shot.x) <= ball.r + 1 && Math.abs(ball.y - shot.y) <= ball.r + 2) {
          ball.vy = -Math.abs(ball.vy);
          this.bossShots.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) {
        continue;
      }
      if (shot.y > PLAYFIELD.bottom + 4) {
        this.bossShots.splice(i, 1);
      }
    }
  }
}
