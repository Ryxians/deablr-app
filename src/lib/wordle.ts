export type WordleColor = "gray" | "yellow" | "green"

export type WordleTile = {
  letter: string
  color: WordleColor
}

export function matchesWordleGuess(word: string, guess: Array<WordleTile>) {
  const remaining = word.toLowerCase().split("")
  const colors: Array<WordleColor> = guess.map(() => "gray")

  // Wordle assigns exact matches before allocating the remaining letters.
  guess.forEach(({ letter }, index) => {
    if (letter && remaining[index] === letter) {
      colors[index] = "green"
      remaining[index] = ""
    }
  })

  guess.forEach(({ letter }, index) => {
    if (!letter || colors[index] === "green") return
    const match = remaining.indexOf(letter)
    if (match !== -1) {
      colors[index] = "yellow"
      remaining[match] = ""
    }
  })

  return guess.every(
    ({ letter, color }, index) => !letter || colors[index] === color
  )
}
