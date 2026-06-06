import { Link, createFileRoute } from "@tanstack/react-router"
import { Dices, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/web-games")({
  component: WebGames,
})

function WebGames() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-2xl border-b border-border mb-2 pb-2">
          Web Games
        </h2>
        <p className="text-muted-foreground mb-6">
          A collection of games and experiments built for this digital abode.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5 text-primary" />
                Real Talk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                A social question game where players take turns drawing random
                questions from a numbered deck and answering them honestly.
              </p>
              <Link to="/real-talk">
                <Button className="w-full">Play Real Talk</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dices className="size-5 text-primary" />
                Wordle Helper
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                A utility to help you solve Wordle puzzles by filtering words
                based on known letters.
              </p>
              <Link to="/wordle">
                <Button variant="outline" className="w-full">
                  Open Wordle Helper
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
