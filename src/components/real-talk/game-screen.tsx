import { GameHeader } from "./game-header"
import { PlayerIndicator } from "./player-indicator"
import { CurrentTurnCard } from "./current-turn-card"
import { QuestionDisplay } from "./question-display"
import { ActionButtons } from "./action-buttons"
import { ProgressBar } from "./progress-bar"
import { DrawnHistory } from "./drawn-history"

export function GameScreen() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <GameHeader />
      <PlayerIndicator />
      <CurrentTurnCard />
      <QuestionDisplay />
      <ActionButtons />
      <ProgressBar />
      <DrawnHistory />
    </div>
  )
}
