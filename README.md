# Research Workspace

A research tracker for ideation, access, data collection, analysis, writing, and publication.

[Open the tracker](https://chengyu-ucsb.github.io/research-workspace/)

## Using the tracker

Add projects, move them between phases, plan milestones, and track deadlines on the calendar. Each phase has a flexible target of 2–3 active projects. Published and archived work stays available in its own view.

Projects save in your browser on this device. **Export backup** downloads a JSON copy; **Import backup** restores it after confirmation. Use backups when moving devices, and before clearing browser data. There is no account or automatic device sync. Sharing the website lets others use their own workspace; it does not share your saved projects.

## Development

Requires Node.js 22.13+ and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Build and check the GitHub Pages version:

```sh
pnpm build
pnpm test:pages
```

- `app/workspace.tsx`: board, calendar, and project editor
- `app/globals.css`: visual design
- `lib/projects.ts`: phases and project validation
- `lib/local-projects.ts`: browser storage and backups
- `pages/`: static app entry
- `docs/`: built GitHub Pages website

To publish, set repository **Settings → Pages → Deploy from a branch → main → /docs**. Rebuild and commit `docs/` after source changes. The site uses relative asset paths and works at the project URL without a custom domain.

The earlier server-backed version remains in `app/api/`, `db/`, and `drizzle/`. It can be built with `pnpm build:server` for a compatible host. GitHub Pages uses browser storage and does not depend on that server or a ChatGPT login.

The pipeline structure draws on Matt and Jessica’s pipeline templates. Design cues come from [Chengyu Fang’s website](https://chengyufang.org/).
