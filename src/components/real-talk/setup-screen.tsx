import { useState } from "react"
import { useSelector } from "@tanstack/react-store"
import {
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
  ZapOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  store,
  startGame,
  loadQuestions,
  toggleAnimations,
  resumeSavedGame,
  clearSavedGame,
} from "@/stores/real-talk"

export function SetupScreen() {
  const savedGameExists = useSelector(store, (s) => s.savedGameExists)
  const questionsCount = useSelector(store, (s) => s.questions.length)
  const loadError = useSelector(store, (s) => s.loadError)
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  const [newPlayerName, setNewPlayerName] = useState("")
  const [tempPlayers, setTempPlayers] = useState<string[]>([])

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
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-2">
          <Sparkles className="size-6 md:size-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">Real Talk</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          A social question game where players take turns drawing random
          questions from a deck and answering them honestly.
        </p>
        <Button
          onClick={toggleAnimations}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          title={
            animationsEnabled ? "Disable animations" : "Enable animations"
          }
        >
          {animationsEnabled ? (
            <ZapOff className="size-4 mr-1.5" />
          ) : (
            <Zap className="size-4 mr-1.5" />
          )}
          {animationsEnabled ? "Animations on" : "Animations off"}
        </Button>
      </div>

      {savedGameExists && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <AlertTriangle className="size-5" />
              <p className="text-sm font-medium">
                A saved game was found in your browser.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={resumeSavedGame}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="size-4 mr-2" />
                Resume Game
              </Button>
              <Button
                onClick={clearSavedGame}
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4 mr-1.5" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-primary" />
            Enter Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Player name..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addPlayer()
              }}
              className="h-11"
            />
            <Button
              onClick={addPlayer}
              disabled={!newPlayerName.trim()}
              className="h-11 px-6 w-full sm:w-auto"
            >
              Add
            </Button>
          </div>

          {tempPlayers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Players ({tempPlayers.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {tempPlayers.map((player) => (
                  <div
                    key={player}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-sm font-medium border border-primary/20"
                  >
                    <span>{player}</span>
                    <button
                      onClick={() => removeTempPlayer(player)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => startGame(tempPlayers)}
            disabled={tempPlayers.length === 0 || questionsCount === 0}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Play className="size-5 mr-2" />
            Start Game
          </Button>

          {loadError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="size-4" />
                <span>{loadError}</span>
              </div>
              <Button
                onClick={loadQuestions}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="size-4 mr-2" />
                Retry Loading Questions
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {questionsCount} questions available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
