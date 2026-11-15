import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/wordle")({
  component: Wordle,
})

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
  const [first, setFirst] = useState("")
  const [second, setSecond] = useState("")
  const [third, setThird] = useState("")
  const [fourth, setFourth] = useState("")
  const [fifth, setFifth] = useState("")
  const [wrongLetters, setWrongLetters] = useState(new Set<string>())
  const [hasLetters, setHasLetters] = useState(new Set<string>())

  const wordsToRecommend = useMemo(() => {
    const filtered =
      data?.filter((word) => {
        const f = [first, second, third, fourth, fifth]
        const matches =
          f.every((ch, i) => !ch || ch === word[i]) &&
          Array.from(wrongLetters).every((l) => !word.includes(l)) &&
          Array.from(hasLetters).every((l) => word.includes(l))
        return matches
      }) ?? []

    return filtered.sort(() => Math.random() - 0.5).slice(0, limit)
  }, [
    data,
    first,
    second,
    third,
    fourth,
    fifth,
    wrongLetters,
    hasLetters,
    limit,
  ])

  const setFns: Array<(value: string) => void> = [
    setFirst,
    setSecond,
    setThird,
    setFourth,
    setFifth,
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        path="projects/wordle"
        title="Wordle Helper"
        description="Tell it what you know; it narrows the word list."
      />

      <div className="space-y-6 rounded-xl border border-border/80 bg-card p-5 md:p-6">
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5 font-mono text-[13px] font-semibold">
            Green letters
          </legend>
          <div className="flex gap-2">
            {[first, second, third, fourth, fifth].map((value, i) => (
              <Input
                key={i}
                aria-label={`Letter ${i + 1}`}
                className="size-14 rounded-lg p-0 text-center font-mono text-2xl font-bold uppercase data-[filled=true]:border-accent data-[filled=true]:bg-accent data-[filled=true]:text-accent-foreground md:size-16 md:text-3xl"
                data-filled={value !== ""}
                maxLength={1}
                value={value}
                onChange={(e) => setFns[i](e.target.value.toLowerCase())}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wordle-has">Yellow letters</Label>
            <Input
              id="wordle-has"
              placeholder="e.g. oa"
              className="font-mono"
              value={Array.from(hasLetters).join("")}
              onChange={(e) =>
                setHasLetters(new Set(Array.from(e.target.value.toLowerCase())))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wordle-wrong">Gray letters</Label>
            <Input
              id="wordle-wrong"
              placeholder="e.g. rstlne"
              className="font-mono"
              value={Array.from(wrongLetters).join("")}
              onChange={(e) =>
                setWrongLetters(
                  new Set(Array.from(e.target.value.toLowerCase()))
                )
              }
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border/60 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[13px] font-semibold">
              Suggestions{" "}
              <span className="text-muted-foreground">
                ({wordsToRecommend.length})
              </span>
            </p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFns.forEach((fn) => fn(""))}
              >
                Clear greens
              </Button>
            </div>
          </div>

          {wordsToRecommend.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-10 text-center font-mono text-sm text-muted-foreground">
              No words match.
            </p>
          ) : (
            <ul className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-5">
              {wordsToRecommend.map((word, i) => (
                <li
                  key={word + i}
                  className="rounded-md bg-well px-2 py-1.5 text-center font-mono text-sm tracking-widest uppercase"
                >
                  {word}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
