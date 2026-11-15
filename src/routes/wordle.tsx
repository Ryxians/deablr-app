import { useMemo, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import type { WordleColor, WordleTile } from "@/lib/wordle"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { matchesWordleGuess } from "@/lib/wordle"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/wordle")({
  component: Wordle,
})

const colors: Record<WordleColor, string> = {
  gray: "border-zinc-600 bg-zinc-600 text-white",
  yellow: "border-yellow-500 bg-yellow-500 text-zinc-950",
  green: "border-green-600 bg-green-600 text-white",
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
    <div>
      <PageHeader
        path="projects/wordle"
        title="Wordle Helper"
        description="Enter each guess, mark its tiles the way Wordle colored them, and it narrows the word list."
      />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section
          aria-labelledby="wordle-guesses"
          className="space-y-4 rounded-xl border border-border/50 bg-card p-4 sm:p-6"
        >
          <div className="space-y-1">
            <h2
              id="wordle-guesses"
              className="flex items-center gap-2 font-mono text-[13px] font-semibold"
            >
              <span aria-hidden className="size-2.5 rounded-full bg-accent" />
              Guesses
            </h2>
            <p className="text-sm text-muted-foreground">
              Type a guess, then set each tile's color.
            </p>
          </div>

          <div className="space-y-3">
            {guesses.map((guess, row) => (
              <div key={row} className="grid grid-cols-5 gap-2">
                {guess.map((tile, column) => (
                  <div key={column} className="min-w-0 space-y-1.5">
                    <Input
                      ref={(element) => {
                        inputs.current[row] ??= []
                        inputs.current[row][column] = element
                      }}
                      aria-label={`Guess ${row + 1}, letter ${column + 1}`}
                      className={`aspect-square h-auto w-full rounded-lg p-0 text-center font-mono text-xl font-bold uppercase sm:text-2xl ${colors[tile.color]}`}
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
                      className="w-full min-w-0 rounded-md border border-border bg-background px-1 py-1 font-sans text-[11px] text-foreground"
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGuesses(emptyGuesses())}
          >
            Clear all guesses
          </Button>
        </section>

        <section
          aria-labelledby="wordle-suggestions"
          className="space-y-3 rounded-xl border border-border/50 bg-card p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="wordle-suggestions"
              className="font-mono text-[13px] font-semibold"
            >
              Suggestions{" "}
              <span className="text-muted-foreground">
                ({wordsToRecommend.length})
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="wordle-limit"
                className="text-xs font-normal text-muted-foreground"
              >
                Show
              </Label>
              <Input
                id="wordle-limit"
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(+e.target.value)}
                className="h-8 w-16 font-mono text-xs"
              />
            </div>
          </div>

          {wordsToRecommend.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-10 text-center font-mono text-sm text-muted-foreground">
              No words match.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-x-4 gap-y-1 sm:grid-cols-5">
              {wordsToRecommend.map((word, i) => (
                <li
                  key={word + i}
                  className="py-1 font-mono text-sm tracking-[0.2em] uppercase"
                >
                  {word}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
