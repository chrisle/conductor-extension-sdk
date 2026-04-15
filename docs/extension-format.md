# Extension Format

This document describes the structure of a Conductor extension package, the zip archive format, and the supported installation methods.

## manifest.json

Every extension must include a `manifest.json` at the project root. This file describes the extension to the host application.

```jsonc
{
  "id": "my-extension",       // Unique identifier (lowercase, alphanumeric, hyphens)
  "name": "My Extension",     // Human-readable display name
  "version": "0.1.0",         // Semver version string
  "main": "index.js"          // Entry point file within the zip or dist/
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | Unique extension identifier. Must match `[a-z0-9-]+`. |
| `name` | `string` | yes | Display name shown in the UI. |
| `version` | `string` | yes | Semver version (e.g. `1.2.3`). Used in the zip filename and for upgrade checks. |
| `main` | `string` | yes | Relative path to the bundled JS entry point inside the zip or build output. |

## Bundle Requirements (index.js)

The entry point must be a CommonJS bundle (esbuild output). The bundle's default export must be an `Extension` object (or the return value of `defineExtension()`).

The following packages are provided by the host and **must not** be included in the bundle — declare them as externals in your build config:

- `react`
- `react-dom`
- `zustand`
- `lucide-react`
- `@conductor/extension-api`
- `@conductor/extension-sdk`

## Zip File Format

The zip archive is a **flat archive** (no nested directories) containing the build output from `dist/`. The filename follows the pattern `{id}-{version}.zip`.

### Contents

```
my-extension-0.1.0.zip
├── manifest.json      # Extension metadata (required)
├── index.js           # CommonJS bundle (required)
└── index.js.map       # Source map (optional)
```

### Constraints

- The archive must contain `manifest.json` at the top level (not inside a subdirectory).
- The `manifest.json` must include a valid `id` field.
- The `main` entry point file referenced by the manifest must exist at the top level of the archive.
- No nested directories — all files are siblings at the archive root.
- Maximum recommended archive size: 10 MB uncompressed.

### Creating a Zip

Use the SDK CLI to produce a correctly structured archive:

```sh
conductor-extension build    # Compile TypeScript to dist/
conductor-extension pack     # Package dist/ into {id}-{version}.zip
```

## Zip File Hosting (GitHub Releases)

Conductor can resolve extensions from GitHub repositories by looking for the extension zip as a **release asset** on a GitHub Release.

| Method | URL pattern |
|---|---|
| Latest release | `https://github.com/{owner}/{repo}/releases/latest/download/{id}-{version}.zip` |
| Tagged release | `https://github.com/{owner}/{repo}/releases/download/{tag}/{id}-{version}.zip` |

### Publishing a Release

1. Build the extension: `conductor-extension build`
2. Package the zip: `conductor-extension pack`
3. Create a GitHub Release and attach the generated zip:

```sh
gh release create v0.1.0 my-extension-0.1.0.zip
```

## Installation Methods

### 1. Install from Zip File

The user selects a `.zip` file from their filesystem. Conductor extracts the archive, reads `manifest.json`, and copies the contents to `~/.local/share/conductor/extensions/{id}/`.

### 2. Load Unpacked (Dev Mode)

The user selects a directory on disk containing `manifest.json` and a built bundle. The extension is loaded directly from that directory with no file copy. The path is persisted in the app config so it reloads on restart.

### 3. Install from Git URL

The user provides an HTTPS or SSH git repository URL. Conductor clones, builds, and installs the extension automatically.

**Supported URL formats:**

| Protocol | Example |
|---|---|
| HTTPS | `https://github.com/owner/my-extension.git` |
| HTTPS (no .git suffix) | `https://github.com/owner/my-extension` |
| SSH | `git@github.com:owner/my-extension.git` |

**Installation flow:**

1. The repository is shallow-cloned (`git clone --depth 1`) to a temporary directory.
2. `manifest.json` is read from the repository root. The clone fails installation if the manifest is missing or lacks an `id` field.
3. If `package.json` is present, dependencies are installed using the detected package manager:
   - `pnpm install` if `pnpm-lock.yaml` exists
   - `yarn install` if `yarn.lock` exists
   - `npm install` otherwise
4. If `package.json` contains a `build` script, `npm run build` is executed.
5. The built bundle is located — Conductor checks `dist/{main}` first, then the repo root.
6. All build output files (manifest + bundle + source maps) are copied to `~/.local/share/conductor/extensions/{id}/`.
7. The temporary clone is deleted.

**Repository requirements for git URL installation:**

- `manifest.json` must exist at the repository root.
- The build script (if present) must produce the bundle referenced by `manifest.main` in either the repo root or `dist/`.
- All host-provided packages (`react`, `lucide-react`, etc.) must be declared as externals.

### 4. Drop-in Auto-Install

Zip files placed in `~/.local/share/conductor/extensions/` are automatically detected, extracted, and installed. The zip file is removed after successful extraction.

## Post-Install Behavior

Regardless of installation method:

1. The `id` field from `manifest.json` registers the extension. If an extension with the same `id` is already installed, it is replaced.
2. The `main` field is resolved to load the extension bundle.
3. If the extension defines `skills`, they are installed to `~/.claude/skills/conductor-{id}-{slug}/SKILL.md`.

## Example Repository Layout

```
my-extension/
├── manifest.json          # Source manifest (required at root)
├── package.json
├── tsconfig.json
├── src/
│   ├── index.tsx          # Extension entry point
│   └── MyTab.tsx
└── dist/                  # Build output (gitignored)
    ├── manifest.json
    ├── index.js
    └── index.js.map
```

The zip is generated at the project root by `conductor-extension pack` and should be attached to a GitHub Release, not committed to the repository.
