import { describe, expect, it } from "vitest"
import { matchesWordleGuess } from "./wordle"
import type { WordleColor, WordleTile } from "./wordle"

function guess(word: string, colors: Array<WordleColor>): Array<WordleTile> {
  return word
    .split("")
    .map((letter, index) => ({ letter, color: colors[index] }))
}

describe("matchesWordleGuess", () => {
  it("matches greens and excludes yellows from their guessed positions", () => {
    const row = guess("slate", ["gray", "yellow", "green", "gray", "green"])
    expect(matchesWordleGuess("whale", row)).toBe(true)
    expect(matchesWordleGuess("clame", row)).toBe(false)
  })

  it("uses a gray duplicate to limit the number of that letter", () => {
    const row = guess("allee", ["green", "yellow", "gray", "gray", "green"])
    expect(matchesWordleGuess("apple", row)).toBe(true)
    expect(matchesWordleGuess("ample", row)).toBe(true)
    expect(matchesWordleGuess("alley", row)).toBe(false)
    expect(matchesWordleGuess("angle", row)).toBe(true)
  })

  it("allocates greens before yellow duplicates", () => {
    const row = guess("eerie", ["gray", "green", "green", "gray", "green"])
    expect(matchesWordleGuess("serve", row)).toBe(true)
    expect(matchesWordleGuess("eveme", row)).toBe(false)
  })

  it("rejects extra copies when a duplicate is gray", () => {
    const row = guess("aabbb", ["yellow", "gray", "gray", "gray", "gray"])
    expect(matchesWordleGuess("crass", row)).toBe(true)
    expect(matchesWordleGuess("craaa", row)).toBe(false)
  })

  it("ignores empty tiles", () => {
    const row = guess("a    ", ["green", "gray", "gray", "gray", "gray"]).map(
      (tile) => ({ ...tile, letter: tile.letter.trim() })
    )
    expect(matchesWordleGuess("apple", row)).toBe(true)
    expect(matchesWordleGuess("crane", row)).toBe(false)
  })
})
