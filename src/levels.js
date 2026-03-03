import { BRICK_SIZE, PLAYFIELD } from "./constants.js";

const BASE_PATTERNS = Object.freeze([
  [
    "SSSSSSSSSSS",
    "RRRRRRRRRRR",
    "BBBBBBBBBBB",
    "YYYYYYYYYYY",
    "PPPPPPPPPPP",
    "GGGGGGGGGGG",
  ],
  [
    "O..........",
    "OL.........",
    "OLG........",
    "OLGB.......",
    "OLGBR......",
    "OLGBRO.....",
    "OLGBROL....",
    "OLGBROLG...",
    "OLGBROLGB..",
    "OLGBROLGBR.",
    "SSSSSSSSSSO",
  ],
  [
    "GGGGGGGGGGG",
    "WWWXXXXXXXX",
    "RRRRRRRRRRR",
    "XXXXXXXXWWW",
    "PPPPPPPPPPP",
    "BBBXXXXXXXX",
    "BBBBBBBBBBB",
    "RRRRRRRRRRR",
  ],
  [
    "SYGP...YGBS",
    "BGYR...GYSB",
    "GPRY...BSYG",
    "YRPG...SBGY",
    "RYGB...BGYR",
    "PGYS...GYRP",
    "GBSY...PRYG",
    "YSBG...RPGY",
    "RYGB...BGYR",
    "GPRY...BSYG",
    "YRPG...SBGY",
    "YRGB...GBRY",
    "PGYS...GYRP",
    "GBRY...RYGB",
    "YGBS...SBGY"
  ],
  [
    "...Y...Y...",
    "....Y.Y....",
    "....Y.Y....",
    "...SSSSS...",
    "...SSSSS...",
    "..SSRSRSS..",
    "..SSRSRSS..",
    ".SSSSSSSSS.",
    ".SSSSSSSSS.",
    ".S.SSSSS.S.",
    ".S.S.....S.",
    ".S.S.....S.",
    "....S.S....",
    "....S.S....",
  ],
  [
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "B.XOXOXOX.B",
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "B.R.G.G.R.B",
    "O.X.X.X.X.O",
    "B.R.G.G.R.B",
  ],
  [
    "....YLB....",
    "...YGBLY...",
    "...LBGYO...",
    "..GBLYGRO..",
    "..BGYORGY..",
    "..LYGROYG..",
    "..YORGYLB..",
    "..GROYGBL..",
    "..RGYLBGY..",
    "...YGBLY...",
    "...LBGYO...",
    "....LYG....",
  ],
  [
    "X..X...X..X",
    "XX.......XX",
    ".....O.....",
    "....XGX....",
    "..X..Y..X..",
    ".....B.....",
    "..X..R..X..",
    "....XGX....",
    ".....Y.....",
    "XX.......XX",
    "X..X...X..X",
  ],
  [
    "X.X.....X.X",
    "XGX.....XGX",
    "XBX.....XBX",
    "XXX.....XXX",
    "...PBBBY...",
    "...PGLGY...",
    "...PLGLY...",
    "...PGLGY...",
    "...PLGLY...",
    "...PBBBY...",
  ],
  [
    "X..........",
    "X..........",
    "X.......B..",
    "X......BLB.",
    "X....BLBLB.",
    "X..BLBSBLB.",
    "X....BLBLB.",
    "X......BLB.",
    "X.......B..",
    "X..........",
    "X..........",
    "X..........",
    "X..........",
    "XXXXXXXXXX.",
  ],
  [
    ".SSSSSSSSS.",
    ".S.......S.",
    ".S.SSSSS.S.",
    ".S.S.....S.",
    ".S.S..S..S.",
    ".S.S.....S.",
    ".S.SSSSS.S.",
    ".S.......S.",
    ".SSSSSSSSS.",
  ],
  [
    "XXXXXXXXXXX",
    ".....X...XO",
    "..XG.X...X.",
    "..X..X.X.X.",
    "..X..X.X.X.",
    "..X..XGX.X.",
    "..X.OX.XBX.",
    "..X..XRX.X.",
    "..X..X.X.X.",
    "..X..X.X.X.",
    "..XL...X...",
    "..X....X..O",
    ".XXXXXXXXXX",
  ],
  [
    "YY.WWW.YY..",
    "WW.YYY.WW..",
    "BB.RRR.BB..",
    "PP.GGG.PP..",
    "GG.PPP.GG..",
    "RR.BBB.RR..",
    "YY.WWW.YY..",
    "WW.YYY.WW..",
  ],
  [
    "RSSSSSSSSSR",
    "X.........X",
    "BBBBBBBBBBB",
    "OSSSSSSSSSO",
    "X.........X",
    "BBBBBBBBBBB",
    "BSSSSSSSSSB",
    "X.........X",
    "RRRRRRRRRRR",
    "RRRRRRRRRRR",
    "X.........X",
  ],
]);

const TOTAL_ROUNDS_BEFORE_BOSS = 35;
const ROUND_PATTERN_SEQUENCE = Object.freeze([
  0, 1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12, 13,
  0, 2, 4, 6, 8, 10, 12,
  1, 3, 5, 7, 9, 11, 13,
  2, 5, 8, 11, 4, 7, 10,
]);

const normalizeRow = (row, columns) => {
  if (row.length === columns) {
    return row;
  }
  if (row.length > columns) {
    return row.slice(0, columns);
  }
  return row.padEnd(columns, ".");
};

export const getRoundPattern = (roundIndex) => {
  const safeIndex = Math.max(0, roundIndex);
  const seqIndex = ROUND_PATTERN_SEQUENCE[safeIndex % ROUND_PATTERN_SEQUENCE.length];
  return BASE_PATTERNS[seqIndex];
};

export const getMaxRounds = () => TOTAL_ROUNDS_BEFORE_BOSS;

export const buildBricksFromPattern = (pattern, roundIndex, brickTypes) => {
  const columns = 11;
  const brickWidth = BRICK_SIZE.width;
  const brickHeight = BRICK_SIZE.height;
  const startX = PLAYFIELD.left;
  const startY = PLAYFIELD.top + 16;
  const level = roundIndex + 1;
  const silverHits = 2 + Math.floor(Math.min(roundIndex, 31) / 8);
  const silverPoints = level * 50;

  const bricks = [];
  for (let row = 0; row < pattern.length; row += 1) {
    const normalized = normalizeRow(pattern[row], columns);
    for (let col = 0; col < columns; col += 1) {
      const token = normalized[col];
      if (token === "." || token === " ") {
        continue;
      }
      const type = brickTypes[token] || brickTypes.W;
      const points = type.silver ? silverPoints : type.points;
      bricks.push({
        x: startX + col * brickWidth,
        y: startY + row * brickHeight,
        w: brickWidth,
        h: brickHeight,
        color: type.color,
        shade: type.shade,
        points,
        hp: type.silver ? silverHits : type.hits,
        maxHp: type.silver ? silverHits : type.hits,
        silver: Boolean(type.silver),
        unbreakable: Boolean(type.unbreakable),
        alive: true,
      });
    }
  }

  return bricks;
};
