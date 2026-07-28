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

### Rankings

A ranked list of shows, movies, games, books, and other works, each scored and reviewed by an Admin.

**Property**:
A show, movie, game, book, or other work that can appear in the Rankings. A Property covering an entire franchise has Franchise as its Type; individual titles within it are separate Properties grouped only informally via Tags.

**Property Type**:
The kind of a Property: Franchise, Show, Movie, Game, Book, Documentary, or Video. A Property may carry multiple Types when its Review spans formats (e.g. Franchise + Show + Movie for a body of work, or Show + Documentary for a docuseries).
_Avoid_: Film

**Review**:
An Admin's scored judgment of a Property. A Review carries at least one Score.

**Metric**:
A named axis a Review scores on: Fun or Art. More Metrics may be added programmatically.

**Score**:
The numeric value a Review gives its Property on one Metric: 10 at the highest, unbounded below, with up to 3 decimal places. No two Reviews share a Score on the same Metric.

**Average**:
The mean of a Review's defined Scores; the default ordering of the Rankings.

**Score Band**:
The carousel grouping of Reviews on the Rankings page, following the active ordering axis (Average by default, or a Metric): one band per integer floor from 0 through 9, 10 standing alone as the best of the best, and all negative values in a single catch-all band. Reviews with no Score on the active Metric are hidden.

**Tag**:
A lowercase label an Admin attaches to a Property so visitors can filter the Rankings (e.g. fantasy, animated).

**PEAK**:
The chip displayed on any Review whose defined Scores are all 9 or higher.

**Certified Poop**:
The catch-all Score Band holding every Review with a negative Score.

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
- A **Property** has exactly one **Review**; a **Review** is written by an **Admin**
- A **Property** has one or more **Property Types**
- A **Property** has zero or more **Tags**
- A **Review** has at least one **Score**, at most one per **Metric**
- A **Review** belongs to exactly one **Score Band**
- A **Game** has one or more **Players**
- A **Game** has one **Question Deck**
- A **Player** takes one **Turn** at a time
- A **Draw** removes one **Question** from the **Question Deck**

## Example dialogue

> **Dev:** "When a Player draws a Question, does it go back into the deck for the next round?"
> **Domain expert:** "No — once a Question is drawn, it's removed from the deck for the rest of that Game."

> **Dev:** "When a visitor filters the Rankings by the tag 'animated', do the carousels disappear?"
> **Domain expert:** "No — the Score Bands always apply; the filter only narrows which Reviews appear inside each band."

## Flagged ambiguities

- "player" vs "user": a Real Talk **Player** is a game participant with no account; a **User** is an authenticated account holder. A Denizen submitting a question suggestion acts as a **User**, not a **Player**.
- "franchise" was used to mean both a **Property Type** and a grouping of related **Properties** — resolved: Franchise is only a Type; related titles are grouped informally via **Tags**.
- "film" vs "movie" — resolved: Movie is the canonical **Property Type**; avoid Film.

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

### Rankings

- **One Review per Property:** Changing one's mind means editing the existing Review, not adding a new one.
- **Metrics:** Scores are per-Metric (Fun, Art); new Metrics are added programmatically. Each Metric enforces its own Score uniqueness; the Average is derived and unconstrained. A Review may leave any Metric undefined, but not all.
- **Score collisions:** A submitted Score that already exists on its Metric is rejected; the Admin adjusts (e.g. 8.5 → 8.51). The above/below preview exists to help pick a free Score.
- **Authorship:** Only an Admin can create, edit, or delete Reviews. Denizens and anonymous visitors see the read-only Rankings.
- **Neighbour preview:** While entering a Score, the form shows the 3 Reviews above and 3 below that slot on the Score's Metric; each neighbour's Score can be quick-edited inline to free a taken slot.
- **Tags:** Tags are free-entered but normalized to lowercase on save; visitors filter by selecting multiple Tags (AND semantics).
- **Bands survive filtering:** Filtering narrows which Reviews appear, but the Score Band grouping always applies.
- **Unrated Reviews hide:** When ordering by a Metric (not Average), Reviews with no Score on that Metric are hidden from the board.
