# Installing Composer's Dungeon

Everything you need, in one page. Pick the route that matches you:

| You want to… | Go to |
| --- | --- |
| **Just play it on Windows** | [1 · Windows, one file](#1--windows-one-file-recommended) |
| Run it from the source code on Windows | [2 · Windows from source](#2--windows-from-source) |
| Run it on macOS | [3 · macOS](#3--macos) |
| Run it on Linux | [4 · Linux](#4--linux) |
| Build the installer yourself | [5 · Building the installer](#5--building-the-installer-yourself) |
| Fix something | [Troubleshooting](#troubleshooting) |

Composer's Dungeon plays in **one shared world**, hosted at
<https://composers-dungeon.vercel.app>. The installed Windows app and a browser
tab are the same game: one account system, one Guild, one library, whichever you
sign in from.

If that server cannot be reached, the app offers to play from a local database
on your own PC instead. It **asks first**, because the two are separate saves
and nothing moves between them: a character built offline stays offline.

---

## 1 · Windows, one file (recommended)

**Download → double-click → play.** Nothing else to install. The installer
carries the Node runtime, the compiled app, and a local database already stocked
with all 46 lessons, 16 dungeon areas, 10 bosses, 21 artifacts and
58 achievements — the offline fallback, ready before you ever need it. Online,
the same content comes from the server.

### Step by step

1. Open the **[Releases page](https://github.com/knwilliams0512/Composers-Dungeon/releases)**.
2. Under the newest release, open **Assets** and click
   **`ComposersDungeonSetup.exe`** (about 30 MB).
3. Your browser may warn that the file *"isn't commonly downloaded"*. Click the
   **⋯** beside the download → **Keep** → **Keep anyway**.
4. Double-click the downloaded file.
5. Windows shows a blue **"Windows protected your PC"** box. Click
   **More info**, then **Run anyway**.
6. Click through the installer. It takes about a minute.
7. Launch **Composer's Dungeon** from your Desktop or Start menu.

> **Why the warnings?** The installer isn't code-signed — a certificate costs
> several hundred dollars a year. Both prompts mean "we don't recognise the
> publisher", not "we found something bad". You can verify the download
> yourself: see [Verifying your download](#verifying-your-download).

### What it does to your PC

| | |
| --- | --- |
| Administrator rights | **Not needed.** It installs for your user account only, so there is no UAC prompt. |
| Install location | `%LOCALAPPDATA%\ComposersDungeon` |
| Your save file | `%LOCALAPPDATA%\ComposersDungeon\data\dungeon.db` |
| Shortcuts | Desktop and Start menu |
| Add/Remove Programs | Yes — listed as *Composer's Dungeon* |
| Network access | Outbound HTTPS to the game server and the update feed. Nothing listens for inbound connections, so Windows Firewall never prompts. Playing offline is loopback only (`127.0.0.1`). |
| Registry | One key under `HKCU\Software\ComposersDungeon` for the uninstaller |

Nothing is written outside your user profile, and nothing is downloaded during
installation.

### First run

The app opens in **its own window** — no address bar, no tabs, no browser
chrome. Closing the window stops it, like any normal program.

Sign up to start from your first note — onboarding and the adaptive Placement
Trial take a couple of minutes and shape the whole dungeon to you.

The account you make is on the shared server, so it is the same account in a
browser on any other machine. If you are offline when you first sign up, it is a
local account on this PC only.

**Pin it to the taskbar:** once open, use the window's `…` menu →
**Install Composer's Dungeon**. Windows then treats it as a properly installed
app, with jump-list shortcuts straight to the Academy, the Dungeon and today's
Daily Trial.

### Updating

> **One exception, once.** Copies installed from **v1.19.0 or earlier** have the
> updater switched off inside them — releases were private then, so the feed
> they read could not answer, and shipping a check that fails on every launch
> was worse than shipping none. Those copies cannot reach v1.19.1 on their own.
> Install v1.19.1 by hand, following the steps above, and that is the last
> manual install: the updater is on from v1.19.1 onward. Installing over an
> existing copy keeps your local save.

**After that, you don't.** Every time you launch it, the app checks for a newer version,
verifies the download against its published checksum, swaps itself out, applies
any database migrations, pulls in new lessons and dungeon areas, and opens — all
before the window appears. If you're offline or the check fails, it just starts
normally.

**Settings → Updates** inside the app shows your installed version and lets you
check or install on demand.

Your progress is never part of an update: compositions, levels, streaks and
guild posts live in `data\` and are not touched.

### Uninstalling

**Settings → Apps → Composer's Dungeon → Uninstall**, or the entry in the Start
menu. It asks before deleting your save and backs it up to your Desktop as
`composers-dungeon-backup.db` first.

---

## 2 · Windows from source

Use this if you want to read, change or build the code rather than run a
prebuilt binary.

### The scripted way

Download the repo (**Code → Download ZIP**), unzip it anywhere, and double-click
**`Install Composers Dungeon.bat`**. It installs Node.js and Git through winget
if they're missing, sets up the database, builds the app and creates shortcuts.

> Browsers block `.bat` downloads, so download the whole ZIP rather than that
> one file.

Or, in **PowerShell** (works once the repository is public):

```powershell
irm https://raw.githubusercontent.com/knwilliams0512/Composers-Dungeon/HEAD/scripts/windows/install.ps1 | iex
```

### The manual way

Requires [Node.js 18+](https://nodejs.org) and [Git](https://git-scm.com/download/win).

```powershell
git clone https://github.com/knwilliams0512/Composers-Dungeon.git
cd Composers-Dungeon
copy .env.example .env
npm install
npm run setup          # creates the database and seeds all the content
npm run build
npm start              # http://localhost:3000
```

Before anything public-facing, edit `.env` and set a real `NEXTAUTH_SECRET`:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

### Maintaining a source install

| Task | Command |
| --- | --- |
| Update to the latest code | `npm run win:update` (progress preserved) |
| Launch in an app window | `npm run win:start` |
| Use a different port | `npm run win:start -- -Port 3005` |
| Start the server only | `npm run win:start -- -NoWindow` |
| Force-stop a stuck server | `npm run win:stop` |
| Remove shortcuts | `npm run win:uninstall` |
| Remove everything | `npm run win:uninstall -- -RemoveFiles` |

---

## 3 · macOS

There is no macOS installer yet — run it from source. Requires
[Node.js 18+](https://nodejs.org) (or `brew install node`).

```bash
git clone https://github.com/knwilliams0512/Composers-Dungeon.git
cd Composers-Dungeon
cp .env.example .env
# set a real secret:
sed -i '' "s|change-me-to-a-long-random-string|$(openssl rand -base64 32)|" .env
npm run setup
npm run build && npm start
```

Open <http://localhost:3000>.

**To get an app window rather than a browser tab:** open it in Chrome or Edge,
then **⋮ → Cast, save and share → Install page as app**. It gains a Dock icon
and its own window. (The server still has to be running.)

---

## 4 · Linux

Same as macOS. Requires Node.js 18+.

```bash
git clone https://github.com/knwilliams0512/Composers-Dungeon.git
cd Composers-Dungeon
cp .env.example .env
sed -i "s|change-me-to-a-long-random-string|$(openssl rand -base64 32)|" .env
npm run setup
npm run build && npm start
```

Open <http://localhost:3000>, and use your browser's install button for a
standalone window.

To run it as a background service, point a systemd user unit at
`npm start` with `NEXTAUTH_URL`, `NEXTAUTH_SECRET` and `DATABASE_URL` set.

---

## 5 · Building the installer yourself

The Windows installer is built **on Linux or macOS** — no Windows machine
required.

```bash
sudo apt-get install -y nsis     # or: brew install makensis
npm ci
scripts/windows/build-installer.sh
```

Output in `dist/`:

| File | What it is |
| --- | --- |
| `ComposersDungeonSetup.exe` | The full installer (~30 MB) |
| `ComposersDungeon-<version>-update.zip` | The in-place update package (~15 MB, no Node runtime) |
| `latest.json` | The update feed: version, URL and SHA-256 |

The script fetches a Windows Node runtime, regenerates the Prisma client with
the Windows query engine, builds the Next.js standalone server, seeds a fresh
database to ship, compiles the seed to plain JS for the updater, and packs it
all with NSIS.

### Publishing a release

Push a version tag and CI does the rest:

```bash
npm version 1.2.0 --no-git-tag-version
git commit -am "Release 1.2.0"
git tag v1.2.0
git push origin HEAD --tags
```

`.github/workflows/windows-installer.yml` builds all three files and attaches
them to a GitHub Release. Every installed copy picks the update up on its next
launch.

---

## Requirements

| | Minimum |
| --- | --- |
| **Windows (installer)** | Windows 10 1809 or newer, 64-bit. ~350 MB free disk. Nothing else. |
| **From source** | Node.js 18 or newer, ~600 MB free disk during install |
| **Browser (source installs)** | Chrome, Edge, Firefox or Safari, current version |
| **Audio** | Any working sound output — the composer synthesises notes in the page |
| **Internet** | Needed for the shared world and for updates. Without it the app offers offline play from the local database on this PC. |

---

## Verifying your download

Every release publishes the SHA-256 of its update package in `latest.json`, and
the app checks it automatically before installing an update. To check an
installer you downloaded by hand:

```powershell
Get-FileHash .\ComposersDungeonSetup.exe -Algorithm SHA256
```

Compare it with the hash shown on the release page. If they don't match, delete
the file and download it again.

---

## Troubleshooting

| What you see | What to do |
| --- | --- |
| Browser: *"this file may be unsafe"* / *"isn't commonly downloaded"* | **⋯ → Keep → Keep anyway.** Expected for any unsigned installer. |
| *"Windows protected your PC"* (SmartScreen) | **More info → Run anyway.** |
| Antivirus quarantines the installer | Unsigned installers are commonly flagged by heuristics. Restore it, or build from source instead. |
| *"running scripts is disabled on this system"* | You launched a `.ps1` directly. Use the `.bat`, or the `irm … \| iex` line — both bypass execution policy for that one run. |
| The installer can't find winget | Older Windows 10. Install [Node.js LTS](https://nodejs.org) and [Git](https://git-scm.com/download/win) by hand, then re-run. |
| Nothing happens when you click the shortcut | Another program owns port 3000. Run `npm run win:start -- -Port 3005`, or `npm run win:stop` to clear a stuck server. |
| It opened in a normal browser tab | Neither Edge nor Chrome is installed. Install either for the windowed experience. |
| The app says it can't reach the update server | Normal when offline. It keeps working; updates resume when you're back online. |
| *"Application error: a server-side exception has occurred"* with a digest number | The page hit a real error; the digest is just its fingerprint. The actual cause is written to `%LOCALAPPDATA%\ComposersDungeon\data\server.log.err` — open it in Notepad and read the last lines. The most common cause on a fresh PC is a missing Microsoft VC++ runtime: install it from <https://aka.ms/vs/17/release/vc_redist.x64.exe> and launch again. |
| Server errors on launch | Read `%LOCALAPPDATA%\ComposersDungeon\data\server.log` and `server.log.err`. |
| Update failed | Read `…\data\update.log`. A failed update rolls back — your previous version still works. |
| You want your progress back after uninstalling | The uninstaller left `composers-dungeon-backup.db` on your Desktop. Reinstall, then copy it over `…\ComposersDungeon\data\dungeon.db` with the app closed. |

---

## Frequently asked

**Is anything sent anywhere?**
Online, yes — the app talks to the game server exactly as a browser does, so
your account, progress and anything you publish live there. It makes two kinds
of outbound request and no others: the game server, and the update feed. No
database credential is ever shipped to your machine (`npm run check:launcher`
enforces that), so the app can only reach the database through the server, the
same as any other player.

Playing offline, nothing leaves the machine. The local server binds to
`127.0.0.1` only. You can switch the update check off on its own by setting
`"enabled": false` in
`%LOCALAPPDATA%\ComposersDungeon\launch\update-config.json`, and you can leave
the shared world by removing `"serverUrl"` from that same file.

**Can other people see my compositions?**
Online, yes, if you publish them: the Guild is shared with every other player,
and a composition marked public is visible to them. Compositions are private by
default. Playing offline, the Guild is populated only by accounts created on
your copy and nothing is visible beyond your install.

**Where is my progress stored?**
Online, on the server, keyed to your account — sign in from anywhere and it is
there. Offline progress is one SQLite file:
`%LOCALAPPDATA%\ComposersDungeon\data\dungeon.db`. Copy it anywhere to back it
up, with the app closed.

**Can I move my progress to another PC?**
Online, there is nothing to move: sign in. An offline save moves by installing
on the new machine, closing it, and copying `dungeon.db` across. An offline save
cannot be turned into an online one.

**Does it need to stay installed to keep my music?**
No — but back up `dungeon.db` before uninstalling, or accept the backup the
uninstaller offers.

**How big is it once installed?**
About 350 MB, most of which is the bundled Node runtime.
