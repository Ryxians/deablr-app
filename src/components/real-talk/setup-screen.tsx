import { useState } from "react"
import { useSelector } from "@tanstack/react-store"
import { AlertTriangle, Play, Plus, RotateCcw, X } from "lucide-react"
import { MotionToggle } from "./motion-toggle"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearSavedGame,
  loadQuestions,
  resumeSavedGame,
  startGame,
  store,
} from "@/stores/real-talk"

export function SetupScreen() {
  const savedGameExists = useSelector(store, (s) => s.savedGameExists)
  const questionsCount = useSelector(store, (s) => s.questions.length)
  const loadError = useSelector(store, (s) => s.loadError)

  const [newPlayerName, setNewPlayerName] = useState("")
  const [tempPlayers, setTempPlayers] = useState<Array<string>>([])

  const addPlayer = () => {
    const trimmed = newPlayerName.trim()
    if (trimmed && !tempPlayers.includes(trimmed)) {
      setTempPlayers((prev) => [...prev, trimmed])
      setNewPlayerName("")
    }
  }

  const removeTempPlayer = (name: string) => {
    setTempPlayers((prev) => prev.filter((p) => p !== name))
  }

  return (
    <div>
      <PageHeader
        path="projects/real-talk"
        title="Real Talk"
        description="Take turns drawing questions from the deck and answer them honestly. No skipping."
        actions={<MotionToggle showLabel className="-ml-3 sm:ml-0" />}
      />
      <div className="max-w-2xl">
        {savedGameExists && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-secondary/50 bg-secondary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]">
              You have a game in progress on this device.
            </p>
            <div className="flex gap-2">
              <Button onClick={resumeSavedGame} variant="secondary" size="sm">
                <RotateCcw />
                Resume
              </Button>
              <Button
                onClick={clearSavedGame}
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border/80 bg-card p-5 md:p-6">
          <Label htmlFor="real-talk-player">Who&apos;s playing?</Label>
          <form
            className="mt-2.5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addPlayer()
            }}
          >
            <Input
              id="real-talk-player"
              placeholder="Player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!newPlayerName.trim()}
            >
              <Plus />
              Add
            </Button>
          </form>

          <ul
            className="mt-4 flex min-h-9 flex-wrap gap-2"
            aria-label="Players"
          >
            {tempPlayers.length === 0 ? (
              <li className="self-center text-sm text-muted-foreground">
                Add at least one player to start.
              </li>
            ) : (
              tempPlayers.map((player, i) => (
                <li
                  key={player}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-well/60 py-1 pr-1 pl-3 text-sm font-semibold"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  {player}
                  <button
                    type="button"
                    onClick={() => removeTempPlayer(player)}
                    aria-label={`Remove ${player}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>

          <Button
            onClick={() => startGame(tempPlayers)}
            disabled={tempPlayers.length === 0 || questionsCount === 0}
            className="mt-6 w-full"
            size="lg"
          >
            <Play className="fill-current" />
            Start game
          </Button>

          {loadError ? (
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                {loadError}
              </p>
              <Button
                onClick={loadQuestions}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw />
                Retry loading questions
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-center font-mono text-xs text-muted-foreground">
              {questionsCount} questions in the deck
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
