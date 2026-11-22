import type * as React from "react"

/**
 * Pointer-drag helper: captures the pointer on the pressed element and
 * reports movement relative to where the drag began. Movement under 3px is
 * treated as a click so taps still select things.
 */
export function startDrag(
  event: React.PointerEvent<HTMLElement>,
  onMove: (dx: number, dy: number) => void,
  onEnd?: (moved: boolean) => void
) {
  if (event.button !== 0) return
  const el = event.currentTarget
  el.setPointerCapture(event.pointerId)
  const startX = event.clientX
  const startY = event.clientY
  let moved = false

  const move = (e: PointerEvent) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!moved && Math.hypot(dx, dy) < 3) return
    moved = true
    onMove(dx, dy)
  }
  const end = () => {
    el.removeEventListener("pointermove", move)
    el.removeEventListener("pointerup", end)
    el.removeEventListener("pointercancel", end)
    onEnd?.(moved)
  }
  el.addEventListener("pointermove", move)
  el.addEventListener("pointerup", end)
  el.addEventListener("pointercancel", end)
}
