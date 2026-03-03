import { GAME_STATE, PLAYFIELD } from "./constants.js";
import { ArkanoidMenuDemo } from "./ArkanoidMenuDemo.js";
import { TUTORIAL_PAGES } from "./tutorialData.js";
import { clamp } from "./utils.js";

const TUTORIAL_BRICK_PALETTE = Object.freeze([
  { color: "#ffb52f", shade: "#c57900" },
  { color: "#4fd5ff", shade: "#1689c9" },
  { color: "#52ec52", shade: "#229222" },
  { color: "#ff6161", shade: "#b72424" },
  { color: "#5a8dff", shade: "#2d52a8" },
  { color: "#d47eff", shade: "#7e35b1" },
  { color: "#ffe34f", shade: "#c39c1f" },
]);

export class ArkanoidTutorial extends ArkanoidMenuDemo {
  buildTutorialBricks(pageId) {
    const d = this.tutorialDemo;
    const bricks = [];
    const cols = 7;
    const rows = pageId === "goal" ? 3 : 2;
    const brickW = 14;
    const brickH = 6;
    const gapX = 2;
    const gapY = 2;
    const startX = d.areaX + 5;
    const startY = d.areaY + 7;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const palette = TUTORIAL_BRICK_PALETTE[(col + row) % TUTORIAL_BRICK_PALETTE.length];
        bricks.push({
          x: startX + col * (brickW + gapX),
          y: startY + row * (brickH + gapY),
          w: brickW,
          h: brickH,
          color: palette.color,
          shade: palette.shade,
          hp: 1,
          alive: true,
          unbreakable: false,
        });
      }
    }

    if (pageId === "power") {
      const silver = bricks[3];
      if (silver) {
        silver.color = "#d2d2d2";
        silver.shade = "#8b8b8b";
        silver.hp = 2;
        silver.silver = true;
      }
    }
    if (pageId === "goal") {
      const steel = bricks[0];
      if (steel) {
        steel.color = "#cc8e31";
        steel.shade = "#7a4e0e";
        steel.unbreakable = true;
      }
    }
    return bricks;
  }

  countTutorialBreakables() {
    return this.tutorialDemo.bricks.filter((brick) => brick.alive && !brick.unbreakable).length;
  }

  spawnTutorialCapsule(x, y) {
    const d = this.tutorialDemo;
    const labels = ["E", "C", "L", "D", "B", "P", "S"];
    const index = Math.floor(d.capsuleTimer / 0.9) % labels.length;
    d.capsuleLabel = labels[index];
    d.capsuleX = x;
    d.capsuleY = y;
    d.capsuleVy = 0;
    d.capsuleActive = true;
  }

  resolveTutorialBrickHit(brick, pageId) {
    const d = this.tutorialDemo;
    if (brick.unbreakable) {
      d.flash = Math.max(d.flash, 0.08);
      return;
    }

    brick.hp -= 1;
    if (brick.hp <= 0) {
      brick.alive = false;
      d.flash = Math.max(d.flash, 0.14);
      if (pageId === "power" && !d.capsuleActive) {
        this.spawnTutorialCapsule(brick.x + brick.w * 0.5, brick.y + brick.h + 2);
      }
    } else {
      d.flash = Math.max(d.flash, 0.1);
    }
  }

  resetTutorialDemo() {
    const page = this.getCurrentTutorialPage();
    const d = this.tutorialDemo;
    d.areaX = PLAYFIELD.left + 24;
    d.areaY = 108;
    d.areaW = PLAYFIELD.right - PLAYFIELD.left - 48;
    d.areaH = 60;
    d.paddleW = 28;
    d.paddleH = 4;
    d.paddleY = d.areaY + d.areaH - 8;
    d.paddleX = d.areaX + (d.areaW - d.paddleW) * 0.5;
    d.ballX = d.areaX + d.areaW * 0.5;
    d.ballY = d.paddleY - 6;
    d.ballVx = 68;
    d.ballVy = -84;
    d.ballR = 2;
    d.flash = 0;
    d.respawnTimer = 0;
    d.exitFlash = 0;
    d.ballExited = false;
    d.capsuleX = d.areaX + d.areaW * 0.5;
    d.capsuleY = d.areaY + 8;
    d.capsuleVy = 0;
    d.capsuleActive = false;
    d.capsuleLabel = "E";
    d.capsuleTimer = 0;
    d.gateTop = d.areaY + 18;
    d.gateBottom = d.areaY + 42;
    d.gateOpen = false;
    d.bricks = this.buildTutorialBricks(page.id);
  }

  openTutorial() {
    this.tutorialPage = 0;
    this.state = GAME_STATE.TUTORIAL;
    this.resetTutorialDemo();
    this.setBootNote("HOW TO PLAY", true);
    this.input.left = false;
    this.input.right = false;
  }

  leaveTutorialToMenu() {
    this.state = GAME_STATE.MENU;
    this.menuPage = 0;
    this.menuPageTimer = 8;
    this.tutorialPage = 0;
    this.setBootNote("PRESS SPACE TO START", true);
  }

  nextTutorialPage() {
    if (this.tutorialPage < TUTORIAL_PAGES.length - 1) {
      this.tutorialPage += 1;
      this.resetTutorialDemo();
      this.audio.wall();
      return;
    }
    this.startNewGame();
  }

  prevTutorialPage() {
    if (this.tutorialPage <= 0) {
      return;
    }
    this.tutorialPage -= 1;
    this.resetTutorialDemo();
    this.audio.wall();
  }

  getCurrentTutorialPage() {
    return TUTORIAL_PAGES[this.tutorialPage] || TUTORIAL_PAGES[0];
  }

  getTutorialPageCount() {
    return TUTORIAL_PAGES.length;
  }

  updateTutorial(dt) {
    const d = this.tutorialDemo;
    const page = this.getCurrentTutorialPage();
    const left = d.areaX + 2;
    const right = d.areaX + d.areaW - 2;
    const top = d.areaY + 2;
    const bottom = d.areaY + d.areaH - 2;

    if (d.ballExited) {
      d.respawnTimer -= dt;
      d.exitFlash = Math.max(0, d.exitFlash - dt * 1.4);
      if (d.respawnTimer <= 0) {
        this.resetTutorialDemo();
      }
      return;
    }

    const paddleTargetX = clamp(d.ballX - d.paddleW * 0.5, left, right - d.paddleW);
    d.paddleX += (paddleTargetX - d.paddleX) * clamp(dt * 8.6, 0, 1);
    d.paddleX = clamp(d.paddleX, left, right - d.paddleW);

    const prevX = d.ballX;
    const prevY = d.ballY;
    d.ballX += d.ballVx * dt;
    d.ballY += d.ballVy * dt;

    if (d.ballX - d.ballR <= left) {
      d.ballX = left + d.ballR;
      d.ballVx = Math.abs(d.ballVx);
    } else if (d.ballX + d.ballR >= right) {
      const canExit =
        page.id === "goal" &&
        d.gateOpen &&
        d.ballY >= d.gateTop + 1 &&
        d.ballY <= d.gateBottom - 1;
      if (canExit) {
        if (d.ballX - d.ballR > right + 6) {
          d.ballExited = true;
          d.respawnTimer = 0.68;
          d.exitFlash = 0.32;
          return;
        }
      } else {
        d.ballX = right - d.ballR;
        d.ballVx = -Math.abs(d.ballVx);
      }
    }

    if (d.ballY - d.ballR <= top) {
      d.ballY = top + d.ballR;
      d.ballVy = Math.abs(d.ballVy);
      d.flash = 0.17;
    }

    for (const brick of d.bricks) {
      if (!brick.alive) {
        continue;
      }
      const overlap =
        d.ballX + d.ballR >= brick.x &&
        d.ballX - d.ballR <= brick.x + brick.w &&
        d.ballY + d.ballR >= brick.y &&
        d.ballY - d.ballR <= brick.y + brick.h;
      if (!overlap) {
        continue;
      }

      const fromTop = prevY + d.ballR <= brick.y;
      const fromBottom = prevY - d.ballR >= brick.y + brick.h;
      const fromLeft = prevX + d.ballR <= brick.x;
      const fromRight = prevX - d.ballR >= brick.x + brick.w;

      if (fromTop) {
        d.ballY = brick.y - d.ballR - 0.1;
        d.ballVy = -Math.abs(d.ballVy);
      } else if (fromBottom) {
        d.ballY = brick.y + brick.h + d.ballR + 0.1;
        d.ballVy = Math.abs(d.ballVy);
      } else if (fromLeft) {
        d.ballX = brick.x - d.ballR - 0.1;
        d.ballVx = -Math.abs(d.ballVx);
      } else if (fromRight) {
        d.ballX = brick.x + brick.w + d.ballR + 0.1;
        d.ballVx = Math.abs(d.ballVx);
      } else {
        d.ballVy *= -1;
      }

      this.resolveTutorialBrickHit(brick, page.id);
      break;
    }

    const paddleTop = d.paddleY;
    const paddleBottom = d.paddleY + d.paddleH;
    const paddleHit =
      d.ballVy > 0 &&
      d.ballX + d.ballR >= d.paddleX &&
      d.ballX - d.ballR <= d.paddleX + d.paddleW &&
      d.ballY + d.ballR >= paddleTop &&
      d.ballY - d.ballR <= paddleBottom;
    if (paddleHit) {
      d.ballY = paddleTop - d.ballR - 0.1;
      const norm = (d.ballX - (d.paddleX + d.paddleW * 0.5)) / (d.paddleW * 0.5);
      const angle = clamp(norm * 1.06, -1.1, 1.1);
      const speed = 96;
      d.ballVx = Math.sin(angle) * speed;
      d.ballVy = -Math.abs(Math.cos(angle) * speed);
      d.flash = 0.13;
    }

    if (d.ballY - d.ballR > bottom + 4) {
      this.resetTutorialDemo();
      return;
    }

    d.capsuleTimer += dt;
    if (page.id === "power") {
      if (!d.capsuleActive && d.capsuleTimer >= 1.8) {
        this.spawnTutorialCapsule(d.areaX + d.areaW * 0.5, d.areaY + 8);
      }
      if (d.capsuleActive) {
        d.capsuleVy += 84 * dt;
        d.capsuleY += d.capsuleVy * dt;
        const hitPaddle =
          d.capsuleY + 3 >= d.paddleY &&
          d.capsuleY - 3 <= d.paddleY + d.paddleH &&
          d.capsuleX + 6 >= d.paddleX &&
          d.capsuleX - 6 <= d.paddleX + d.paddleW;
        if (hitPaddle || d.capsuleY > bottom + 5) {
          d.capsuleActive = false;
          d.capsuleVy = 0;
          d.capsuleTimer = 0;
        }
      }
    } else {
      d.capsuleActive = false;
      d.capsuleX = d.areaX + d.areaW * 0.5;
      d.capsuleY = d.areaY + 8;
      d.capsuleVy = 0;
      d.capsuleLabel = "E";
      d.capsuleTimer = 0;
    }

    const remainingBreakables = this.countTutorialBreakables();
    if (page.id === "goal") {
      if (remainingBreakables === 0) {
        d.gateOpen = true;
      }
      if (d.gateOpen) {
        d.ballVx = Math.abs(d.ballVx);
        if (d.ballY < d.gateTop + 3) {
          d.ballVy = Math.abs(d.ballVy);
        } else if (d.ballY > d.gateBottom - 3) {
          d.ballVy = -Math.abs(d.ballVy);
        }
      }
    } else if (remainingBreakables === 0) {
      d.respawnTimer += dt;
      if (d.respawnTimer >= 0.65) {
        this.resetTutorialDemo();
        return;
      }
    }

    d.exitFlash = Math.max(0, d.exitFlash - dt * 1.2);
    d.flash = Math.max(0, d.flash - dt * 0.9);
  }
}
