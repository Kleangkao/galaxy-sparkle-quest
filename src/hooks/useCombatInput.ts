import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

export type InputSource = "keyboard" | "touch" | "controller";
export type Direction = "up" | "down" | "left" | "right";

export function useCombatInput(onPulse: () => void) {
  const vector = useRef({ x: 0, y: 0 });
  const pressed = useRef(new Set<Direction>());
  const keyboard = useRef(new Set<string>());
  const sourceRef = useRef<InputSource>("keyboard");
  const pulseRef = useRef(onPulse);
  const [source, setSource] = useState<InputSource>("keyboard");
  pulseRef.current = onPulse;

  const syncTouchVector = () => {
    sourceRef.current = "touch";
    vector.current = {
      x: (pressed.current.has("right") ? 1 : 0) - (pressed.current.has("left") ? 1 : 0),
      y: (pressed.current.has("down") ? 1 : 0) - (pressed.current.has("up") ? 1 : 0),
    };
  };

  const directionHandlers = (direction: Direction) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => { event.preventDefault(); pressed.current.add(direction); syncTouchVector(); setSource("touch"); event.currentTarget.setPointerCapture(event.pointerId); },
    onPointerUp: () => { pressed.current.delete(direction); syncTouchVector(); },
    onPointerCancel: () => { pressed.current.delete(direction); syncTouchVector(); },
    onPointerLeave: () => { pressed.current.delete(direction); syncTouchVector(); },
  });

  useEffect(() => {
    const directional = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);
    const updateKeyboard = () => { sourceRef.current = "keyboard"; vector.current = { x: (keyboard.current.has("d") || keyboard.current.has("arrowright") ? 1 : 0) - (keyboard.current.has("a") || keyboard.current.has("arrowleft") ? 1 : 0), y: (keyboard.current.has("s") || keyboard.current.has("arrowdown") ? 1 : 0) - (keyboard.current.has("w") || keyboard.current.has("arrowup") ? 1 : 0) }; };
    const down = (event: KeyboardEvent) => { const key = event.key.toLowerCase(); if (directional.has(key) || key === " ") event.preventDefault(); if (key === " ") pulseRef.current(); else if (directional.has(key)) { keyboard.current.add(key); updateKeyboard(); setSource("keyboard"); } };
    const up = (event: KeyboardEvent) => { const key = event.key.toLowerCase(); if (!directional.has(key)) return; keyboard.current.delete(key); updateKeyboard(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    let frame = 0; let pulseHeld = false;
    const poll = () => {
      const pad = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads()[0] : null;
      if (pad) {
        const deadzone = .18; const x = Math.abs(pad.axes[0] || 0) > deadzone ? pad.axes[0] : 0; const y = Math.abs(pad.axes[1] || 0) > deadzone ? pad.axes[1] : 0;
        if (x || y) {
          vector.current = { x, y };
          sourceRef.current = "controller";
          setSource("controller");
        } else if (sourceRef.current === "controller") {
          vector.current = { x: 0, y: 0 };
        }
        const pulse = Boolean(pad.buttons[0]?.pressed);
        if (pulse && !pulseHeld) { pulseRef.current(); setSource("controller"); }
        pulseHeld = pulse;
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll); return () => cancelAnimationFrame(frame);
  }, []);

  return { vector, source, directionHandlers };
}
