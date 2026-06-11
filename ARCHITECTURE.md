# Architecture

A Next.js 15 (App Router) app with a thin server-action layer over Drizzle/SQLite.
There are no API routes and no client-side data fetching — every route is an async
server component that reads through `src/lib/actions/server.actions.ts`.

## Overall architecture

```mermaid
flowchart TB
    subgraph browser["Browser"]
        User(["Teacher / User"])
    end

    subgraph next["Next.js 15 App Router (src/app)"]
        Layout["layout.tsx<br/>nav shell + globals.css"]

        subgraph pages["Server Components (pages)"]
            Home["/ (page.tsx)"]
            Students["/students"]
            StudentDetail["/students/[id]"]
            Topics["/topics"]
            ProgressNew["/progress/new"]
            Insights["/insights<br/>PART 2 — empty stub"]
        end
    end

    subgraph components["Components (src/components)"]
        ProgressForm["ProgressForm.tsx<br/>('use client')"]
        AvgWidget["AverageScoreWidget.tsx<br/>(async server comp)"]
        ScoreBadge["ScoreBadge.tsx"]
        UI["ui/ Card, Button"]
    end

    subgraph logic["Domain logic (src/lib)"]
        Scoring["scoring.ts<br/>classifyScore -> low/mid/high"]
        Actions["actions/server.actions.ts<br/>('use server')<br/>getStudents, getStudent,<br/>getProgressForStudent,<br/>getAverageForStudent,<br/>recordProgress (Zod), ..."]
    end

    subgraph data["Data layer (src/lib/db)"]
        Client["client.ts<br/>better-sqlite3 + drizzle<br/>(WAL, foreign_keys ON)"]
        Schema["schema.ts<br/>students / topics /<br/>progress_records<br/>(soft-delete: deletedAt)"]
        Seed["seed.ts"]
    end

    DB[("data.db<br/>SQLite")]

    User -->|HTTP request| Layout
    Layout --> pages

    StudentDetail --> AvgWidget
    StudentDetail --> ScoreBadge
    ProgressNew --> ProgressForm
    pages -.uses.-> UI

    ProgressForm -->|server action call| Actions
    AvgWidget --> Actions
    Students --> Actions
    StudentDetail --> Actions
    Topics --> Actions
    ScoreBadge --> Scoring

    Actions -->|Drizzle queries| Client
    Client --> Schema
    Client --> DB
    Seed --> Client

    Insights -.->|NEW: add read action e.g.<br/>getCohortInsights| Actions
    Insights -.->|reuse| Scoring

    classDef todo fill:#fde68a,stroke:#d97706,stroke-width:2px,color:#000;
    class Insights todo;
```

### Layer by layer

- **Routing/render**: `src/app/layout.tsx` is the shared shell (top nav + `globals.css`).
  Each route is an async server component that awaits data directly — no client fetching
  or API layer.
- **Data access**: All reads/writes go through `server.actions.ts` (`"use server"`).
  These call Drizzle via the singleton `db` in `client.ts`, which wraps a single
  `better-sqlite3` connection to `data.db`. Mutations use `revalidatePath`.
- **Schema/conventions**: `schema.ts` defines `students`, `topics`, `progress_records`,
  all with a `deletedAt` soft-delete column. Existing queries filter on
  `isNull(deletedAt)`. Writes validate input with Zod (`recordProgressSchema`).
- **Presentation logic**: `scoring.ts` holds the `classifyScore` banding
  (low <50, mid 50-69, high >=70), consumed by `ScoreBadge`.

## Part 2 — `/insights` feature plan

```mermaid
flowchart TB
    User(["Teacher visits /insights"])

    subgraph page["/insights/page.tsx (async server component)"]
        direction TB
        PageRoot["Fetch + render"]
        Empty{"Any active<br/>students &<br/>records?"}
        EmptyState["Empty state:<br/>'No cohort data yet'"]
        subgraph widgets["Insight widgets"]
            Dist["Score distribution<br/>(terciles: low/mid/high)"]
            TopicRank["Strongest / weakest<br/>topics"]
            Attention["Students needing<br/>attention<br/>(bottom band / trending down)"]
            SubjectCards["Per-subject<br/>summary cards"]
        end
    end

    subgraph action["insights.actions.ts ('use server') — NEW"]
        direction TB
        GetInsights["getCohortInsights()"]
        Pure["lib/insights.ts (pure, testable)<br/>average, terciles, rankTopics,<br/>flagAttention, trend"]
    end

    subgraph existing["Existing layer (reuse)"]
        Scoring["scoring.ts<br/>classifyScore"]
        Client["db/client.ts -> Drizzle"]
        Schema["schema.ts<br/>students / topics / progress_records"]
    end

    DB[("data.db (SQLite)")]

    User --> PageRoot
    PageRoot --> GetInsights
    GetInsights -->|"join + filter<br/>deletedAt IS NULL<br/>(students, topics, records)"| Client
    Client --> Schema
    Client --> DB
    GetInsights --> Pure
    Pure --> Scoring

    GetInsights --> Empty
    Empty -->|no| EmptyState
    Empty -->|yes| widgets

    Dist --> Scoring

    classDef new fill:#fde68a,stroke:#d97706,stroke-width:2px,color:#000;
    classDef reuse fill:#dbeafe,stroke:#2563eb,color:#000;
    class action,page new;
    class existing reuse;
```

### Key decisions

- **New, focused action file** (`insights.actions.ts`) rather than bloating
  `server.actions.ts` — matches the "keep files focused" convention.
- **Pure logic in `lib/insights.ts`** (averages, terciles, topic ranking,
  attention-flagging, trend detection) so it can be unit-tested without a DB.
- **Reuse `classifyScore`** so cohort terciles match the banding used elsewhere.
- **Filter `deletedAt IS NULL` on all three tables** in the join — avoiding the gap
  in the existing `getAverageForStudent` (which ignores deleted topics).
- **Explicit empty / small-sample branch** before rendering widgets.
