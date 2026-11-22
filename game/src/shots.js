// shots.js — deterministic screenshot scenes for the entry's screenshots.
// ?shot=cover | tense | getaway freezes the game at a fixed moment so every
// screenshot is reproducible: same guard spots, same cone angles, same alarm.
// The scenes are real game states — nothing is drawn just for the camera.

export function applyShot(state, scene) {
  state.frozenShot = true;
  state.phase = "playing";
  state.time = 12;
  if (scene === "cover") {
    // The whole heist in one frame: thief mid-room, guards mid-patrol with
    // cones sweeping, both cameras live, loot shining, alarm part-filled.
    state.thief.x = 640;
    state.thief.y = 505;
    state.thief.angle = -Math.PI / 2;
    state.alarm = 34;
    state.hasLoot = false;
    state.elapsed = 47;
    placeGuard(state.guards[0], 700, 250, 0.5);
    placeGuard(state.guards[1], 200, 470, Math.PI / 2);
    placeGuard(state.guards[2], 980, 560, -Math.PI / 2);
    state.cameras[0].angle = Math.PI * 0.55;
    state.cameras[1].angle = Math.PI * 0.45;
    state.cameras[0].frozen = 0;
    state.cameras[1].frozen = 0;
  } else if (scene === "tense") {
    // A heartbeat from being caught: the thief is just inside Rook's cone edge,
    // the alarm is at 72% and climbing, Bishop is turning toward the noise.
    state.thief.x = 760;
    state.thief.y = 300;
    state.thief.angle = Math.PI;
    state.sneaking = true;
    state.alarm = 72;
    state.hasLoot = false;
    state.elapsed = 96;
    placeGuard(state.guards[0], 700, 250, 0.35);
    state.guards[0].spotting = true;
    placeGuard(state.guards[1], 330, 470, 0.4);
    state.guards[1].mode = "investigate";
    state.guards[1].investigateX = 760;
    state.guards[1].investigateY = 300;
    placeGuard(state.guards[2], 980, 560, -Math.PI / 2);
    state.cameras[0].angle = Math.PI * 0.6;
    state.cameras[1].angle = Math.PI * 0.5;
    state.cameras[1].frozen = 4;
    state.noisePing = { x: 760, y: 300, t: 11.4 };
  } else if (scene === "getaway") {
    // The payoff: Star secured, thief at the green exit, guards left behind.
    state.thief.x = 640;
    state.thief.y = 745;
    state.thief.angle = Math.PI / 2;
    state.alarm = 58;
    state.peakAlarm = 81;
    state.hasLoot = true;
    state.elapsed = 143;
    state.emp = 1;
    state.noise = 0;
    state.score = 7420;
    state.phase = "win";
    placeGuard(state.guards[0], 500, 300, -0.6);
    placeGuard(state.guards[1], 200, 620, Math.PI);
    placeGuard(state.guards[2], 1000, 420, Math.PI / 2);
    state.cameras[0].angle = Math.PI * 0.3;
    state.cameras[1].angle = Math.PI * 0.7;
  }
}

function placeGuard(g, x, y, angle) {
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.targetAngle = angle;
  g.mode = "patrol";
  g.spotting = false;
  g.spotFlash = 0;
}
