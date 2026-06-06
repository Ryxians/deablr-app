import { useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useSelector } from "@tanstack/react-store"
import { store, loadQuestions } from "@/stores/real-talk"
import { LoadingScreen } from "@/components/real-talk/loading-screen"
import { SetupScreen } from "@/components/real-talk/setup-screen"
import { GameOverScreen } from "@/components/real-talk/game-over-screen"
import { GameScreen } from "@/components/real-talk/game-screen"

export const Route = createFileRoute("/real-talk")({
  component: RealTalk,
})

function RealTalk() {
  const isLoading = useSelector(store, (s) => s.isLoading)
  const gameExists = useSelector(store, (s) => s.gameState !== null)
  const gameOver = useSelector(store, (s) => s.gameState?.gameOver ?? false)

  useEffect(() => {
    loadQuestions()
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!gameExists) {
    return <SetupScreen />
  }

  if (gameOver) {
    return <GameOverScreen />
  }

  return <GameScreen />
}
