# Deablr

A personal website hosting a collection of minor projects, including the social question game Real Talk.

## Language

### Site-wide

**User**:
An account that can log in to the site.

**Role**:
A named set of permissions assigned to a User, applying globally across all projects.
_Avoid_: Group, tier

**Admin**:
The Role with full control over the site, held by the site owner.

**Denizen**:
The Role for trusted friends and family who can contribute content.

### Real Talk

A social question game where players take turns drawing random questions from a numbered deck and answering them honestly.

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

- A **User** has exactly one **Role**
- **Role** permissions apply globally and are not scoped per project
- A **Game** has one or more **Players**
- A **Game** has one **Question Deck**
- A **Player** takes one **Turn** at a time
- A **Draw** removes one **Question** from the **Question Deck**

## Example dialogue

> **Dev:** "When a Player draws a Question, does it go back into the deck for the next round?"
> **Domain expert:** "No — once a Question is drawn, it's removed from the deck for the rest of that Game."

## Flagged ambiguities

- "player" vs "user": a Real Talk **Player** is a game participant with no account; a **User** is an authenticated account holder. A Denizen submitting a question suggestion acts as a **User**, not a **Player**.

## Decisions

### Site-wide

- **Credentials:** Users authenticate with username and password. The site sends no email; password resets are performed manually by an Admin.
- **Onboarding:** Three sanctioned paths to an account — Admin-created accounts, invite links, and open signup with Admin approval. Signups via the open form are pending until approved. Which path is used is situational; permissions are global regardless.
- **First Admin:** Created through a one-time setup form at /admin, available only while no Users exist.
- **Auth UI:** /admin is the only auth surface. Logged out it shows a login form; an Admin sees the dashboard; a Denizen sees the not-found page.
- **Permissions:** Roles map to named permission statements (e.g. question:submit, user:manage) that server code checks. Statements are global, not per project.

### Real Talk

- **State persistence:** Game state is stored in `localStorage` and survives page refreshes.
- **Reset:** A manual reset button clears the current Game and allows starting a new one.
- **Player changes mid-game:** Not supported in v1. Players are fixed at the start of a Game.
