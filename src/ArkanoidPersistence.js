import {
  GAME_STATE,
  LEADERBOARD_SIZE,
  STORAGE_KEY_HIGH_SCORE,
  STORAGE_KEY_LEADERBOARD,
} from "./constants.js";
import { clamp } from "./utils.js";

const NAME_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ".split("");
const DEFAULT_LEADERBOARD = Object.freeze([
  { name: "AAA", score: 50000 },
  { name: "BBB", score: 35000 },
  { name: "CCC", score: 22000 },
  { name: "DDD", score: 12000 },
  { name: "EEE", score: 8000 },
]);

export class ArkanoidPersistence {
  readHighScore() {
    const value = Number.parseInt(localStorage.getItem(STORAGE_KEY_HIGH_SCORE) || "0", 10);
    return Number.isFinite(value) ? value : 0;
  }

  normalizeLeaderboardEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const rawName = typeof entry.name === "string" ? entry.name : "";
    const filtered = rawName.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
    const safeName = (filtered.padEnd(3, "A").slice(0, 3) || "AAA").trimEnd() || "AAA";
    const safeScore = Number.isFinite(entry.score) ? Math.max(0, Math.floor(entry.score)) : 0;
    return { name: safeName, score: safeScore };
  }

  readLeaderboard() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      if (!raw) {
        return DEFAULT_LEADERBOARD.map((entry) => ({ ...entry }));
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return DEFAULT_LEADERBOARD.map((entry) => ({ ...entry }));
      }
      const normalized = parsed
        .map((entry) => this.normalizeLeaderboardEntry(entry))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, LEADERBOARD_SIZE);
      if (normalized.length === 0) {
        return DEFAULT_LEADERBOARD.map((entry) => ({ ...entry }));
      }
      while (normalized.length < LEADERBOARD_SIZE) {
        const fallback = DEFAULT_LEADERBOARD[normalized.length] || { name: "AAA", score: 0 };
        normalized.push({ ...fallback });
      }
      return normalized;
    } catch {
      return DEFAULT_LEADERBOARD.map((entry) => ({ ...entry }));
    }
  }

  saveLeaderboard() {
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(this.leaderboard));
  }

  saveHighScore() {
    localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(this.highScore));
  }

  qualifiesForLeaderboard(score) {
    const minEntry = this.leaderboard[this.leaderboard.length - 1];
    return score > (minEntry?.score || 0);
  }

  getLeaderboardRank(score) {
    let rank = 1;
    for (const entry of this.leaderboard) {
      if (score < entry.score) {
        rank += 1;
      } else {
        break;
      }
    }
    return rank <= LEADERBOARD_SIZE ? rank : null;
  }

  beginNameEntry(score, didWin = false) {
    const seed = didWin ? ["W", "I", "N"] : ["A", "A", "A"];
    this.nameEntry.chars = seed;
    this.nameEntry.index = 0;
    this.nameEntry.score = Math.max(0, Math.floor(score));
    this.nameEntry.didWin = didWin;
    this.nameEntry.rank = this.getLeaderboardRank(this.nameEntry.score);
    this.input.left = false;
    this.input.right = false;
    this.state = GAME_STATE.NAME_ENTRY;
    this.setBootNote("ENTER INITIALS", true);
  }

  commitNameEntry() {
    const name = (this.nameEntry.chars.join("").trim() || "AAA").slice(0, 3);
    this.leaderboard.push({
      name,
      score: this.nameEntry.score,
    });
    this.leaderboard = this.leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE)
      .map((entry) => this.normalizeLeaderboardEntry(entry))
      .filter(Boolean);
    this.saveLeaderboard();

    const boardHighScore = this.leaderboard[0]?.score || 0;
    if (boardHighScore > this.highScore) {
      this.highScore = boardHighScore;
      this.saveHighScore();
    }

    this.lastRunResult = {
      score: this.nameEntry.score,
      didWin: this.nameEntry.didWin,
      rank: this.getLeaderboardRank(this.nameEntry.score),
    };

    this.menuPage = 2;
    this.menuPageTimer = 10;
    this.menuLeaderboardOpened = true;
    this.menuNotice = "";
    this.menuNoticeTimer = 0;
    this.input.left = false;
    this.input.right = false;
    this.state = GAME_STATE.MENU;
    this.setBootNote("PRESS SPACE TO START", true);
  }

  cycleNameEntry(step) {
    const index = this.nameEntry.index;
    const current = this.nameEntry.chars[index] || "A";
    const pos = NAME_CHARSET.indexOf(current);
    const startPos = pos === -1 ? 0 : pos;
    const nextPos = (startPos + step + NAME_CHARSET.length) % NAME_CHARSET.length;
    this.nameEntry.chars[index] = NAME_CHARSET[nextPos];
  }

  moveNameEntryCursor(step) {
    this.nameEntry.index = clamp(this.nameEntry.index + step, 0, 2);
  }

  typeNameEntryChar(char) {
    const upper = char.toUpperCase();
    if (!/^[A-Z0-9 ]$/.test(upper)) {
      return;
    }
    this.nameEntry.chars[this.nameEntry.index] = upper;
    if (this.nameEntry.index < 2) {
      this.nameEntry.index += 1;
    }
  }

  handleNameEntryInput(event) {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
      this.moveNameEntryCursor(-1);
      return;
    }
    if (event.code === "ArrowRight" || event.code === "KeyD") {
      this.moveNameEntryCursor(1);
      return;
    }
    if (event.code === "ArrowUp" || event.code === "KeyW") {
      this.cycleNameEntry(1);
      return;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
      this.cycleNameEntry(-1);
      return;
    }
    if (event.code === "Backspace") {
      this.nameEntry.chars[this.nameEntry.index] = "A";
      this.moveNameEntryCursor(-1);
      return;
    }
    if (event.code === "Enter" || event.code === "Space") {
      this.commitNameEntry();
      return;
    }
    if (event.key && event.key.length === 1) {
      this.typeNameEntryChar(event.key);
    }
  }
}
