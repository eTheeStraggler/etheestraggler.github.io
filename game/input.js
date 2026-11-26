/* FRAGILE: The Great Server Rescue — keyboard + touch input (no dependencies) */

export function createInput(rootEl) {
  const state = {
    left: false,
    right: false,
    jumpHeld: false,
    isTouch: false,
    _jump: false,
    _confirm: false,
    _pause: false,
    _mute: false,
    _restart: false,
  };

  const doc = rootEl ? rootEl.ownerDocument : document;
  const win = doc.defaultView || window;

  try {
    state.isTouch =
      (typeof win.matchMedia === "function" &&
        win.matchMedia("(pointer: coarse)").matches) ||
      "ontouchstart" in win ||
      (typeof win.navigator !== "undefined" &&
        win.navigator.maxTouchPoints > 0);
  } catch (e) {
    state.isTouch = false;
  }

  // ---- Keyboard ----------------------------------------------------------
  function isFormTarget(t) {
    if (!t || !t.tagName) return false;
    const tag = t.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function onKeyDown(e) {
    if (isFormTarget(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return; // leave browser shortcuts alone
    // Let a focused button handle its own Enter/Space activation natively.
    if ((e.code === "Enter" || e.code === "Space") && e.target && e.target.tagName === "BUTTON") return;
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        state.left = true;
        e.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        state.right = true;
        e.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        if (!state.jumpHeld) {
          state._jump = true;
          if (e.code === "Space") state._confirm = true; // Space also confirms (overlays)
        }
        state.jumpHeld = true;
        e.preventDefault();
        break;
      case "Enter":
        state._confirm = true;
        e.preventDefault();
        break;
      case "KeyP":
      case "Escape":
        state._pause = true;
        e.preventDefault();
        break;
      case "KeyM":
        state._mute = true;
        e.preventDefault();
        break;
      case "KeyR":
        state._restart = true;
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        state.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        state.right = false;
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        state.jumpHeld = false;
        break;
      default:
        break;
    }
  }

  // ---- Touch buttons (data-touch="left" | "right" | "jump") --------------
  const touchButtons = rootEl
    ? Array.from(rootEl.querySelectorAll("[data-touch]"))
    : [];

  function setPressed(btn, pressed) {
    try {
      btn.classList.toggle("pressed", pressed);
    } catch (e) {
      /* no-op */
    }
  }

  function onTouchDown(e) {
    const btn = e.currentTarget;
    const kind = btn.getAttribute("data-touch");
    if (e.cancelable) e.preventDefault();
    if (kind === "jump") {
      if (!state.jumpHeld) {
        state._jump = true;
      }
      state.jumpHeld = true;
    } else if (kind === "left") {
      state.left = true;
    } else if (kind === "right") {
      state.right = true;
    }
    setPressed(btn, true);
  }

  function onTouchUp(e) {
    const btn = e.currentTarget;
    const kind = btn.getAttribute("data-touch");
    if (kind === "jump") {
      state.jumpHeld = false;
    } else if (kind === "left") {
      state.left = false;
    } else if (kind === "right") {
      state.right = false;
    }
    setPressed(btn, false);
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  for (const btn of touchButtons) {
    btn.addEventListener("pointerdown", onTouchDown);
    btn.addEventListener("pointerup", onTouchUp);
    btn.addEventListener("pointercancel", onTouchUp);
    btn.addEventListener("pointerleave", onTouchUp);
    btn.addEventListener("contextmenu", onContextMenu);
  }

  // Drop every held control (e.g. window lost focus mid-keypress → no stuck keys).
  function reset() {
    state.left = false;
    state.right = false;
    state.jumpHeld = false;
    state._jump = false;
    for (const btn of touchButtons) setPressed(btn, false);
  }

  // ---- Wire up -----------------------------------------------------------
  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("keyup", onKeyUp);
  win.addEventListener("blur", reset);

  function consume(flag) {
    if (!state[flag]) return false;
    state[flag] = false;
    return true;
  }

  return {
    get left() { return state.left; },
    get right() { return state.right; },
    get jumpHeld() { return state.jumpHeld; },
    get isTouch() { return state.isTouch; },
    consumeJump() { return consume("_jump"); },
    consumeConfirm() { return consume("_confirm"); },
    consumePause() { return consume("_pause"); },
    consumeMute() { return consume("_mute"); },
    consumeRestart() { return consume("_restart"); },
    reset,
    destroy() {
      win.removeEventListener("blur", reset);
      doc.removeEventListener("keydown", onKeyDown);
      doc.removeEventListener("keyup", onKeyUp);
      for (const btn of touchButtons) {
        btn.removeEventListener("pointerdown", onTouchDown);
        btn.removeEventListener("pointerup", onTouchUp);
        btn.removeEventListener("pointercancel", onTouchUp);
        btn.removeEventListener("pointerleave", onTouchUp);
        btn.removeEventListener("contextmenu", onContextMenu);
        setPressed(btn, false);
      }
    },
  };
}
