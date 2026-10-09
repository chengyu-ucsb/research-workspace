# GitHub website rules

Chengyu's standing preference is to keep each website in its own project repository and use its full project-specific GitHub Pages URL.

- Work in `chengyu-ucsb/research-workspace` for this tracker.
- Publish this project at https://chengyu-ucsb.github.io/research-workspace/ using `main` → `/docs`.
- Never use the bare https://chengyu-ucsb.github.io/ address as this project's website link.
- Do not create, overwrite, or repurpose the `chengyu-ucsb.github.io` root repository for a project website.
- Preserve the personal website at https://chengyufang.org/ and its repository, domain, and DNS settings.
- Do not add a CNAME or change a custom domain unless the user explicitly requests that change.
- When GitHub hosting is requested, publish the working app on GitHub Pages; uploading source code alone does not complete the request.
- Keep asset paths relative to the project directory.
- Before giving a live link, verify the final URL after redirects, confirm the full project path remains present, and confirm the page is the intended project.
- Clearly distinguish the live website link from the source repository link.

Build with `pnpm build`, check storage and backups with `pnpm test:pages`, and commit the rebuilt `docs/` output when application source changes. A documentation-only change does not need a rebuild.
