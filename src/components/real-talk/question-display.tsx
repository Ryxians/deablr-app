import { Card, CardContent } from "@/components/ui/card"
import { useSelector } from "@tanstack/react-store"
import { store } from "@/stores/real-talk"

export function QuestionDisplay() {
  const currentQuestion = useSelector(
    store,
    (s) => s.gameState?.currentQuestion,
  )
  const animationsEnabled = useSelector(store, (s) => s.animationsEnabled)

  return (
    <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5 min-h-[300px] md:min-h-[380px] flex flex-col">
      <CardContent className="py-8 px-4 md:py-14 md:px-8 flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 md:space-y-6 w-full">
          <div
            key={currentQuestion?.number ?? 0}
            className={
              animationsEnabled
                ? "animate-in fade-in slide-in-from-bottom-4 duration-500"
                : ""
            }
          >
            <div className="text-sm text-muted-foreground font-mono mb-2 md:mb-4">
              Question #{currentQuestion?.number}
            </div>
            <p className="text-2xl md:text-3xl font-medium leading-relaxed">
              {currentQuestion?.text}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
