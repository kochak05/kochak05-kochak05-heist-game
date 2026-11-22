// guards.js — the museum guards: patrol routes, vision cones, spotting the thief.
// A guard walks a loop of waypoints, pauses at each one, and turns to face where
// it walks. When the thief is inside its cone with a clear line of sight, the
// guard spots the thief and the alarm climbs. A noisemaker can pull a guard away
// to investigate a sound.

import { moveCircle, lineBlocked, insideCone, pointInShadow } from "./world.js";

export const GUARD_RANGE = 235;
export const GUARD_HALF_ANGLE = 0.55;
export const GUARD_SPEED = 72;
export const GUARD_INVESTIGATE_SPEED = 96;

const PATROLS = [
  {
    name: "Rook",
    color: "#e8b23a",
    waypoints: [
      [300, 250],
      [980, 250],
      [980, 560],
      [300, 560],
    ],
  },
  {
    name: "Bishop",
    color: "#e86a3a",
    waypoints: [
      [200, 180],
      [200, 700],
      [400, 700],
      [400, 180],
    ],
  },
  {
    name: "Knight",
    color: "#7fb3e8",
    waypoints: [
      [1080, 180],
      [1080, 700],
      [880, 700],
      [880, 180],
    ],
  },
];

export function createGuards() {
  return PATROLS.map((p, i) => ({
    name: p.name,
    color: p.color,
    waypoints: p.waypoints,
    wp: i % p.waypoints.length,
    x: p.waypoints[i % p.waypoints.length][0],
    y: p.waypoints[i % p.waypoints.length][1],
    angle: Math.PI / 2,
    targetAngle: Math.PI / 2,
    pause: 0,
    mode: "patrol", // patrol | investigate | look
    investigateX: 0,
    investigateY: 0,
    lookTimer: 0,
    spotting: false,
    spotFlash: 0,
  }));
}

function turnToward(g, target, rate, dt) {
  let diff = target - g.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  g.angle += step;
}

export function updateGuard(g, dt) {
  if (g.mode === "investigate") {
    const dx = g.investigateX - g.x;
    const dy = g.investigateY - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      g.mode = "look";
      g.lookTimer = 3;
      return;
    }
    const nx = (dx / d) * GUARD_INVESTIGATE_SPEED * dt;
    const ny = (dy / d) * GUARD_INVESTIGATE_SPEED * dt;
    const [mx, my] = moveCircle(g.x, g.y, 13, nx, ny);
    g.x = mx;
    g.y = my;
    g.targetAngle = Math.atan2(dy, dx);
    turnToward(g, g.targetAngle, 6, dt);
    return;
  }
  if (g.mode === "look") {
    g.lookTimer -= dt;
    g.targetAngle += dt * 1.6;
    turnToward(g, g.targetAngle, 2.2, dt);
    if (g.lookTimer <= 0) g.mode = "patrol";
    return;
  }
  if (g.pause > 0) {
    g.pause -= dt;
    turnToward(g, g.targetAngle, 2.5, dt);
    return;
  }
  const [tx, ty] = g.waypoints[g.wp];
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 8) {
    g.wp = (g.wp + 1) % g.waypoints.length;
    g.pause = 1.1;
    const [nx2, ny2] = g.waypoints[g.wp];
    g.targetAngle = Math.atan2(ny2 - g.y, nx2 - g.x);
    return;
  }
  const nx = (dx / d) * GUARD_SPEED * dt;
  const ny = (dy / d) * GUARD_SPEED * dt;
  const [mx, my] = moveCircle(g.x, g.y, 13, nx, ny);
  g.x = mx;
  g.y = my;
  g.targetAngle = Math.atan2(dy, dx);
  turnToward(g, g.targetAngle, 5, dt);
}

// Pull the nearest patrolling guard toward (x, y) to investigate the sound.
export function lureGuards(guards, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const g of guards) {
    if (g.mode !== "patrol") continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  if (!best) return null;
  best.mode = "investigate";
  best.investigateX = x;
  best.investigateY = y;
  return best;
}

// How fast the alarm rises while this guard can see the thief (per second).
export function guardSeesThief(g, thiefX, thiefY, sneaking) {
  const seen = insideCone(g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE, thiefX, thiefY)
    && !lineBlocked(g.x, g.y, thiefX, thiefY);
  g.spotting = seen;
  if (seen) g.spotFlash = 0.5;
  else if (g.spotFlash > 0) g.spotFlash -= 1 / 60;
  if (!seen) return 0;
  const d = Math.hypot(thiefX - g.x, thiefY - g.y);
  let rate = 30 * (1.35 - d / GUARD_RANGE);
  if (pointInShadow(thiefX, thiefY)) rate *= 0.5;
  if (sneaking) rate *= 0.55;
  return Math.max(8, rate);
}
