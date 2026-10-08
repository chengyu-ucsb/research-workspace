# Research Workspace

A research pipeline tracker with six phases: ideation, access, data collection, analysis, writing, and publication.

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
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_omniscient_ben_urich.sql
pnpm dev
```

Open the address printed by the development server. Apply the migration once per local database; local records are stored in the ignored `.wrangler/` directory.

## Hosting and data

Built with React, Vinext, Cloudflare Workers, and D1. This is a server-backed application, so it cannot run directly on static GitHub Pages hosting.

The included Sites configuration declares the database binding without linking to an existing deployment. A new Sites project supplies its own deployment identity and database. Other Cloudflare deployments need their own Worker and D1 configuration.

Deploy behind authentication. The app relies on its host’s access control and provides one shared workspace to authorised visitors. Making this repository public does not publish anyone’s saved projects or change access to an existing deployment.

## Development

- `app/page.tsx`: workspace and project editor
- `app/globals.css`: visual design and responsive layout
- `app/api/projects/route.ts`: project storage API
- `lib/projects.ts`: phases and validation
- `db/` and `drizzle/`: database schema and migrations

Generate new migrations with `pnpm db:generate`. Keep applied migrations unchanged.

After building, run `node scripts/verify-workspace.mjs` to check page rendering and the project lifecycle against a disposable local database.
