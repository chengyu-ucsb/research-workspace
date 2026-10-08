# Research Workspace

A publicly viewable research pipeline tracker with owner-only editing and six phases: ideation, access, data collection, analysis, writing, and publication.

[Open the live tracker](https://chengyu-research-workspace.madcommscientist.chatgpt.site)

## Features

- Move projects between phases, with a flexible target of 2–3 active projects per phase.
- Track collaborators, research questions, target outlets, priorities, and next actions.
- Plan milestones and deadlines in a calendar.
- Keep notes, mark publications, and archive or restore projects.
- Save progress in a database, with version checks to prevent conflicting edits.

The workspace starts empty. The pipeline structure draws on Matt and Jessica’s pipeline templates, and the visual design draws on [Chengyu Fang’s website](https://chengyufang.org/).

## Run locally

Requires Node.js 22.13 or later and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm build
for migration in drizzle/*.sql; do
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file "$migration"
done
pnpm dev
```

Open the address printed by the development server. Apply each migration once per local database; local records are stored in the ignored `.wrangler/` directory.

## Hosting and data

Built with React, Vinext, Cloudflare Workers, and D1. This is a server-backed application, so it cannot run directly on static GitHub Pages hosting.

The included Sites configuration declares the database binding without linking to an existing deployment. A new Sites project supplies its own deployment identity and database. Other Cloudflare deployments need their own Worker and D1 configuration.

Public visitors can browse all projects, milestones, notes, and the schedule. Only the owner can add, edit, move, archive, or delete projects. The API enforces this authorization on every write.

Set `WORKSPACE_OWNER_EMAIL` as a secret in the hosting environment before deployment. The first verified ChatGPT sign-in with that email binds the workspace to the account’s stable, Site-specific user ID. Subsequent requests are authorized by that ID, so changing an email does not transfer ownership. Without configuration the workspace stays read-only. Project data and the owner's identity remain in the database, not in this repository.

Authentication uses identity headers protected and injected by the Sites dispatcher. Another host requires its own verified authentication layer; do not expose a Worker that trusts client-supplied identity headers. Local development opens in public viewing mode unless authenticated identity is supplied by a trusted local test harness.

## Development

- `app/page.tsx`: server-side access checks
- `app/workspace.tsx`: workspace, project editor, and public detail views
- `lib/access.ts`: owner authorization
- `app/globals.css`: visual design and responsive layout
- `app/api/projects/route.ts`: project storage API
- `lib/projects.ts`: phases and validation
- `db/` and `drizzle/`: database schema and migrations

Generate new migrations with `pnpm db:generate`. Keep applied migrations unchanged.

After building, run `node scripts/verify-workspace.mjs` to check public access, owner authorization, page rendering, and the project lifecycle against a disposable local database.
