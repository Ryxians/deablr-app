# Real Talk

A social question game where players take turns drawing random questions from a numbered deck and answering them honestly.

## Language

**Game**:
A single session of Real Talk with a defined set of players and a shared pool of questions.

**Player**:
A person participating in a Game. A Game has one or more Players.

**Question Deck**:
The set of questions available to be drawn. Each Question has a unique number. A Game begins with all questions in the deck.

**Question**:
A numbered prompt from the deck that a Player answers during their turn. Each Question has an original number from the file.

**Draw**:
The act of randomly selecting a Question from the remaining undealt Questions in the deck. When a Game begins, a Question is automatically Drawn.

**Turn**:
The period during which one Player Draws a Question and answers it. A Turn ends only when the group manually advances to the next Player.

**Round**:
A complete cycle where every Player has taken one Turn. After each Round, the Player order is reshuffled.

## Relationships

- A **Game** has one or more **Players**
- A **Game** has one **Question Deck**
- A **Player** takes one **Turn** at a time
- A **Draw** removes one **Question** from the **Question Deck**

## Example dialogue

> **Dev:** "When a Player draws a Question, does it go back into the deck for the next round?"
> **Domain expert:** "No — once a Question is drawn, it's removed from the deck for the rest of that Game."

## Flagged ambiguities

- None yet.

## Decisions

- **State persistence:** Game state is stored in `localStorage` and survives page refreshes.
- **Reset:** A manual reset button clears the current Game and allows starting a new one.
- **Player changes mid-game:** Not supported in v1. Players are fixed at the start of a Game.
