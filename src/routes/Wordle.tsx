import React, { useMemo, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/components/Layout.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/server.ts";
import { Label } from "@/components/ui/label.tsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card.tsx";

export const Wordle: React.FC = () => {
  const { data } = useQuery({
    queryKey: ["wordle"],
    queryFn: async (): Promise<string[]> => {
      const words = await client.wordle.words.$get();
      return words.status === 200 ? await words.json() : [];
    },
    staleTime: Infinity,
  });

  const [limit, setLimit] = useState(50);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [third, setThird] = useState("");
  const [fourth, setFourth] = useState("");
  const [fifth, setFifth] = useState("");
  const [wrongLetters, setWrongLetters] = useState(new Set<string>());
  const [hasLetters, setHasLetters] = useState(new Set<string>());

  const wordsToRecommend = useMemo(() => {
    const filtered =
      data?.filter((word) => {
        const f = [first, second, third, fourth, fifth];
        const matches =
          f.every((ch, i) => !ch || ch === word[i]) &&
          Array.from(wrongLetters).every((l) => !word.includes(l)) &&
          Array.from(hasLetters).every((l) => word.includes(l));
        return matches;
      }) ?? [];

    return filtered.sort(() => Math.random() - 0.5).slice(0, limit);
  }, [
    data,
    first,
    second,
    third,
    fourth,
    fifth,
    wrongLetters,
    hasLetters,
    limit,
  ]);

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Wordle Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Correct Letters */}
          <div className="space-y-2">
            <Label>Correct Letters</Label>
            <div className="flex gap-2">
              {[first, second, third, fourth, fifth].map((value, i) => {
                const setFns = [
                  setFirst,
                  setSecond,
                  setThird,
                  setFourth,
                  setFifth,
                ];
                return (
                  <Input
                    key={i}
                    className="text-center text-lg font-mono"
                    maxLength={1}
                    value={value}
                    onChange={(e) => setFns[i]!(e.target.value.toLowerCase())}
                  />
                );
              })}
            </div>
          </div>

          {/* Wrong Letters */}
          <div className="space-y-2">
            <Label>Wrong Letters</Label>
            <Input
              placeholder="e.g. rstlne"
              value={Array.from(wrongLetters).join("")}
              onChange={(e) =>
                setWrongLetters(
                  new Set(Array.from(e.target.value.toLowerCase())),
                )
              }
            />
          </div>

          {/* Has Letters */}
          <div className="space-y-2">
            <Label>Has Letters</Label>
            <Input
              placeholder="e.g. oa"
              value={Array.from(hasLetters).join("")}
              onChange={(e) =>
                setHasLetters(new Set(Array.from(e.target.value.toLowerCase())))
              }
            />
          </div>

          {/* Word Limit */}
          <div className="space-y-2">
            <Label>Word Limit</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(+e.target.value)}
            />
          </div>

          {/* Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Suggestions{" "}
                <span className="font-mono">({wordsToRecommend.length})</span>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  [setFirst, setSecond, setThird, setFourth, setFifth].forEach(
                    (fn) => fn(""),
                  )
                }
              >
                Clear
              </Button>
            </div>

            <div className="border rounded-md p-2 max-h-60 overflow-y-auto divide-y">
              {wordsToRecommend.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No words match your criteria.
                </p>
              ) : (
                wordsToRecommend.map((word, i) => (
                  <div
                    key={word + i}
                    className={`py-1 px-2 font-mono text-sm ${
                      i % 2 === 0 ? "bg-muted/40" : ""
                    }`}
                  >
                    {word}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const wordleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wordle",
  component: Wordle,
});
