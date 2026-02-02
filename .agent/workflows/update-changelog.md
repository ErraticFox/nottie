---
description: Update package.json version and maintain a user-friendly changelog
---

---
description: Update package.json version and maintain a user-friendly changelog
---
1. Read the current version from package.json.
2. Check git log since the last version tag to gather recent changes.
// turbo
3. Run git log $(git describe --tags --abbrev=0)..HEAD --oneline
4. Present the list of changes and ask the user to confirm which are user-facing (new features, bug fixes users would notice, UI/UX improvements). Exclude anything purely technical like refactors, dependency bumps, build config, or backend-only changes.
5. Suggest to the user what type of release this is: patch (bug fixes), minor (new features), or major (breaking/big changes).
6. Bump the version in package.json accordingly.
// turbo
7. Run npm version [patch|minor|major] --no-git-tag-version
8. Generate a changelog entry in src/data/changelog.ts. Group items under "What's New", "Improvements", "Bug Fixes", as appropriate or other title if a major feature. Write each item in plain, non-technical language a regular user would understand.
9. Prepend the new entry to CHANGELOG.md (create the file if it doesn't exist).
10. Show the user the updated CHANGELOG.md entry for review and ask for any wording tweaks.
11. Stage the changed files.
// turbo
12. Run git add package.json CHANGELOG.md
13. Commit with a version bump message.
// turbo
14. Run git commit -m "chore: bump version to v[version] and update changelog"