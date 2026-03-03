export const STORAGE_KEY_HIGH_SCORE = "arkanoid_high_score";
export const STORAGE_KEY_LEADERBOARD = "arkanoid_leaderboard";

export const GAME_STATE = Object.freeze({
  MENU: "menu",
  TUTORIAL: "tutorial",
  NAME_ENTRY: "name_entry",
  ROUND_INTRO: "round_intro",
  SERVE: "serve",
  PLAYING: "playing",
  BOSS: "boss",
  PAUSED: "paused",
  ROUND_CLEAR: "round_clear",
  GAME_OVER: "game_over",
  WIN: "win",
});

export const VIRTUAL_WIDTH = 256;
export const VIRTUAL_HEIGHT = 240;

export const PLAYFIELD = Object.freeze({
  left: 40,
  right: 216,
  top: 24,
  bottom: 232,
  gateTop: 96,
  gateBottom: 134,
});

export const BRICK_SIZE = Object.freeze({
  width: 16,
  height: 8,
});

export const BRICK_TYPES = Object.freeze({
  W: { color: "#f3f3ff", shade: "#a6a6bf", points: 50, hits: 1 },
  O: { color: "#ffb52f", shade: "#c57900", points: 60, hits: 1 },
  L: { color: "#4fd5ff", shade: "#1689c9", points: 70, hits: 1 },
  G: { color: "#52ec52", shade: "#229222", points: 80, hits: 1 },
  R: { color: "#ff6161", shade: "#b72424", points: 90, hits: 1 },
  B: { color: "#5a8dff", shade: "#2d52a8", points: 100, hits: 1 },
  P: { color: "#d47eff", shade: "#7e35b1", points: 110, hits: 1 },
  Y: { color: "#ffe34f", shade: "#c39c1f", points: 120, hits: 1 },
  S: { color: "#d2d2d2", shade: "#8b8b8b", points: 50, hits: 2, silver: true },
  X: { color: "#cc8e31", shade: "#7a4e0e", points: 0, hits: 999, unbreakable: true },
});

export const CAPSULES = Object.freeze([
  { id: "S", label: "S", color: "#8eff6f", weight: 12 },
  { id: "E", label: "E", color: "#78c9ff", weight: 18 },
  { id: "C", label: "C", color: "#ffd77d", weight: 15 },
  { id: "L", label: "L", color: "#ff7cb6", weight: 15 },
  { id: "D", label: "D", color: "#9d9cff", weight: 15 },
  { id: "B", label: "B", color: "#ffae7a", weight: 10 },
  { id: "P", label: "P", color: "#fff28e", weight: 15 },
]);

export const ENEMY_TYPES = Object.freeze([
  { id: "F", color: "#74d3ff", shade: "#2f6fb5", eye: "#0f1a3c", points: 120, speed: 34 },
  { id: "R", color: "#ff8ba0", shade: "#b03e5b", eye: "#351123", points: 160, speed: 38 },
  { id: "G", color: "#8df0a1", shade: "#43a863", eye: "#113522", points: 200, speed: 42 },
]);

export const EXTRA_LIFE_FIRST = 20000;
export const EXTRA_LIFE_STEP = 60000;
export const LEADERBOARD_SIZE = 5;
