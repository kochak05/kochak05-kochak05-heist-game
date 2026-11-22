// input.js — keyboard and mouse input for the heist.
// WASD or arrows move the thief, Shift sneaks, E fires the EMP, Q throws the
// noisemaker at the mouse, and a click sets a walk target (or presses a HUD
// button). Keys are tracked as a held set so diagonal movement just works.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clickTarget: null,
    pressed: new Set(),
    onKey: null,
    attach() {
      window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
          e.preventDefault();
        }
        if (!e.repeat) {
          this.keys.add(k);
          this.pressed.add(k);
          if (this.onKey) this.onKey(k);
        }
      });
      window.addEventListener("keyup", (e) => {
        this.keys.delete(e.key.toLowerCase());
      });
      window.addEventListener("blur", () => this.keys.clear());
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
        this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
      });
      canvas.addEventListener("mousedown", (e) => {
        this.mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        this.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
        this.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
        this.clickTarget = { x: this.mouseX, y: this.mouseY };
      });
      window.addEventListener("mouseup", () => {
        this.mouseDown = false;
      });
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (this.keys.has("a") || this.keys.has("arrowleft")) x -= 1;
      if (this.keys.has("d") || this.keys.has("arrowright")) x += 1;
      if (this.keys.has("w") || this.keys.has("arrowup")) y -= 1;
      if (this.keys.has("s") || this.keys.has("arrowdown")) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return [x, y];
    },
    get sneaking() {
      return this.keys.has("shift");
    },
    consumePressed(k) {
      if (this.pressed.has(k)) {
        this.pressed.delete(k);
        return true;
      }
      return false;
    },
    endFrame() {
      this.pressed.clear();
    },
  };
  return input;
}
