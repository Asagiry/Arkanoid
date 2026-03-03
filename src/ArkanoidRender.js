import { GAME_STATE, PLAYFIELD, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants.js";
import { ArkanoidRenderVisuals } from "./ArkanoidRenderVisuals.js";
import { randomIn } from "./utils.js";

export class ArkanoidRender extends ArkanoidRenderVisuals {
  drawMenuHud() {
    const ctx = this.ctx;
    ctx.textBaseline = "middle";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillStyle = "#ff5e5e";
    ctx.textAlign = "left";
    ctx.fillText("1UP", PLAYFIELD.left + 2, 8);
    ctx.textAlign = "center";
    ctx.fillText("HIGH SCORE", VIRTUAL_WIDTH * 0.5, 8);
    ctx.textAlign = "right";
    ctx.fillText("2UP", PLAYFIELD.right - 2, 8);

    ctx.fillStyle = "#f2f5ff";
    ctx.textAlign = "left";
    ctx.fillText("000000", PLAYFIELD.left + 2, 15);
    ctx.textAlign = "center";
    ctx.fillText(this.highScore.toString().padStart(6, "0"), VIRTUAL_WIDTH * 0.5, 15);
    ctx.textAlign = "right";
    ctx.fillText("000000", PLAYFIELD.right - 2, 15);
    ctx.textAlign = "right";
    ctx.fillText("CREDIT 00", PLAYFIELD.right - 2, VIRTUAL_HEIGHT - 4);
  }

  drawMenuScreen() {
    const ctx = this.ctx;
    const centerX = VIRTUAL_WIDTH * 0.5;
    const blink = Math.floor(performance.now() / 360) % 2 === 0;

    this.drawArena();
    this.drawMenuHud();

    ctx.fillStyle = "rgba(3, 8, 24, 0.66)";
    ctx.fillRect(PLAYFIELD.left + 14, 42, PLAYFIELD.right - PLAYFIELD.left - 28, 150);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(PLAYFIELD.left + 14, 42, PLAYFIELD.right - PLAYFIELD.left - 28, 1);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(PLAYFIELD.left + 14, 191, PLAYFIELD.right - PLAYFIELD.left - 28, 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (this.menuPage === 0) {
      ctx.fillStyle = "#8d3a1a";
      ctx.font = "20px 'Courier New', monospace";
      ctx.fillText("ARKANOID", centerX + 1, 74);
      ctx.fillStyle = "#ffca66";
      ctx.fillText("ARKANOID", centerX, 73);

      ctx.fillStyle = "#f5e7cd";
      ctx.font = "6px 'Courier New', monospace";
      ctx.fillText("REVIVAL OF THE CLASSIC", centerX, 92);
      ctx.fillText("(C) TAITO CORPORATION 1986", centerX, 101);

      const menuItems = ["HOW TO PLAY", "1 PLAYER GAME", "2 PLAYERS GAME", "LEADERBOARD"];
      for (let i = 0; i < menuItems.length; i += 1) {
        const y = 114 + i * 10;
        const selected = this.menuSelection === i;
        ctx.fillStyle = selected ? "#fff4b9" : "#d7def5";
        ctx.fillText(menuItems[i], centerX + 4, y);
        if (selected) {
          ctx.fillStyle = "#ffe883";
          ctx.fillText(">", centerX - 44, y);
        }
      }

      ctx.fillStyle = "#d9e0ff";
      ctx.fillText("ARROWS OR WASD TO SELECT", centerX, 157);
      ctx.fillText("ENTER OR SPACE TO CONFIRM", centerX, 165);
      if (this.menuSelection === 2) {
        const unavailableText =
          this.menuNoticeTimer > 0 && this.menuNotice ? this.menuNotice : "2 PLAYER MODE NOT AVAILABLE";
        ctx.fillStyle = "#ffb08a";
        ctx.fillText(unavailableText, centerX, 173);
      } else if (this.menuSelection === 0) {
        ctx.fillStyle = "#cfd4e8";
        ctx.fillText("TUTORIAL WITH MINI DEMO", centerX, 173);
      } else if (this.menuSelection === 3) {
        ctx.fillStyle = "#cfd4e8";
        ctx.fillText("SHOW TOP 5 SCORES", centerX, 173);
      }

      ctx.fillStyle = blink ? "#ffe883" : "#f5f5f5";
      ctx.font = "7px 'Courier New', monospace";
      ctx.fillText("PUSH SPACE BUTTON", centerX, 184);
      return;
    }

    if (this.menuPage === 1) {
      ctx.fillStyle = "#ffe9b3";
      ctx.font = "9px 'Courier New', monospace";
      ctx.fillText("ATTRACT MODE", centerX, 63);
      ctx.fillStyle = "#dbe7ff";
      ctx.font = "6px 'Courier New', monospace";
      ctx.fillText("WATCH THE VAUS AUTO DEMO", centerX, 74);

      const d = this.menuDemo;
      ctx.fillStyle = "rgba(0,0,0,0.36)";
      ctx.fillRect(d.areaX, d.areaY, d.areaW, d.areaH);
      ctx.fillStyle = "rgba(255,255,255,0.23)";
      ctx.fillRect(d.areaX, d.areaY, d.areaW, 1);
      ctx.fillRect(d.areaX, d.areaY, 1, d.areaH);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(d.areaX, d.areaY + d.areaH - 1, d.areaW, 1);
      ctx.fillRect(d.areaX + d.areaW - 1, d.areaY, 1, d.areaH);

      for (let i = 0; i < 7; i += 1) {
        const bx = d.areaX + 5 + i * 16;
        ctx.fillStyle = i % 2 === 0 ? "#ffb74d" : "#69c6ff";
        ctx.fillRect(bx, d.areaY + 5, 14, 6);
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.fillRect(bx, d.areaY + 5, 14, 1);
      }

      this.drawVausSprite(Math.floor(d.paddleX), Math.floor(d.paddleY), d.paddleW, d.paddleH, false);
      const ballX = Math.floor(d.ballX);
      const ballY = Math.floor(d.ballY);
      ctx.fillStyle = "#9ee0ff";
      ctx.fillRect(ballX - 1, ballY - 1, 3, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ballX, ballY, 1, 1);
      if (d.flash > 0) {
        ctx.fillStyle = `rgba(255,230,170,${d.flash})`;
        ctx.fillRect(d.areaX, d.areaY, d.areaW, d.areaH);
      }

      ctx.fillStyle = "#f8e9bf";
      ctx.fillText("S  SLOW   E  EXPAND   C  CATCH", centerX, 183 - 28);
      ctx.fillText("L  LASER  D  DISRUPT  B  BREAK", centerX, 183 - 21);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillText("PUSH SPACE BUTTON", centerX, 183);
      return;
    }

    ctx.fillStyle = "#ffe9b3";
    ctx.font = "9px 'Courier New', monospace";
    ctx.fillText("TOP 5 SCORES", centerX, 63);
    ctx.fillStyle = "#dbe7ff";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText("HALL OF FAME", centerX, 74);

    ctx.textAlign = "left";
    for (let i = 0; i < this.leaderboard.length; i += 1) {
      const entry = this.leaderboard[i];
      const y = 92 + i * 16;
      const isRecent = this.lastRunResult && this.lastRunResult.rank === i + 1;
      ctx.fillStyle = isRecent ? "#7dff9f" : i === 0 ? "#ffd37f" : "#f3f4ff";
      ctx.fillText(`${i + 1}. ${entry.name}`, centerX - 42, y);
      ctx.textAlign = "right";
      ctx.fillText(String(entry.score).padStart(6, "0"), centerX + 42, y);
      ctx.textAlign = "left";
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f5f5";
    ctx.fillText(this.menuLeaderboardOpened ? "ENTER OR SPACE TO BACK" : "PUSH SPACE BUTTON", centerX, 183);
  }

  drawLives() {
    const drawLives = Math.max(0, this.lives - 1);
    const baseY = VIRTUAL_HEIGHT - 8;
    const baseX = PLAYFIELD.left + 2;
    for (let i = 0; i < drawLives; i += 1) {
      this.drawVausSprite(baseX + i * 11, baseY, 8, 4, true);
    }
  }

  drawHud() {
    const ctx = this.ctx;
    ctx.textBaseline = "middle";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillStyle = "#ff5e5e";
    ctx.textAlign = "left";
    ctx.fillText("1UP", PLAYFIELD.left + 2, 8);
    ctx.textAlign = "center";
    ctx.fillText("HIGH SCORE", VIRTUAL_WIDTH * 0.5, 8);
    ctx.textAlign = "right";
    ctx.fillText(this.boss ? "BOSS" : "ROUND", PLAYFIELD.right - 2, 8);

    ctx.fillStyle = "#f2f5ff";
    ctx.textAlign = "left";
    ctx.fillText(this.score.toString().padStart(6, "0"), PLAYFIELD.left + 2, 15);
    ctx.textAlign = "center";
    ctx.fillText(this.highScore.toString().padStart(6, "0"), VIRTUAL_WIDTH * 0.5, 15);
    ctx.textAlign = "right";
    const roundLabel = this.boss ? "DOH" : String(this.roundIndex + 1).padStart(2, "0");
    ctx.fillText(roundLabel, PLAYFIELD.right - 2, 15);

    this.drawLives();

    ctx.textAlign = "left";
    ctx.fillStyle = "#d9d9dd";
    ctx.fillText(`CAP ${this.activePower}`, PLAYFIELD.left + 2, VIRTUAL_HEIGHT - 4);

    ctx.textAlign = "right";
    ctx.fillStyle = "#f2f5ff";
    ctx.fillText("CREDIT 00", PLAYFIELD.right - 1, VIRTUAL_HEIGHT - 4);

    const timeScale = this.getTimeScale();
    if (timeScale > 1) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd37f";
      ctx.fillText(`FAST X${timeScale}`, VIRTUAL_WIDTH * 0.5, VIRTUAL_HEIGHT - 4);
    }
  }

  drawLabel(title, subtitle = "", withBackdrop = false, blink = false) {
    const ctx = this.ctx;
    const showSubtitle = !blink || Math.floor(performance.now() / 400) % 2 === 0;
    if (withBackdrop) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.fillRect(PLAYFIELD.left + 8, VIRTUAL_HEIGHT * 0.41 - 10, PLAYFIELD.right - PLAYFIELD.left - 16, 28);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4b9";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText(title, VIRTUAL_WIDTH * 0.5, VIRTUAL_HEIGHT * 0.43);
    if (subtitle && showSubtitle) {
      ctx.fillStyle = "#fff";
      ctx.font = "6px 'Courier New', monospace";
      ctx.fillText(subtitle, VIRTUAL_WIDTH * 0.5, VIRTUAL_HEIGHT * 0.52);
    }
  }

  drawNameEntry() {
    const ctx = this.ctx;
    const centerX = VIRTUAL_WIDTH * 0.5;
    const blink = Math.floor(performance.now() / 280) % 2 === 0;
    const { chars, index, score, didWin } = this.nameEntry;

    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.fillRect(PLAYFIELD.left + 10, 74, PLAYFIELD.right - PLAYFIELD.left - 20, 92);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(PLAYFIELD.left + 10, 74, PLAYFIELD.right - PLAYFIELD.left - 20, 1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(PLAYFIELD.left + 10, 165, PLAYFIELD.right - PLAYFIELD.left - 20, 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4b9";
    ctx.font = "9px 'Courier New', monospace";
    ctx.fillText(didWin ? "NEW CHAMPION!" : "NEW HIGH SCORE!", centerX, 88);

    ctx.fillStyle = "#f2f6ff";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText(`SCORE ${String(score).padStart(6, "0")}`, centerX, 99);
    if (typeof this.nameEntry.rank === "number") {
      ctx.fillText(`RANK ${this.nameEntry.rank}`, centerX, 109);
      ctx.fillText("ENTER YOUR INITIALS", centerX, 118);
    } else {
      ctx.fillText("ENTER YOUR INITIALS", centerX, 110);
    }

    const baseX = centerX - 20;
    for (let i = 0; i < 3; i += 1) {
      const x = baseX + i * 20;
      const selected = i === index;
      ctx.fillStyle = selected ? "#ffd37f" : "#dce4ff";
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillText(chars[i], x, 133);
      if (selected && blink) {
        ctx.fillStyle = "#ffd37f";
        ctx.fillRect(x - 5, 141, 10, 1);
      }
    }

    ctx.fillStyle = "#d9e0ff";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText("ARROWS: MOVE/CHANGE  ENTER: OK", centerX, 154);
  }

  drawRunResult() {
    const result = this.lastRunResult;
    if (!result) {
      return;
    }
    const ctx = this.ctx;
    const centerX = VIRTUAL_WIDTH * 0.5;
    const rankText = typeof result.rank === "number" ? `RANK ${result.rank}` : "NO RANK";
    const title = result.didWin ? "CONGRATULATIONS" : "GAME OVER";
    const subtitle = result.didWin ? "SPACE NEW GAME" : "SPACE RESTART";

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(PLAYFIELD.left + 12, 86, PLAYFIELD.right - PLAYFIELD.left - 24, 72);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(PLAYFIELD.left + 12, 86, PLAYFIELD.right - PLAYFIELD.left - 24, 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4b9";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText(title, centerX, 98);
    ctx.fillStyle = "#f2f6ff";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText(`SCORE ${String(result.score).padStart(6, "0")}`, centerX, 114);
    ctx.fillText(rankText, centerX, 123);
    ctx.fillText(subtitle, centerX, 141);
  }

  drawTutorialScreen() {
    const ctx = this.ctx;
    const centerX = VIRTUAL_WIDTH * 0.5;
    const blink = Math.floor(performance.now() / 320) % 2 === 0;
    const page = this.getCurrentTutorialPage();
    const pageTotal = this.getTutorialPageCount();
    const d = this.tutorialDemo;

    this.drawArena();
    this.drawMenuHud();

    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(PLAYFIELD.left + 12, 42, PLAYFIELD.right - PLAYFIELD.left - 24, 148);
    ctx.fillStyle = "rgba(255,255,255,0.24)";
    ctx.fillRect(PLAYFIELD.left + 12, 42, PLAYFIELD.right - PLAYFIELD.left - 24, 1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(PLAYFIELD.left + 12, 189, PLAYFIELD.right - PLAYFIELD.left - 24, 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe7b4";
    ctx.font = "9px 'Courier New', monospace";
    ctx.fillText("HOW TO PLAY", centerX, 56);
    ctx.fillStyle = "#d8e4ff";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText(`${this.tutorialPage + 1}/${pageTotal}  ${page.title}`, centerX, 67);

    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(d.areaX, d.areaY, d.areaW, d.areaH);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(d.areaX, d.areaY, d.areaW, 1);
    ctx.fillRect(d.areaX, d.areaY, 1, d.areaH);
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(d.areaX, d.areaY + d.areaH - 1, d.areaW, 1);
    ctx.fillRect(d.areaX + d.areaW - 1, d.areaY, 1, d.areaH);

    for (const brick of d.bricks) {
      if (!brick.alive) {
        continue;
      }
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(brick.x, brick.y, brick.w, 1);
      ctx.fillRect(brick.x, brick.y, 1, brick.h);
      ctx.fillStyle = brick.shade;
      ctx.fillRect(brick.x + 1, brick.y + brick.h - 1, brick.w - 1, 1);
      ctx.fillRect(brick.x + brick.w - 1, brick.y + 1, 1, brick.h - 1);

      if (brick.unbreakable) {
        ctx.fillStyle = "#5d3a0d";
        ctx.fillRect(brick.x + 3, brick.y + 2, 2, 2);
        ctx.fillRect(brick.x + brick.w - 5, brick.y + 2, 2, 2);
      } else if (brick.silver) {
        ctx.fillStyle = brick.hp > 1 ? "#ececec" : "#a5a5a5";
        ctx.fillRect(brick.x + 5, brick.y + 2, 4, 2);
      }
    }

    if (page.id === "goal") {
      if (d.gateOpen) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(d.areaX + d.areaW - 1, d.areaY + 1, 1, d.gateTop - d.areaY);
        ctx.fillRect(d.areaX + d.areaW - 1, d.gateBottom, 1, d.areaY + d.areaH - d.gateBottom - 1);
        ctx.fillStyle = "#ffcb78";
        ctx.fillRect(d.areaX + d.areaW - 1, d.gateTop, 1, d.gateBottom - d.gateTop);
        ctx.fillStyle = "#ffe3a9";
        ctx.fillRect(d.areaX + d.areaW, d.gateTop + 1, 1, d.gateBottom - d.gateTop - 2);
      }
      ctx.fillStyle = "#ffde9a";
      ctx.fillText(d.gateOpen ? "GATE OPEN" : "BREAK ALL", d.areaX + d.areaW - 18, d.areaY + d.areaH - 8);
    }

    this.drawVausSprite(Math.floor(d.paddleX), Math.floor(d.paddleY), d.paddleW, d.paddleH, false);
    if (!d.ballExited) {
      const ballX = Math.floor(d.ballX - d.ballR);
      const ballY = Math.floor(d.ballY - d.ballR);
      ctx.fillStyle = "#9ee0ff";
      ctx.fillRect(ballX, ballY, 4, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ballX + 1, ballY + 1, 2, 2);
      ctx.fillStyle = "#3188d6";
      ctx.fillRect(ballX + 3, ballY + 1, 1, 2);
      ctx.fillRect(ballX + 1, ballY + 3, 2, 1);
    }
    if (d.flash > 0) {
      ctx.fillStyle = `rgba(255,230,170,${d.flash})`;
      ctx.fillRect(d.areaX, d.areaY, d.areaW, d.areaH);
    }
    if (d.exitFlash > 0) {
      ctx.fillStyle = `rgba(120,230,255,${d.exitFlash})`;
      ctx.fillRect(d.areaX, d.areaY, d.areaW, d.areaH);
    }

    if (page.id === "power" && d.capsuleActive) {
      const capsuleX = Math.floor(d.capsuleX - 6);
      const capsuleY = Math.floor(d.capsuleY - 3);
      ctx.fillStyle = "#78c9ff";
      ctx.fillRect(capsuleX, capsuleY, 12, 6);
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(capsuleX, capsuleY, 12, 1);
      ctx.fillStyle = "#131722";
      ctx.font = "6px 'Courier New', monospace";
      ctx.fillText(d.capsuleLabel, capsuleX + 6, capsuleY + 3.3);
    }

    if (page.id === "goal") {
      ctx.fillStyle = "#ffde9a";
      ctx.fillText("EXIT", d.areaX + d.areaW - 10, d.areaY + d.areaH - 8);
    }

    ctx.fillStyle = "#f3f7ff";
    ctx.font = "6px 'Courier New', monospace";
    for (let i = 0; i < page.lines.length; i += 1) {
      ctx.fillText(page.lines[i], centerX, 80 + i * 8);
    }

    ctx.fillStyle = blink ? "#ffe883" : "#ced5ec";
    ctx.fillText(page.hint, centerX, 182);
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    const centerX = VIRTUAL_WIDTH * 0.5;
    const blink = Math.floor(performance.now() / 360) % 2 === 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(PLAYFIELD.left + 12, 86, PLAYFIELD.right - PLAYFIELD.left - 24, 72);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(PLAYFIELD.left + 12, 86, PLAYFIELD.right - PLAYFIELD.left - 24, 1);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4b9";
    ctx.font = "10px 'Courier New', monospace";
    ctx.fillText("PAUSE", centerX, 98);
    const options = ["RESUME GAME", "MAIN MENU"];
    for (let i = 0; i < options.length; i += 1) {
      const y = 114 + i * 10;
      const selected = this.pauseSelection === i;
      ctx.fillStyle = selected ? "#ffd37f" : "#f2f6ff";
      ctx.font = "6px 'Courier New', monospace";
      ctx.fillText(options[i], centerX + 4, y);
      if (selected) {
        ctx.fillText(">", centerX - 40, y);
      }
    }
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillStyle = blink ? "#ffd37f" : "#d9e0ff";
    ctx.fillText("ARROWS SELECT  ENTER CONFIRM", centerX, 136);
  }

  drawOverlay() {
    if (this.state === GAME_STATE.NAME_ENTRY) {
      this.drawNameEntry();
      return;
    }
    if (this.state === GAME_STATE.ROUND_INTRO) {
      const title = this.boss ? "DOH" : `ROUND ${String(this.roundIndex + 1).padStart(2, "0")}`;
      this.drawLabel(title, "READY", false, false);
      return;
    }
    if (this.state === GAME_STATE.SERVE) {
      this.drawLabel(this.boss ? "DOH" : "READY", "SPACE TO LAUNCH", false, false);
      return;
    }
    if (this.state === GAME_STATE.BOSS && this.balls.every((ball) => ball.stuck)) {
      this.drawLabel("DOH", "SPACE TO LAUNCH", false, false);
      return;
    }
    if (this.state === GAME_STATE.PAUSED) {
      this.drawPauseOverlay();
      return;
    }
    if (this.state === GAME_STATE.ROUND_CLEAR) {
      this.drawLabel("ROUND CLEAR", `NEXT ${Math.ceil(this.roundClearTimer)}`, true, false);
      return;
    }
    if (this.state === GAME_STATE.GAME_OVER) {
      this.drawRunResult();
      return;
    }
    if (this.state === GAME_STATE.WIN) {
      this.drawRunResult();
    }
  }

  draw() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    this.ctx.save();
    this.ctx.translate(this.renderOffsetX, this.renderOffsetY);
    this.ctx.scale(this.scale, this.scale);

    this.drawBackground();
    if (this.state === GAME_STATE.MENU) {
      this.drawMenuScreen();
      this.drawScanlines();
      this.drawFlash();
      this.ctx.restore();
      return;
    }
    if (this.state === GAME_STATE.TUTORIAL) {
      this.drawTutorialScreen();
      this.drawScanlines();
      this.drawFlash();
      this.ctx.restore();
      return;
    }

    this.ctx.save();
    if (this.shake > 0) {
      this.ctx.translate(randomIn(-this.shake, this.shake), randomIn(-this.shake, this.shake));
    }
    this.drawArena();
    this.drawBricks();
    this.drawEnemies();
    this.drawCapsules();
    this.drawLasers();
    this.drawBoss();
    this.drawBossShots();
    this.drawPaddle();
    this.drawBalls();
    this.drawParticles();
    this.drawScorePopups();
    this.ctx.restore();

    this.drawHud();
    this.drawOverlay();
    this.drawScanlines();
    this.drawFlash();
    this.ctx.restore();
  }
}
