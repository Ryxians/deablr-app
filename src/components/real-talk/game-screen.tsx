import { GameHeader } from "./game-header"
import { PlayerIndicator } from "./player-indicator"
import { QuestionDisplay } from "./question-display"
import { ActionButtons } from "./action-buttons"
import { ProgressBar } from "./progress-bar"
import { DrawnHistory } from "./drawn-history"

export function GameScreen() {
  return (
    <div>
      <GameHeader />
      <div className="max-w-2xl space-y-5">
        <PlayerIndicator />
        <QuestionDisplay />
        <ActionButtons />
        <div className="space-y-5 pt-2">
          <ProgressBar />
          <DrawnHistory />
        </div>
      </div>
    </div>
  )
}
