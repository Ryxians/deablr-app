import { describe, expect, it } from "vitest"
import { positionToSpeed, speedToPosition } from "./speed-controls"
import { atempoChain } from "./use-ffmpeg"
import { MAX_SPEED, MIN_SPEED, SPEED_PRESETS } from "./types"

describe("speed slider mapping", () => {
  it("puts 1× in the middle and spans the full range", () => {
    expect(speedToPosition(MIN_SPEED)).toBe(0)
    expect(speedToPosition(1)).toBe(50)
    expect(speedToPosition(MAX_SPEED)).toBe(100)
    expect(positionToSpeed(0)).toBe(MIN_SPEED)
    expect(positionToSpeed(100)).toBe(MAX_SPEED)
  })

  it("snaps near the centre to 1×", () => {
    expect(positionToSpeed(48)).toBe(1)
    expect(positionToSpeed(52)).toBe(1)
  })

  it("round-trips every preset", () => {
    for (const preset of SPEED_PRESETS) {
      expect(positionToSpeed(speedToPosition(preset))).toBe(preset)
    }
  })
})

describe("atempoChain", () => {
  it("uses one filter inside 0.5–2", () => {
    expect(atempoChain(0.5)).toBe("atempo=0.5")
    expect(atempoChain(1.5)).toBe("atempo=1.5")
    expect(atempoChain(2)).toBe("atempo=2")
  })

  it("chains factors above 2× so their product is the speed", () => {
    expect(atempoChain(3)).toBe("atempo=2,atempo=1.5")
    expect(atempoChain(2.6)).toBe("atempo=2,atempo=1.3")
  })
})
