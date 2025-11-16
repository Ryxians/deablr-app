import { Hono } from "hono";

export const WordleRoutes = new Hono().get("/words", async (c) => {
  const file = Bun.file("server/words.txt");
  const words = (await file.text())
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return c.json(words, 200);
});
