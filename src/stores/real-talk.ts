import { Store } from "@tanstack/react-store"

export interface Question {
  number: number
  text: string
}

export interface GameState {
  players: string[]
  currentPlayerIndex: number
  shuffledOrder: number[]
  roundNumber: number
  drawnQuestions: number[]
  currentQuestion: Question | null
  gameOver: boolean
}

interface RealTalkStore {
  questions: Question[]
  gameState: GameState | null
  isLoading: boolean
  loadError: string | null
  savedGameExists: boolean
  animationsEnabled: boolean
}

const STORAGE_KEY = "real-talk-game"
const ANIMATIONS_KEY = "real-talk-animations"

function loadAnimationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(ANIMATIONS_KEY)
    return raw !== "false"
  } catch {
    return true
  }
}

function saveAnimationsEnabled(value: boolean) {
  localStorage.setItem(ANIMATIONS_KEY, value ? "true" : "false")
}

function shuffleArray<T>(array: T[]): T[] {
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

function drawQuestionInternal(
  state: GameState,
  questions: Question[],
): Question | null {
  const available = questions.filter(
    (q) => !state.drawnQuestions.includes(q.number),
  )
  if (available.length === 0) return null
  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

const initialState: RealTalkStore = {
  questions: [],
  gameState: loadGameState(),
  isLoading: true,
  loadError: null,
  savedGameExists: hasSavedGame(),
  animationsEnabled: loadAnimationsEnabled(),
}

export const store = new Store<RealTalkStore>(initialState)

export async function loadQuestions() {
  store.setState((prev) => ({ ...prev, isLoading: true, loadError: null }))
  try {
    const response = await fetch("/questions.txt")
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const text = await response.text()
    const parsed: Question[] = []
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
    store.setState((prev) => ({
      ...prev,
      questions: parsed,
      isLoading: false,
      loadError:
        parsed.length === 0
          ? "No questions found in the file. The file format might be unexpected."
          : null,
    }))
  } catch (error) {
    console.error("Failed to load questions:", error)
    store.setState((prev) => ({
      ...prev,
      isLoading: false,
      loadError:
        error instanceof Error ? error.message : "Failed to load questions",
    }))
  }
}

export function startGame(playerNames: string[]) {
  const { questions } = store.state
  if (playerNames.length === 0 || questions.length === 0) return

  const shuffledOrder = shuffleArray(
    Array.from({ length: playerNames.length }, (_, i) => i),
  )
  const initialState: GameState = {
    players: [...playerNames],
    currentPlayerIndex: 0,
    shuffledOrder,
    roundNumber: 1,
    drawnQuestions: [],
    currentQuestion: null,
    gameOver: false,
  }
  const firstQuestion = drawQuestionInternal(initialState, questions)
  if (firstQuestion) {
    initialState.currentQuestion = firstQuestion
    initialState.drawnQuestions = [firstQuestion.number]
  }
  saveGameState(initialState)
  store.setState((prev) => ({
    ...prev,
    gameState: initialState,
    savedGameExists: true,
  }))
}

export function drawQuestion() {
  store.setState((prev) => {
    if (!prev.gameState || prev.gameState.gameOver) return prev
    const question = drawQuestionInternal(prev.gameState, prev.questions)
    if (!question) {
      const nextState = { ...prev.gameState, gameOver: true }
      saveGameState(nextState)
      return { ...prev, gameState: nextState }
    }
    const nextState = {
      ...prev.gameState,
      currentQuestion: question,
      drawnQuestions: [...prev.gameState.drawnQuestions, question.number],
    }
    saveGameState(nextState)
    return { ...prev, gameState: nextState }
  })
}

export function nextPlayer() {
  store.setState((prev) => {
    if (!prev.gameState || prev.gameState.gameOver) return prev

    let nextPlayerIndex = prev.gameState.currentPlayerIndex + 1
    let nextRound = prev.gameState.roundNumber
    let nextShuffledOrder = prev.gameState.shuffledOrder

    if (nextPlayerIndex >= prev.gameState.shuffledOrder.length) {
      nextPlayerIndex = 0
      nextRound = prev.gameState.roundNumber + 1
      nextShuffledOrder = shuffleArray(
        Array.from({ length: prev.gameState.players.length }, (_, i) => i),
      )
    }

    const nextStateBase = {
      ...prev.gameState,
      currentPlayerIndex: nextPlayerIndex,
      shuffledOrder: nextShuffledOrder,
      roundNumber: nextRound,
    }

    const question = drawQuestionInternal(nextStateBase, prev.questions)
    if (!question) {
      const nextState = { ...nextStateBase, gameOver: true }
      saveGameState(nextState)
      return { ...prev, gameState: nextState }
    }

    const nextState = {
      ...nextStateBase,
      currentQuestion: question,
      drawnQuestions: [...nextStateBase.drawnQuestions, question.number],
    }
    saveGameState(nextState)
    return { ...prev, gameState: nextState }
  })
}

export function resetGame() {
  clearGameState()
  store.setState((prev) => ({
    ...prev,
    gameState: null,
    savedGameExists: false,
  }))
}

export function resumeSavedGame() {
  const saved = loadGameState()
  if (saved) {
    saveGameState(saved)
    store.setState((prev) => ({
      ...prev,
      gameState: saved,
      savedGameExists: true,
    }))
  }
}

export function clearSavedGame() {
  clearGameState()
  store.setState((prev) => ({ ...prev, savedGameExists: false }))
}

export function toggleAnimations() {
  store.setState((prev) => {
    const next = !prev.animationsEnabled
    saveAnimationsEnabled(next)
    return { ...prev, animationsEnabled: next }
  })
}
