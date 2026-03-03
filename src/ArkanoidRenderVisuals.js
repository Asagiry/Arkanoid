import { PLAYFIELD, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants.js";
import { ArkanoidGameplay } from "./ArkanoidGameplay.js";

const ARENA_THEMES = Object.freeze([
  { base: "#0734a9", dot: "#1b56d1", accent: "#0b2a7e", borderLight: "#cfd9ef", borderDark: "#626a86" },
  { base: "#0d7a2f", dot: "#2ea145", accent: "#095b23", borderLight: "#d6dfcf", borderDark: "#697961" },
  { base: "#1f2f93", dot: "#3f56ca", accent: "#1a2570", borderLight: "#cfd4f0", borderDark: "#5e6783" },
  { base: "#0b4d88", dot: "#2572c3", accent: "#083a67", borderLight: "#cfdded", borderDark: "#607081" },
]);

export class ArkanoidRenderVisuals extends ArkanoidGameplay {
  getArenaTheme() {
    if (this.boss) {
      return {
        base: "#4e1d1f",
        dot: "#713034",
        accent: "#3a1415",
        borderLight: "#efe0d4",
        borderDark: "#866f67",
      };
    }
    return ARENA_THEMES[this.roundIndex % ARENA_THEMES.length];
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = "#020202";
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    for (const star of this.stars) {
      ctx.fillStyle = star.size > 1 ? "#4f5d8a" : "#252c45";
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  drawArenaPattern(theme) {
    const ctx = this.ctx;
    const width = PLAYFIELD.right - PLAYFIELD.left;
    const height = PLAYFIELD.bottom - PLAYFIELD.top;
    const patternShift = this.roundIndex % 2;

    ctx.fillStyle = theme.base;
    ctx.fillRect(PLAYFIELD.left, PLAYFIELD.top, width, height);

    ctx.fillStyle = theme.dot;
    for (let y = PLAYFIELD.top; y < PLAYFIELD.bottom; y += 4) {
      for (let x = PLAYFIELD.left; x < PLAYFIELD.right; x += 4) {
        const phase = ((x + y) >> 2) & 1;
        if ((phase ^ patternShift) === 0) {
          ctx.fillRect(x + 1, y + 1, 1, 1);
          ctx.fillRect(x + 2, y + 2, 1, 1);
        }
      }
    }

    ctx.fillStyle = theme.accent;
    for (let y = PLAYFIELD.top + 2; y < PLAYFIELD.bottom; y += 8) {
      ctx.fillRect(PLAYFIELD.left, y, width, 1);
    }
  }

  drawFrame(theme) {
    const ctx = this.ctx;
    const width = PLAYFIELD.right - PLAYFIELD.left;
    const height = PLAYFIELD.bottom - PLAYFIELD.top;

    ctx.fillStyle = theme.borderDark;
    ctx.fillRect(PLAYFIELD.left - 3, PLAYFIELD.top - 3, width + 6, 1);
    ctx.fillRect(PLAYFIELD.left - 3, PLAYFIELD.top - 2, 1, height + 5);
    ctx.fillRect(PLAYFIELD.left - 3, PLAYFIELD.bottom + 2, width + 6, 1);
    ctx.fillRect(PLAYFIELD.right + 2, PLAYFIELD.top - 2, 1, height + 5);

    ctx.fillStyle = theme.borderLight;
    ctx.fillRect(PLAYFIELD.left - 2, PLAYFIELD.top - 2, width + 4, 1);
    ctx.fillRect(PLAYFIELD.left - 2, PLAYFIELD.top - 1, 1, height + 3);
    ctx.fillRect(PLAYFIELD.left - 2, PLAYFIELD.bottom + 1, width + 4, 1);
    ctx.fillRect(PLAYFIELD.right + 1, PLAYFIELD.top - 1, 1, height + 3);

    ctx.fillStyle = "#919bb8";
    for (let x = PLAYFIELD.left + 3; x < PLAYFIELD.right - 2; x += 8) {
      ctx.fillRect(x, PLAYFIELD.top - 2, 2, 1);
      ctx.fillRect(x, PLAYFIELD.bottom + 1, 2, 1);
    }
    for (let y = PLAYFIELD.top + 3; y < PLAYFIELD.bottom - 2; y += 8) {
      ctx.fillRect(PLAYFIELD.left - 2, y, 1, 2);
      ctx.fillRect(PLAYFIELD.right + 1, y, 1, 2);
    }
  }

  drawGate(theme) {
    const ctx = this.ctx;
    const gateHeight = PLAYFIELD.gateBottom - PLAYFIELD.gateTop;
    if (this.gateOpen && !this.boss) {
      ctx.fillStyle = theme.borderLight;
      ctx.fillRect(PLAYFIELD.right + 1, PLAYFIELD.top - 1, 1, PLAYFIELD.gateTop - PLAYFIELD.top + 1);
      ctx.fillRect(
        PLAYFIELD.right + 1,
        PLAYFIELD.gateBottom,
        1,
        PLAYFIELD.bottom - PLAYFIELD.gateBottom + 2
      );
      ctx.fillStyle = "#ffb74d";
      ctx.fillRect(PLAYFIELD.right + 1, PLAYFIELD.gateTop, 1, gateHeight);
      ctx.fillStyle = "#ffd894";
      ctx.fillRect(PLAYFIELD.right + 2, PLAYFIELD.gateTop + 1, 1, gateHeight - 2);
      return;
    }

    ctx.fillStyle = theme.borderLight;
    ctx.fillRect(PLAYFIELD.right + 1, PLAYFIELD.top - 1, 1, PLAYFIELD.bottom - PLAYFIELD.top + 3);
  }

  drawArena() {
    const theme = this.getArenaTheme();
    this.drawArenaPattern(theme);
    this.drawFrame(theme);
    this.drawGate(theme);
  }

  drawBricks() {
    const ctx = this.ctx;
    for (const brick of this.bricks) {
      if (!brick.alive) {
        continue;
      }

      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(brick.x, brick.y, brick.w, 1);
      ctx.fillRect(brick.x, brick.y, 1, brick.h);
      ctx.fillStyle = brick.shade;
      ctx.fillRect(brick.x + 1, brick.y + brick.h - 1, brick.w - 1, 1);
      ctx.fillRect(brick.x + brick.w - 1, brick.y + 1, 1, brick.h - 1);

      if (brick.unbreakable) {
        ctx.fillStyle = "#5d3a0d";
        ctx.fillRect(brick.x + 3, brick.y + 2, 2, 2);
        ctx.fillRect(brick.x + 11, brick.y + 4, 2, 2);
      } else if (brick.silver) {
        ctx.fillStyle = brick.hp > 1 ? "#ececec" : "#a5a5a5";
        ctx.fillRect(brick.x + 6, brick.y + 3, 4, 2);
      }
    }
  }

  drawVausSprite(x, y, w, h, isLifeIcon = false) {
    const ctx = this.ctx;
    const cannonW = isLifeIcon ? 2 : 4;
    const bodyTop = isLifeIcon ? 1 : 2;

    ctx.fillStyle = "#d8dde9";
    ctx.fillRect(x, y, w, bodyTop);
    ctx.fillStyle = "#f39a2d";
    ctx.fillRect(x, y + bodyTop, w, h - bodyTop);
    ctx.fillStyle = "#ffd79b";
    ctx.fillRect(x + 2, y + bodyTop, Math.max(0, w - 4), 1);
    ctx.fillStyle = "#8f4b14";
    ctx.fillRect(x, y + h - 1, w, 1);

    ctx.fillStyle = "#bcc5d8";
    ctx.fillRect(x + 1, y - 2, cannonW, 2);
    ctx.fillRect(x + w - 1 - cannonW, y - 2, cannonW, 2);

    if (!isLifeIcon && this.paddle.mode === "laser") {
      ctx.fillStyle = "#ff6a87";
      ctx.fillRect(x + 2, y - 1, 1, 1);
      ctx.fillRect(x + w - 3, y - 1, 1, 1);
    }
  }

  drawPaddle() {
    const x = Math.floor(this.paddle.x);
    const y = Math.floor(this.paddle.y);
    const w = Math.floor(this.paddle.w);
    this.drawVausSprite(x, y, w, this.paddle.h, false);
  }

  drawBalls() {
    const ctx = this.ctx;
    for (const ball of this.balls) {
      for (let i = 0; i < ball.trail.length; i += 1) {
        const step = ball.trail[i];
        ctx.globalAlpha = ((i + 1) / ball.trail.length) * 0.28;
        ctx.fillStyle = "#9bc8ff";
        ctx.fillRect(Math.floor(step.x), Math.floor(step.y), 1, 1);
      }
      ctx.globalAlpha = 1;

      const x = Math.floor(ball.x - ball.r);
      const y = Math.floor(ball.y - ball.r);
      ctx.fillStyle = "#54d8ff";
      ctx.fillRect(x, y, 4, 4);
      ctx.fillStyle = "#e9fdff";
      ctx.fillRect(x + 1, y + 1, 2, 2);
      ctx.fillStyle = "#3188d6";
      ctx.fillRect(x + 3, y + 1, 1, 2);
      ctx.fillRect(x + 1, y + 3, 2, 1);
    }
  }

  drawCapsules() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "6px 'Courier New', monospace";
    for (const capsule of this.capsules) {
      const x = Math.floor(capsule.x - capsule.w * 0.5);
      const y = Math.floor(capsule.y - capsule.h * 0.5);
      ctx.fillStyle = capsule.color;
      ctx.fillRect(x, y, capsule.w, capsule.h);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(x, y, capsule.w, 1);
      ctx.fillStyle = "#131722";
      ctx.fillText(capsule.label, x + capsule.w * 0.5, y + capsule.h * 0.5 + 0.3);
    }
  }

  drawEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      const x = Math.floor(enemy.x);
      const y = Math.floor(enemy.y);
      const bodyY = y + (enemy.frame ? 1 : 0);
      const bodyH = enemy.h - 1;
      const emerging = enemy.phase === "emerge";

      if (emerging) {
        ctx.fillStyle = "rgba(255, 204, 112, 0.65)";
        ctx.fillRect(x + enemy.w - 1, bodyY + 1, 2, 1);
        ctx.fillRect(x + enemy.w, bodyY + 3, 2, 1);
      }

      ctx.fillStyle = enemy.color;
      ctx.fillRect(x, bodyY, enemy.w, bodyH);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(x, bodyY, enemy.w, 1);
      ctx.fillStyle = enemy.shade;
      ctx.fillRect(x + 1, bodyY + bodyH - 1, enemy.w - 2, 1);

      ctx.fillStyle = enemy.eye;
      ctx.fillRect(x + 2, bodyY + 2, 2, 1);
      ctx.fillRect(x + enemy.w - 4, bodyY + 2, 2, 1);

      if (!emerging) {
        ctx.fillStyle = enemy.shade;
        ctx.fillRect(x - 1, bodyY + 3, 1, 1);
        ctx.fillRect(x + enemy.w, bodyY + 3, 1, 1);
      }
    }
  }

  drawLasers() {
    const ctx = this.ctx;
    ctx.fillStyle = "#ff6585";
    for (const laser of this.lasers) {
      const x = Math.floor(laser.x);
      const y = Math.floor(laser.y);
      ctx.fillRect(x, y, 1, 5);
      ctx.fillRect(x, y - 1, 1, 1);
    }
  }

  drawBoss() {
    if (!this.boss) {
      return;
    }
    const ctx = this.ctx;
    const x = Math.floor(this.boss.x);
    const y = Math.floor(this.boss.y);
    ctx.fillStyle = "#8a5762";
    ctx.fillRect(x, y, this.boss.w, this.boss.h);
    ctx.fillStyle = "#b7838f";
    ctx.fillRect(x, y, this.boss.w, 2);
    ctx.fillStyle = "#613942";
    ctx.fillRect(x, y + this.boss.h - 2, this.boss.w, 2);
    ctx.fillStyle = "#2a1a21";
    ctx.fillRect(x + 3, y + 3, 4, 2);
    ctx.fillRect(x + this.boss.w - 7, y + 3, 4, 2);
    ctx.fillStyle = "#ffe3ad";
    ctx.fillRect(this.boss.coreX, this.boss.coreY, this.boss.coreW, this.boss.coreH);
    ctx.fillStyle = "#ffd76e";
    ctx.fillRect(this.boss.coreX + 1, this.boss.coreY + 1, 2, 2);
  }

  drawBossShots() {
    const ctx = this.ctx;
    ctx.fillStyle = "#ff7a95";
    for (const shot of this.bossShots) {
      ctx.fillRect(Math.floor(shot.x), Math.floor(shot.y), 2, 3);
    }
  }

  drawParticles() {
    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }
  }

  drawScorePopups() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "6px 'Courier New', monospace";
    for (const popup of this.scorePopups) {
      const alpha = Math.max(0, popup.life / popup.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, Math.floor(popup.x), Math.floor(popup.y));
      ctx.globalAlpha = 1;
    }
  }

  drawScanlines() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.09)";
    for (let y = 0; y < VIRTUAL_HEIGHT; y += 2) {
      ctx.fillRect(0, y, VIRTUAL_WIDTH, 1);
    }
  }

  drawFlash() {
    if (this.flash <= 0) {
      return;
    }
    this.ctx.fillStyle = `rgba(255, 233, 200, ${this.flash * 0.8})`;
    this.ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }
}
