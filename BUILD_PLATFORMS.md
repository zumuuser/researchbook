# Cross-Platform Build Guide — FREE Options

## Why VS Code / Linux can't build Windows/macOS binaries

**Tauri apps require native toolchains for each platform.**

- **Linux → Windows**: Theoretically possible with cross-compilation, but Tauri's bundler (WiX/NSIS for `.msi`, custom for `.exe`) requires Windows-specific tools that don't exist on Linux. You'd spend days setting it up and it often breaks.
- **Linux → macOS**: **Impossible.** Apple's SDK and code-signing tools are legally restricted to Apple hardware. You NEED a Mac.

**Bottom line:** You need CI/CD with native runners, or actual Windows/Mac hardware.

---

## Option 1: Azure Pipelines — RECOMMENDED (One platform, all OSes)

**Cost:** FREE for public repos. Unlimited minutes. No credit card.

**What it builds:** Linux `.deb`, Windows `.msi` + `.exe`, macOS `.dmg` (universal — works on both Intel & Apple Silicon)

**Setup:**
1. Go to https://dev.azure.com and create a free Microsoft account
2. Create a new organization (free)
3. Create a new project
4. Go to **Pipelines → New pipeline**
5. Select **GitHub**, authorize Azure Pipelines, choose `zumuuser/researchbook`
6. Select **"Existing Azure Pipelines YAML file"**
   - Branch: `main`
   - Path: `/azure-pipelines.yml`
7. Click **Run**
8. Push a new tag to trigger: `git tag v0.1.1 && git push origin v0.1.1`

**Download artifacts:**
- After the build finishes, go to the pipeline run → **Artifacts** → Download the bundles
- Upload them manually to your GitHub release at https://github.com/zumuuser/researchbook/releases

---

## Option 2: Separate Platforms (Pick what you need)

### Windows — AppVeyor
**Cost:** FREE for public repos.

**Setup:**
1. Go to https://ci.appveyor.com and sign in with GitHub
2. Click **New Project** → select `zumuuser/researchbook`
3. AppVeyor auto-detects `appveyor.yml`
4. Push a tag: `git tag v0.1.1 && git push origin v0.1.1`
5. Download the `.msi` / `.exe` from the AppVeyor build artifacts

### macOS — Cirrus CI
**Cost:** FREE for public repos. Apple Silicon runners included.

**Setup:**
1. Go to https://cirrus-ci.org and sign in with GitHub
2. Install the Cirrus CI GitHub App for your repo
3. Push a tag: `git tag v0.1.1 && git push origin v0.1.1`
4. Download the `.dmg` from Cirrus CI build artifacts

---

## Quick Start (Azure Pipelines — easiest)

```bash
# 1. Make sure the CI configs are pushed (already done)
git push origin main

# 2. Create and push a new tag to trigger the build
git tag v0.1.1
git push origin v0.1.1

# 3. Wait ~10-15 minutes for all 3 platforms to build
# 4. Go to https://dev.azure.com/YOUR_ORG/YOUR_PROJECT/_build
# 5. Download artifacts and upload to GitHub release
```

---

## Manual Upload to GitHub Release

1. Go to https://github.com/zumuuser/researchbook/releases
2. Click **Edit** on your release (e.g., v0.1.0)
3. Drag and drop the downloaded `.msi`, `.exe`, `.dmg` files
4. Click **Update release**

Done! Your release now has Linux, Windows, and macOS binaries.
