import { useMemo, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import type { WordleColor, WordleTile } from "@/lib/wordle"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { matchesWordleGuess } from "@/lib/wordle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/wordle")({
  component: Wordle,
})

const colors: Record<WordleColor, string> = {
  gray: "bg-gray-600 text-white dark:bg-gray-600",
  yellow: "bg-yellow-700 text-white dark:bg-yellow-700",
  green: "bg-green-700 text-white dark:bg-green-700",
}

function emptyGuesses(): Array<Array<WordleTile>> {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: 5 }, () => ({ letter: "", color: "gray" as const }))
  )
}

function Wordle() {
  const { data } = useQuery({
    queryKey: ["wordle"],
    queryFn: async (): Promise<Array<string>> => {
      const response = await fetch("/words.txt")
      const text = await response.text()
      return text
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    },
    staleTime: Infinity,
  })

  const [limit, setLimit] = useState(50)
  const [guesses, setGuesses] = useState(emptyGuesses)
  const inputs = useRef<Array<Array<HTMLInputElement | null>>>([])

  function updateTile(
    row: number,
    column: number,
    update: Partial<WordleTile>
  ) {
    setGuesses((previous) =>
      previous.map((tiles, rowIndex) =>
        rowIndex === row
          ? tiles.map((tile, index) =>
              index === column ? { ...tile, ...update } : tile
            )
          : tiles
      )
    )
  }

  const wordsToRecommend = useMemo(() => {
    const filtered =
      data?.filter((word) =>
        guesses.every((guess) => matchesWordleGuess(word, guess))
      ) ?? []

    return filtered.sort(() => Math.random() - 0.5).slice(0, limit)
  }, [data, guesses, limit])

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Wordle Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guesses */}
          <div className="space-y-2">
            <Label>Guesses</Label>
            <p className="text-sm text-muted-foreground">
              Enter your guesses and select the color of each tile from Wordle.
            </p>
            <div className="space-y-3">
              {guesses.map((guess, row) => (
                <div key={row} className="grid grid-cols-5 gap-2">
                  {guess.map((tile, column) => (
                    <div key={column} className="min-w-0 space-y-1">
                      <Input
                        ref={(element) => {
                          inputs.current[row] ??= []
                          inputs.current[row][column] = element
                        }}
                        aria-label={`Guess ${row + 1}, letter ${column + 1}`}
                        className={`h-10 text-center font-mono text-lg font-bold uppercase ${colors[tile.color]}`}
                        maxLength={1}
                        value={tile.letter}
                        onChange={(e) => {
                          const letter = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z]/g, "")
                          updateTile(row, column, { letter })
                          if (letter && column < 4)
                            inputs.current[row]?.[column + 1]?.focus()
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !tile.letter &&
                            column > 0
                          ) {
                            inputs.current[row]?.[column - 1]?.focus()
                          }
                        }}
                        onPaste={(e) => {
                          const letters = e.clipboardData
                            .getData("text")
                            .toLowerCase()
                            .replace(/[^a-z]/g, "")
                            .slice(0, 5 - column)
                          if (!letters) return
                          e.preventDefault()
                          setGuesses((previous) =>
                            previous.map((tiles, rowIndex) =>
                              rowIndex === row
                                ? tiles.map((item, index) =>
                                    index >= column &&
                                    index < column + letters.length
                                      ? {
                                          ...item,
                                          letter: letters[index - column],
                                        }
                                      : item
                                  )
                                : tiles
                            )
                          )
                          inputs.current[row]?.[
                            Math.min(column + letters.length, 4)
                          ]?.focus()
                        }}
                      />
                      <select
                        aria-label={`Guess ${row + 1}, letter ${column + 1} color`}
                        className={`w-full min-w-0 rounded border px-1 py-1 text-xs ${colors[tile.color]}`}
                        value={tile.color}
                        onChange={(e) =>
                          updateTile(row, column, {
                            color: e.target.value as WordleColor,
                          })
                        }
                      >
                        <option value="gray">Gray</option>
                        <option value="yellow">Yellow</option>
                        <option value="green">Green</option>
                      </select>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Word Limit */}
          <div className="space-y-2">
            <Label>Word Limit</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(+e.target.value)}
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Suggestions{" "}
                <span className="font-mono">({wordsToRecommend.length})</span>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuesses(emptyGuesses())}
              >
                Clear
              </Button>
            </div>

            <div className="max-h-60 divide-y overflow-y-auto rounded-md border p-2">
              {wordsToRecommend.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No words match your criteria.
                </p>
              ) : (
                wordsToRecommend.map((word, i) => (
                  <div
                    key={word + i}
                    className={`px-2 py-1 font-mono text-sm ${
                      i % 2 === 0 ? "bg-muted/40" : ""
                    }`}
                  >
                    {word}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
