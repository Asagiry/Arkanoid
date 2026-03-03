import { ArkanoidInput } from "./ArkanoidInput.js";
import { clamp } from "./utils.js";

export class ArkanoidMenuDemo extends ArkanoidInput {
  resetMenuDemo() {
    const demo = this.menuDemo;
    demo.paddleY = demo.areaY + demo.areaH - 8;
    demo.paddleX = demo.areaX + (demo.areaW - demo.paddleW) * 0.5;
    demo.ballX = demo.areaX + demo.areaW * 0.5;
    demo.ballY = demo.paddleY - 6;
    demo.ballVx = Math.random() > 0.5 ? 66 : -66;
    demo.ballVy = -82;
    demo.flash = 0;
  }

  updateMenuDemo(dt) {
    const demo = this.menuDemo;
    const left = demo.areaX + 2;
    const right = demo.areaX + demo.areaW - 2;
    const top = demo.areaY + 2;
    const bottom = demo.areaY + demo.areaH - 2;

    const paddleTargetX = clamp(demo.ballX - demo.paddleW * 0.5, left, right - demo.paddleW);
    demo.paddleX += (paddleTargetX - demo.paddleX) * clamp(dt * 7.5, 0, 1);
    demo.paddleX = clamp(demo.paddleX, left, right - demo.paddleW);

    demo.ballX += demo.ballVx * dt;
    demo.ballY += demo.ballVy * dt;

    if (demo.ballX <= left) {
      demo.ballX = left;
      demo.ballVx = Math.abs(demo.ballVx);
    } else if (demo.ballX >= right) {
      demo.ballX = right;
      demo.ballVx = -Math.abs(demo.ballVx);
    }
    if (demo.ballY <= top) {
      demo.ballY = top;
      demo.ballVy = Math.abs(demo.ballVy);
      demo.flash = 0.18;
    }

    const paddleTop = demo.paddleY;
    const paddleBottom = demo.paddleY + demo.paddleH;
    const paddleHit =
      demo.ballVy > 0 &&
      demo.ballX >= demo.paddleX &&
      demo.ballX <= demo.paddleX + demo.paddleW &&
      demo.ballY >= paddleTop - 1 &&
      demo.ballY <= paddleBottom;
    if (paddleHit) {
      demo.ballY = paddleTop - 1;
      const norm = (demo.ballX - (demo.paddleX + demo.paddleW * 0.5)) / (demo.paddleW * 0.5);
      const angle = clamp(norm * 1.1, -1.1, 1.1);
      const speed = 92;
      demo.ballVx = Math.sin(angle) * speed;
      demo.ballVy = -Math.abs(Math.cos(angle) * speed);
      demo.flash = 0.14;
    }

    if (demo.ballY > bottom + 5) {
      this.resetMenuDemo();
    }

    demo.flash = Math.max(0, demo.flash - dt * 0.9);
  }
}
