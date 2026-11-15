import { GameHeader } from "./game-header"
import { PlayerIndicator } from "./player-indicator"
import { QuestionDisplay } from "./question-display"
import { ActionButtons } from "./action-buttons"
import { ProgressBar } from "./progress-bar"
import { DrawnHistory } from "./drawn-history"
import { MotionToggle } from "./motion-toggle"

export function GameScreen() {
  return (
    <div>
      <GameHeader />
      <div className="grid gap-x-10 gap-y-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div className="lg:hidden">
            <PlayerIndicator />
          </div>
          <QuestionDisplay />
          {/* On phones the actions stick to the bottom edge so they're always
              under a thumb, however long the question is. */}
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/70 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <ActionButtons />
          </div>
        </div>

        <aside className="space-y-7 pt-4 lg:pt-0">
          <div className="hidden lg:block">
            <h2 className="mb-3 font-mono text-sm font-bold">Turn order</h2>
            <PlayerIndicator vertical />
          </div>
          <ProgressBar />
          <DrawnHistory />
          <MotionToggle />
        </aside>
      </div>
    </div>
  )
}
