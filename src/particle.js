import { randomIn } from "./utils.js";

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = randomIn(0, Math.PI * 2);
    const speed = randomIn(18, 72);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = randomIn(0.1, 0.24);
    this.maxLife = this.life;
    this.color = color;
    this.size = Math.random() > 0.6 ? 2 : 1;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 120 * dt;
    this.life -= dt;
  }

  draw(ctx) {
    if (this.life <= 0) {
      return;
    }
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
    ctx.globalAlpha = 1;
  }
}
