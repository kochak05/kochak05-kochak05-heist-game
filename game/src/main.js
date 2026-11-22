// main.js — the heist itself: game state, the loop, the rules.
// One thief crosses the museum, grabs the Gilded Star and gets out. Guards and
// cameras raise the alarm when they see the thief; at 100% the heist is over.
// EMP freezes the cameras, a noisemaker pulls a guard away — both cost charges.

import { WORLD_WIDTH, WORLD_HEIGHT, HUD_HEIGHT, LOOT, EXIT, ENTRY, moveCircle, pointInShadow } from "./world.js";
import { createGuards, updateGuard, lureGuards, guardSeesThief } from "./guards.js";
import { createCameras, updateCamera, freezeCameras, cameraSeesThief } from "./cameras.js";
import { createAudio } from "./audio.js";
import { createInput } from "./input.js";
import { drawGame } from "./render.js";
import { applyShot } from "./shots.js";

const THIEF_SPEED = 175;
const SNEAK_SPEED = 95;
const THIEF_RADIUS = 12;
const ALARM_DECAY = 6;

export function createState() {
  return {
    phase: "menu", // menu | playing | caught | win
    time: 0,
    elapsed: 0,
    alarm: 0,
    peakAlarm: 0,
    hasLoot: false,
    emp: 2,
    noise: 2,
    score: 0,
    sneaking: false,
    moveTarget: null,
    noisePing: null,
    frozenShot: false,
    thief: { x: ENTRY.x, y: ENTRY.y, angle: -Math.PI / 2 },
    guards: createGuards(),
    cameras: createCameras(),
  };
}

function resetState(state) {
  const fresh = createState();
  fresh.phase = "playing";
  Object.assign(state, fresh);
}

function scoreHeist(state) {
  const timePart = Math.max(0, 6000 - Math.floor(state.elapsed) * 25);
  const calmPart = Math.max(0, 2000 - Math.round(state.peakAlarm) * 15);
  const toolPart = (state.emp + state.noise) * 400;
  return 1000 + timePart + calmPart + toolPart;
}

export function updatePlaying(state, input, audio, dt) {
  state.elapsed += dt;
  const [kx, ky] = input.moveVector();
  state.sneaking = input.sneaking;
  let mx = kx;
  let my = ky;
  if (mx === 0 && my === 0 && state.moveTarget) {
    const dx = state.moveTarget.x - state.thief.x;
    const dy = state.moveTarget.y - state.thief.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) state.moveTarget = null;
    else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    if (kx !== 0 || ky !== 0) state.moveTarget = null;
    const speed = state.sneaking ? SNEAK_SPEED : THIEF_SPEED;
    const [nx, ny] = moveCircle(state.thief.x, state.thief.y, THIEF_RADIUS, mx * speed * dt, my * speed * dt);
    state.thief.x = nx;
    state.thief.y = ny;
    state.thief.angle = Math.atan2(my, mx);
  }
  // Tools.
  if (input.consumePressed("e") && state.emp > 0) {
    state.emp -= 1;
    freezeCameras(state.cameras);
    audio.emp();
  }
  if (input.consumePressed("q") && state.noise > 0) {
    state.noise -= 1;
    const tx = input.mouseX || state.thief.x + Math.cos(state.thief.angle) * 120;
    const ty = input.mouseY || state.thief.y + Math.sin(state.thief.angle) * 120;
    lureGuards(state.guards, tx, ty);
    state.noisePing = { x: tx, y: ty, t: state.time };
    audio.noise();
  }
  // Click-to-move (only when the click was not on a HUD button).
  if (input.clickTarget) {
    const c = input.clickTarget;
    input.clickTarget = null;
    if (c.y > HUD_HEIGHT) state.moveTarget = { x: c.x, y: c.y };
  }
  // Guards and cameras.
  for (const g of state.guards) updateGuard(g, dt);
  for (const cam of state.cameras) updateCamera(cam, state.time);
  // Detection: alarm climbs while anyone sees the thief, decays otherwise.
  let rise = 0;
  for (const g of state.guards) rise += guardSeesThief(g, state.thief.x, state.thief.y, state.sneaking);
  for (const cam of state.cameras) rise += cameraSeesThief(cam, state.thief.x, state.thief.y, state.sneaking);
  if (rise > 0) {
    state.alarm += rise * dt;
    if (state.alarm > 60 && Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) audio.tick();
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  if (state.alarm >= 100) {
    state.alarm = 100;
    state.phase = "caught";
    audio.caught();
    return;
  }
  // Loot: touch the Star inside the vault.
  if (!state.hasLoot && Math.hypot(state.thief.x - LOOT.x, state.thief.y - LOOT.y) < LOOT.r + THIEF_RADIUS + 4) {
    state.hasLoot = true;
    audio.loot();
  }
  // Getaway: reach the exit door with the Star.
  if (state.hasLoot && state.thief.y > EXIT.y - 6 && Math.abs(state.thief.x - 640) < 44) {
    state.phase = "win";
    state.score = scoreHeist(state);
    audio.win();
  }
}

export function startGame() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const state = createState();
  window.__heistState = state;
  const audio = createAudio();
  const input = createInput(canvas);
  input.attach();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (shot) {
    applyShot(state, shot);
  }
  input.onKey = (k) => {
    if (k === "enter" && state.phase === "menu") {
      audio.ensure();
      audio.click();
      resetState(state);
    } else if (k === "r" && (state.phase === "caught" || state.phase === "win")) {
      audio.click();
      resetState(state);
    } else if (k === "m") {
      audio.muted = !audio.muted;
    }
  };
  canvas.addEventListener("mousedown", () => {
    if (state.phase === "menu") {
      audio.ensure();
      audio.click();
      resetState(state);
    }
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.frozenShot) state.time += dt;
    if (state.phase === "playing" && !state.frozenShot) updatePlaying(state, input, audio, dt);
    drawGame(ctx, state);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

startGame();
