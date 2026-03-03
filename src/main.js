import { ArkanoidGame } from "./ArkanoidGame.js";

export const bootGame = () => {
  const canvas = document.getElementById("gameCanvas");
  const bootNote = document.getElementById("bootNote");
  if (!(canvas instanceof HTMLCanvasElement) || !(bootNote instanceof HTMLElement)) {
    throw new Error("Failed to initialize game UI.");
  }
  return new ArkanoidGame(canvas, bootNote);
};
