import { useCallback, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CircleDot,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface Question {
  number: number
  text: string
}

interface GameState {
  players: Array<string>
  currentPlayerIndex: number
  shuffledOrder: Array<number>
  roundNumber: number
  drawnQuestions: Array<number>
  currentQuestion: Question | null
  gameOver: boolean
}

const STORAGE_KEY = "real-talk-game"

function shuffleArray<T>(array: Array<T>): Array<T> {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

function hasSavedGame(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw !== null && raw !== ""
  } catch {
    return false
  }
}

function saveGameState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearGameState() {
  localStorage.removeItem(STORAGE_KEY)
}

export const Route = createFileRoute("/real-talk")({
  component: RealTalk,
})

function RealTalk() {
  const [questions, setQuestions] = useState<Array<Question>>([])
  const [gameState, setGameState] = useState<GameState | null>(() => loadGameState())
  const [newPlayerName, setNewPlayerName] = useState("")
  const [tempPlayers, setTempPlayers] = useState<Array<string>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [questionKey, setQuestionKey] = useState(0)
  const [savedGameExists, setSavedGameExists] = useState(() => hasSavedGame())

  // Load questions on mount
  const loadQuestions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/questions.txt")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const text = await response.text()
      const parsed: Array<Question> = []
      text.split("\n").forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed) return
        const match = trimmed.match(/^(\d+)\.\s*(.+)$/)
        if (match) {
          parsed.push({
            number: parseInt(match[1], 10),
            text: match[2].trim(),
          })
        }
      })
      setQuestions(parsed)
      if (parsed.length === 0) {
        setLoadError("No questions found in the file. The file format might be unexpected.")
      }
    } catch (error) {
      console.error("Failed to load questions:", error)
      setLoadError(
        error instanceof Error ? error.message : "Failed to load questions"
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const updateGameState = useCallback(
    (
      updater: GameState | null | ((prev: GameState | null) => GameState | null),
    ) => {
      setGameState((prev) => {
        const next =
          typeof updater === "function"
            ? updater(prev)
            : updater
        if (next) {
          saveGameState(next)
        } else {
          clearGameState()
        }
        return next
      })
    },
    [],
  )

  const drawQuestion = useCallback(
    (state: GameState): Question | null => {
      const available = questions.filter(
        (q) => !state.drawnQuestions.includes(q.number),
      )
      if (available.length === 0) return null
      const randomIndex = Math.floor(Math.random() * available.length)
      return available[randomIndex]
    },
    [questions],
  )

  const startGame = useCallback(() => {
    if (tempPlayers.length === 0 || questions.length === 0) return
    const shuffledOrder = shuffleArray(
      Array.from({ length: tempPlayers.length }, (_, i) => i),
    )
    const initialState: GameState = {
      players: [...tempPlayers],
      currentPlayerIndex: 0,
      shuffledOrder,
      roundNumber: 1,
      drawnQuestions: [],
      currentQuestion: null,
      gameOver: false,
    }
    const firstQuestion = drawQuestion(initialState)
    if (firstQuestion) {
      initialState.currentQuestion = firstQuestion
      initialState.drawnQuestions = [firstQuestion.number]
    }
    updateGameState(initialState)
    setTempPlayers([])
    setQuestionKey((k) => k + 1)
  }, [tempPlayers, questions, drawQuestion])

  const handleDraw = useCallback(() => {
    if (!gameState || gameState.gameOver) return
    const question = drawQuestion(gameState)
    if (!question) {
      updateGameState((prev) => (prev ? { ...prev, gameOver: true } : null))
      return
    }
    updateGameState((prev) =>
      prev
        ? {
            ...prev,
            currentQuestion: question,
            drawnQuestions: [...prev.drawnQuestions, question.number],
          }
        : null,
    )
    setQuestionKey((k) => k + 1)
  }, [gameState, drawQuestion])

  const handleNext = useCallback(() => {
    if (!gameState || gameState.gameOver) return

      updateGameState((prev) => {
        if (!prev) return null
        let nextPlayerIndex = prev.currentPlayerIndex + 1
        let nextRound = prev.roundNumber
        let nextShuffledOrder = prev.shuffledOrder

        if (nextPlayerIndex >= prev.shuffledOrder.length) {
          nextPlayerIndex = 0
          nextRound = prev.roundNumber + 1
          nextShuffledOrder = shuffleArray(
            Array.from({ length: prev.players.length }, (_, i) => i),
          )
        }

        const nextState = {
          ...prev,
          currentPlayerIndex: nextPlayerIndex,
          shuffledOrder: nextShuffledOrder,
          roundNumber: nextRound,
        }

        const question = drawQuestion(nextState)
        if (!question) {
          return { ...nextState, gameOver: true }
        }

        return {
          ...nextState,
          currentQuestion: question,
          drawnQuestions: [...nextState.drawnQuestions, question.number],
        }
      })
    setQuestionKey((k) => k + 1)
  }, [gameState, drawQuestion])

  const handleReset = useCallback(() => {
    clearGameState()
    updateGameState(null)
    setTempPlayers([])
    setNewPlayerName("")
    setSavedGameExists(false)
  }, [updateGameState])

  const handleClearSaved = useCallback(() => {
    updateGameState(null)
    setSavedGameExists(false)
  }, [updateGameState])

  const addPlayer = useCallback(() => {
    const trimmed = newPlayerName.trim()
    if (trimmed && !tempPlayers.includes(trimmed)) {
      setTempPlayers((prev) => [...prev, trimmed])
      setNewPlayerName("")
    }
  }, [newPlayerName, tempPlayers])

  const removeTempPlayer = useCallback((name: string) => {
    setTempPlayers((prev) => prev.filter((p) => p !== name))
  }, [])

  const remainingCount = questions.length - (gameState?.drawnQuestions.length ?? 0)
  const currentPlayer = gameState
    ? gameState.players[gameState.shuffledOrder[gameState.currentPlayerIndex]]
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">
          Loading questions...
        </div>
      </div>
    )
  }

  // Setup screen
  if (!gameState) {
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
                  onClick={() => {
                    const saved = loadGameState()
                    if (saved) {
                      updateGameState(saved)
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="size-4 mr-2" />
                  Resume Game
                </Button>
                <Button
                  onClick={handleClearSaved}
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
              <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="h-11 px-6 w-full sm:w-auto">
                Add
              </Button>
            </div>

            {tempPlayers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Players ({tempPlayers.length})</Label>
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
              onClick={startGame}
              disabled={tempPlayers.length === 0 || questions.length === 0}
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
                {questions.length} questions available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Game over screen
  if (gameState.gameOver) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-2">
            <Sparkles className="size-6 md:size-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Game Over</h1>
          <p className="text-muted-foreground">
            All {questions.length} questions have been drawn!
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <div className="text-7xl font-bold text-primary">
                {gameState.drawnQuestions.length}
              </div>
              <p className="text-muted-foreground">questions drawn</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-center">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Players</Label>
                <div className="flex flex-wrap justify-center gap-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
                    >
                      {player}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-center">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rounds Completed</Label>
                <p className="text-3xl font-bold">{gameState.roundNumber}</p>
              </div>
            </div>

            <Button
              onClick={handleReset}
              variant="destructive"
              className="w-full h-12"
              size="lg"
            >
              <RotateCcw className="size-4 mr-2" />
              Start New Game
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active game screen
  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      {/* Game header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            Real Talk
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <CircleDot className="size-3.5" />
              Round {gameState.roundNumber}
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <BrainCircuit className="size-3.5" />
              {remainingCount} remaining
            </span>
          </div>
        </div>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4 mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Player indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {gameState.players.map((player, index) => {
          const isCurrent =
            gameState.shuffledOrder[gameState.currentPlayerIndex] === index
          return (
            <div
              key={player}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {player}
              {isCurrent && (
                <span className="ml-1.5 inline-block animate-pulse">●</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Current player turn */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-base text-muted-foreground font-normal">
            {currentPlayer ? (
              <span>
                It&apos;s <span className="text-primary font-bold text-base md:text-lg">{currentPlayer}</span>&apos;s turn
              </span>
            ) : (
              "Waiting..."
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Question display */}
      <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5 min-h-[300px] md:min-h-[380px] flex flex-col">
        <CardContent className="py-8 px-4 md:py-14 md:px-8 flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 md:space-y-6 w-full">
            <div key={questionKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-sm text-muted-foreground font-mono mb-2 md:mb-4">
                Question #{gameState.currentQuestion?.number}
              </div>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                {gameState.currentQuestion?.text}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleDraw}
          variant="outline"
          className="flex-1 h-12"
          size="lg"
          disabled={remainingCount === 0}
        >
          <Shuffle className="size-4 mr-2" />
          Draw New
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-12"
          size="lg"
          disabled={!gameState.currentQuestion}
        >
          Next Player
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{gameState.drawnQuestions.length} / {questions.length}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${(gameState.drawnQuestions.length / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Drawn questions history */}
      {gameState.drawnQuestions.length > 1 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Drawn so far ({gameState.drawnQuestions.length})
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {gameState.drawnQuestions.map((num) => (
              <span
                key={num}
                className="px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground font-mono"
              >
                #{num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
