---
name: Workspace package installs
description: A pnpm workspace quirk encountered when adding dependencies to individual artifacts.
---

When adding a dependency to a package inside a pnpm workspace, use that package's
workspace filter rather than a root-level add command.

**Why:** The package manager's root-workspace safety check rejects an unscoped add,
which can leave the intended artifact without the dependency even though the
workspace installation partially ran.

**How to apply:** Install with the exact package filter for the frontend or server
package that owns the dependency, then run the normal workspace typecheck.