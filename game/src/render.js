// render.js — everything the player sees, drawn on one canvas.
// The look is a night museum: dark parquet floor, warm carpet runner, gold loot,
// pale-yellow guard cones, red camera cones, and a HUD that always shows the
// alarm meter, the loot and the tools. Safe cover, danger and loot read at a glance.

import { WORLD_WIDTH, WORLD_HEIGHT, HUD_HEIGHT, SOLIDS, SHADOWS, VENTS, VAULT, LOOT, ENTRY, EXIT } from "./world.js";
import { GUARD_RANGE, GUARD_HALF_ANGLE } from "./guards.js";
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from "./cameras.js";

function drawCone(ctx, ox, oy, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawShadowPatch(ctx, s) {
  ctx.fillStyle = "rgba(8, 10, 26, 0.55)";
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = "rgba(120, 140, 220, 0.25)";
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(s.x, s.y, s.w, s.h);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(150, 170, 240, 0.5)";
  ctx.font = "11px sans-serif";
  ctx.fillText("SHADOW", s.x + 8, s.y + 16);
}

function drawRoom(ctx, state) {
  // Floor.
  ctx.fillStyle = "#23202a";
  ctx.fillRect(0, HUD_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT - HUD_HEIGHT);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 32; x < WORLD_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_HEIGHT);
    ctx.lineTo(x, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let y = HUD_HEIGHT + 32; y < WORLD_HEIGHT; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
    ctx.stroke();
  }
  // Carpet runner up the middle.
  ctx.fillStyle = "#5a2430";
  ctx.fillRect(600, HUD_HEIGHT, 80, WORLD_HEIGHT - HUD_HEIGHT);
  ctx.fillStyle = "#7a3040";
  ctx.fillRect(606, HUD_HEIGHT, 68, WORLD_HEIGHT - HUD_HEIGHT);
  // Shadow patches and vents.
  for (const s of SHADOWS) drawShadowPatch(ctx, s);
  for (const v of VENTS) {
    ctx.fillStyle = "#101018";
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = "#4a4a66";
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.fillStyle = "#8a8aa8";
    ctx.font = "11px sans-serif";
    ctx.fillText("VENT", v.x + 42, v.y + 32);
  }
  // Vault chamber.
  ctx.fillStyle = "#2e2a3a";
  ctx.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 2;
  ctx.strokeRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.fillStyle = "#c9a227";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("VAULT", VAULT.x + 82, VAULT.y + 24);
  // Entry / exit door.
  ctx.fillStyle = state.hasLoot ? "#2f7a3a" : "#3a3a4a";
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = "#e8e8f0";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(state.hasLoot ? "EXIT — GO!" : "ENTRY", EXIT.x + 8, EXIT.y - 6);
  // Solids.
  for (const s of SOLIDS) {
    if (s.kind === "wall") {
      ctx.fillStyle = "#4a4458";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = "#5d5670";
      ctx.fillRect(s.x, s.y, s.w, 3);
    } else {
      ctx.fillStyle = "#6a5a3a";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = "rgba(180, 220, 255, 0.35)";
      ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
      ctx.strokeStyle = "#c9a227";
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    }
  }
  // Loot: the Gilded Star, on its pedestal.
  if (!state.hasLoot) {
    const bob = Math.sin(state.time * 2) * 3;
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(LOOT.x - 22, LOOT.y + 8, 44, 10);
    ctx.save();
    ctx.translate(LOOT.x, LOOT.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ffd94a";
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = "#fff3b0";
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("★ THE GILDED STAR", LOOT.x - 72, LOOT.y + 34);
  }
}

function drawCones(ctx, state) {
  for (const cam of state.cameras) {
    const frozen = cam.frozen > 0;
    const fill = frozen ? "rgba(120,120,140,0.10)" : cam.spotting ? "rgba(255,60,60,0.30)" : "rgba(255,80,80,0.16)";
    const edge = frozen ? "rgba(140,140,160,0.4)" : "rgba(255,90,90,0.55)";
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, fill, edge);
  }
  for (const g of state.guards) {
    const fill = g.spotting ? "rgba(255,60,40,0.35)" : "rgba(255,210,90,0.20)";
    const edge = g.spotting ? "rgba(255,70,50,0.7)" : "rgba(255,210,90,0.5)";
    drawCone(ctx, g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE, fill, edge);
  }
}

function drawActors(ctx, state) {
  // Cameras.
  for (const cam of state.cameras) {
    ctx.fillStyle = cam.frozen > 0 ? "#8a8a9a" : "#c33";
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (cam.frozen > 0) {
      ctx.fillStyle = "#cfe8ff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("❄ " + Math.ceil(cam.frozen) + "s", cam.x + 12, cam.y - 10);
    }
  }
  // Guards.
  for (const g of state.guards) {
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 6, g.y + Math.sin(g.angle) * 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(g.name.toUpperCase(), g.x - 20, g.y - 18);
    if (g.spotting) {
      ctx.fillStyle = "#ff4030";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("!", g.x - 4, g.y - 28);
    } else if (g.mode === "investigate") {
      ctx.fillStyle = "#ffd25a";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("?", g.x - 5, g.y - 28);
    }
  }
  // Noisemaker ping.
  if (state.noisePing) {
    const age = state.time - state.noisePing.t;
    if (age < 1.2) {
      ctx.strokeStyle = `rgba(255, 210, 90, ${1 - age / 1.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.noisePing.x, state.noisePing.y, 10 + age * 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Thief.
  const t = state.thief;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate(t.angle);
  ctx.fillStyle = "#1c1c26";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e8e8f0";
  ctx.beginPath();
  ctx.arc(2, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(state.sneaking ? "SNEAKING" : "THIEF", t.x - 18, t.y - 18);
  // Click-to-move marker.
  if (state.moveTarget) {
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(state.moveTarget.x, state.moveTarget.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = "#14141f";
  ctx.fillRect(0, 0, WORLD_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = "#ffd94a";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("THE VELVET VAULT", 16, 28);
  ctx.fillStyle = "#9a9ab0";
  ctx.font = "12px sans-serif";
  ctx.fillText("a one-room heist", 16, 48);
  // Alarm meter.
  const ax = 300;
  const ay = 18;
  const aw = 300;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("ALARM", ax, ay + 12);
  ctx.fillStyle = "#2a2a38";
  ctx.fillRect(ax + 62, ay, aw, 16);
  const frac = Math.max(0, Math.min(1, state.alarm / 100));
  ctx.fillStyle = frac < 0.5 ? "#e8b23a" : frac < 0.8 ? "#e86a3a" : "#ff3020";
  ctx.fillRect(ax + 62, ay, aw * frac, 16);
  ctx.strokeStyle = "#888";
  ctx.strokeRect(ax + 62, ay, aw, 16);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText(Math.round(state.alarm) + "%", ax + 62 + aw + 8, ay + 13);
  // Loot.
  ctx.fillStyle = "#ffd94a";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(state.hasLoot ? "★ LOOT: THE GILDED STAR" : "○ LOOT: not taken", 700, 30);
  // Tools.
  ctx.fillStyle = "#cfe8ff";
  ctx.fillText("EMP [E] ×" + state.emp, 700, 50);
  ctx.fillStyle = "#ffd25a";
  ctx.fillText("NOISE [Q] ×" + state.noise, 820, 50);
  // Timer + objective.
  ctx.fillStyle = "#fff";
  ctx.font = "13px sans-serif";
  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60).toString().padStart(2, "0");
  ctx.fillText(mins + ":" + secs, 1010, 30);
  ctx.fillStyle = "#9a9ab0";
  ctx.font = "12px sans-serif";
  const objective = state.hasLoot ? "Get out through the green EXIT door!" : "Reach the VAULT, grab the Gilded Star.";
  ctx.fillText(objective, 1010, 50);
}

function drawOverlay(ctx, state) {
  ctx.fillStyle = "rgba(10, 10, 18, 0.82)";
  ctx.fillRect(0, HUD_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT - HUD_HEIGHT);
  ctx.textAlign = "center";
  if (state.phase === "menu") {
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 54px sans-serif";
    ctx.fillText("THE VELVET VAULT", WORLD_WIDTH / 2, 240);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("One room. Three guards. Two cameras. One Gilded Star.", WORLD_WIDTH / 2, 290);
    ctx.fillStyle = "#c8c8d8";
    ctx.font = "17px sans-serif";
    ctx.fillText("WASD / arrows — move      Shift — sneak      E — EMP (freezes cameras)", WORLD_WIDTH / 2, 350);
    ctx.fillText("Q — throw a noisemaker at the mouse      Click — walk there", WORLD_WIDTH / 2, 380);
    ctx.fillText("Slip past the cones, grab the Star, and get out the green door.", WORLD_WIDTH / 2, 410);
    ctx.fillText("Vents on the sides and dark shadows hide you. Getting seen raises the ALARM.", WORLD_WIDTH / 2, 440);
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Press ENTER or click to start the heist", WORLD_WIDTH / 2, 500);
  } else if (state.phase === "caught") {
    ctx.fillStyle = "#ff4030";
    ctx.font = "bold 54px sans-serif";
    ctx.fillText("CAUGHT!", WORLD_WIDTH / 2, 300);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("The alarm hit 100% — the museum locks down and the guards close in.", WORLD_WIDTH / 2, 350);
    ctx.fillStyle = "#c8c8d8";
    ctx.font = "17px sans-serif";
    ctx.fillText("You survived " + Math.floor(state.elapsed) + "s and got " + (state.hasLoot ? "the Star — so close!" : "no loot."), WORLD_WIDTH / 2, 390);
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Press R to try again", WORLD_WIDTH / 2, 450);
  } else if (state.phase === "win") {
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 54px sans-serif";
    ctx.fillText("GETAWAY CLEAN!", WORLD_WIDTH / 2, 280);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("The Gilded Star is yours. The crew is already gone.", WORLD_WIDTH / 2, 330);
    ctx.fillStyle = "#c8c8d8";
    ctx.font = "18px sans-serif";
    ctx.fillText("Time " + Math.floor(state.elapsed) + "s   ·   Peak alarm " + Math.round(state.peakAlarm) + "%   ·   Tools left " + (state.emp + state.noise), WORLD_WIDTH / 2, 380);
    ctx.fillText("Score: " + state.score, WORLD_WIDTH / 2, 415);
    ctx.fillStyle = "#ffd94a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Press R to run it again", WORLD_WIDTH / 2, 470);
  }
  ctx.textAlign = "left";
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawRoom(ctx, state);
  drawCones(ctx, state);
  drawActors(ctx, state);
  drawHud(ctx, state);
  if (state.phase !== "playing") drawOverlay(ctx, state);
  // Alarm vignette: the screen edges burn red as the alarm climbs.
  if (state.phase === "playing" && state.alarm > 45) {
    const a = ((state.alarm - 45) / 55) * 0.35 * (0.7 + 0.3 * Math.sin(state.time * 6));
    ctx.strokeStyle = `rgba(255, 40, 20, ${a})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(9, HUD_HEIGHT + 9, WORLD_WIDTH - 18, WORLD_HEIGHT - HUD_HEIGHT - 18);
  }
}
