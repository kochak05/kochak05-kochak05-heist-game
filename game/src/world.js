// world.js — the museum floor: walls, cover, vents, shadows, vault, loot, exit.
// Pure layout data plus the collision and line-of-sight helpers the game uses.
// Nothing here knows about guards, rendering or input; it only describes the room.

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 800;
export const HUD_HEIGHT = 64;

// Every solid rectangle in the room: { x, y, w, h, kind }.
// kind "wall" blocks movement and sight; kind "case" blocks movement only
// (a low glass display case you can see over, but not walk through).
export const SOLIDS = [
  // Outer border.
  { x: 0, y: 64, w: 1280, h: 16, kind: "wall" },
  { x: 0, y: 784, w: 1280, h: 16, kind: "wall" },
  { x: 0, y: 64, w: 16, h: 736, kind: "wall" },
  { x: 1264, y: 64, w: 16, h: 736, kind: "wall" },
  // Vault chamber, top centre, with a door gap at the bottom (x 600..680).
  { x: 520, y: 96, w: 16, h: 124, kind: "wall" },
  { x: 744, y: 96, w: 16, h: 124, kind: "wall" },
  { x: 520, y: 96, w: 240, h: 16, kind: "wall" },
  { x: 520, y: 204, w: 80, h: 16, kind: "wall" },
  { x: 680, y: 204, w: 80, h: 16, kind: "wall" },
  // Mid-room partition: three gaps — left vent, centre aisle, right vent.
  { x: 200, y: 400, w: 320, h: 16, kind: "wall" },
  { x: 760, y: 400, w: 320, h: 16, kind: "wall" },
  // Pillars: tall, block movement and sight.
  { x: 430, y: 180, w: 36, h: 36, kind: "wall" },
  { x: 814, y: 180, w: 36, h: 36, kind: "wall" },
  { x: 430, y: 620, w: 36, h: 36, kind: "wall" },
  { x: 814, y: 620, w: 36, h: 36, kind: "wall" },
  { x: 560, y: 440, w: 36, h: 36, kind: "wall" },
  // Display cases: cover to hide behind, glass you can see over.
  { x: 300, y: 300, w: 120, h: 60, kind: "case" },
  { x: 860, y: 300, w: 120, h: 60, kind: "case" },
  { x: 300, y: 520, w: 120, h: 60, kind: "case" },
  { x: 860, y: 520, w: 120, h: 60, kind: "case" },
];

// Dark floor patches where the thief is harder to spot (alarm rises half as fast).
export const SHADOWS = [
  { x: 80, y: 580, w: 200, h: 150 },
  { x: 1000, y: 140, w: 200, h: 150 },
  { x: 540, y: 640, w: 200, h: 120 },
];

// Narrow vent runs along the side walls: the quiet way through the mid-room.
export const VENTS = [
  { x: 40, y: 380, w: 120, h: 56 },
  { x: 1120, y: 380, w: 120, h: 56 },
];

export const VAULT = { x: 536, y: 112, w: 208, h: 92 };
export const LOOT = { x: 640, y: 158, r: 16 };
export const ENTRY = { x: 640, y: 740 };
export const EXIT = { x: 600, y: 768, w: 80, h: 16 };

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function pointInShadow(px, py) {
  return SHADOWS.some((s) => pointInRect(px, py, s));
}

// Circle (px, py, radius) against one solid rectangle: push the circle out.
function resolveCircleRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [px, py];
  if (d2 === 0) return [px, py - r];
  const d = Math.sqrt(d2);
  return [px + (dx / d) * (r - d), py + (dy / d) * (r - d)];
}

// Move a circle by (dx, dy), sliding along solids instead of sticking.
export function moveCircle(px, py, r, dx, dy) {
  let nx = px + dx;
  let ny = py;
  for (const s of SOLIDS) [nx, ny] = resolveCircleRect(nx, ny, r, s);
  nx = Math.max(16 + r, Math.min(WORLD_WIDTH - 16 - r, nx));
  ny = Math.max(HUD_HEIGHT + 16 + r, Math.min(WORLD_HEIGHT - 16 - r, ny));
  let fx = nx;
  let fy = py + dy;
  for (const s of SOLIDS) [fx, fy] = resolveCircleRect(fx, fy, r, s);
  fx = Math.max(16 + r, Math.min(WORLD_WIDTH - 16 - r, fx));
  fy = Math.max(HUD_HEIGHT + 16 + r, Math.min(WORLD_HEIGHT - 16 - r, fy));
  return [fx, fy];
}

// True when the straight segment (ax,ay)-(bx,by) is blocked by a sight-blocking solid.
export function lineBlocked(ax, ay, bx, by) {
  const steps = 24;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    for (const s of SOLIDS) {
      if (s.kind !== "wall") continue;
      if (pointInRect(x, y, s)) return true;
    }
  }
  return false;
}

// True when (px, py) lies inside a vision cone from (ox, oy) facing `angle`.
export function insideCone(ox, oy, angle, range, halfAngle, px, py) {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < 4) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}
