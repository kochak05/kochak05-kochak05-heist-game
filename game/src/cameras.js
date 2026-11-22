// cameras.js — the wall-mounted security cameras: rotating vision cones.
// A camera sweeps back and forth around its mount. When its cone catches the
// thief with a clear line of sight, the alarm climbs. An EMP freezes a camera
// in place for a few seconds; while frozen it cannot spot anyone.

import { lineBlocked, insideCone, pointInShadow } from "./world.js";

export const CAMERA_RANGE = 215;
export const CAMERA_HALF_ANGLE = 0.5;
export const EMP_FREEZE_SECONDS = 6;

const MOUNTS = [
  { x: 140, y: 96, baseAngle: Math.PI * 0.32, sweep: 0.85, speed: 0.55, phase: 0 },
  { x: 1140, y: 96, baseAngle: Math.PI * 0.68, sweep: 0.85, speed: 0.45, phase: 1.7 },
];

export function createCameras() {
  return MOUNTS.map((m) => ({
    x: m.x,
    y: m.y,
    baseAngle: m.baseAngle,
    sweep: m.sweep,
    speed: m.speed,
    phase: m.phase,
    angle: m.baseAngle,
    frozen: 0,
    spotting: false,
  }));
}

export function updateCamera(cam, t) {
  if (cam.frozen > 0) {
    cam.frozen -= 1 / 60;
    return;
  }
  cam.angle = cam.baseAngle + Math.sin(t * cam.speed + cam.phase) * cam.sweep;
}

// Freeze every camera for EMP_FREEZE_SECONDS. Returns how many were frozen.
export function freezeCameras(cameras) {
  let n = 0;
  for (const cam of cameras) {
    if (cam.frozen <= 0) n++;
    cam.frozen = EMP_FREEZE_SECONDS;
  }
  return n;
}

// How fast the alarm rises while this camera can see the thief (per second).
export function cameraSeesThief(cam, thiefX, thiefY, sneaking) {
  if (cam.frozen > 0) {
    cam.spotting = false;
    return 0;
  }
  const seen = insideCone(cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, thiefX, thiefY)
    && !lineBlocked(cam.x, cam.y, thiefX, thiefY);
  cam.spotting = seen;
  if (!seen) return 0;
  const d = Math.hypot(thiefX - cam.x, thiefY - cam.y);
  let rate = 24 * (1.3 - d / CAMERA_RANGE);
  if (pointInShadow(thiefX, thiefY)) rate *= 0.5;
  if (sneaking) rate *= 0.55;
  return Math.max(7, rate);
}
