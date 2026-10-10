# Easy Theme Switcher for Firefox 🌓

A fast, lightweight, and modern Firefox extension that lets you easily switch between Dark and Light themes with a single click or keyboard shortcut.

It changes **both** Firefox's browser interface (tabs, toolbars, address bar) and web page content (`prefers-color-scheme`) seamlessly.

---

## ✨ Key Features

1. **⚡ One-Click Instant Toggle**
   - Click the toolbar icon to immediately toggle between Dark and Light mode.
   - Dynamic icon updates instantly (☀️ Sun in Light mode, 🌙 Moon in Dark mode, 💻 System in Auto mode).
   - Dynamic tooltip updates with the current status and keyboard shortcut hint.

2. **🌐 Dual-Scope Switching**
   - **Firefox Browser UI**: Colors the tab bar, navigation bar, URL bar, popups, and sidebars.
   - **Websites & Web Content**: Automatically sets `browserSettings.overrideContentColorScheme`, instructing websites (GitHub, YouTube, Reddit, Google, DuckDuckGo, Wikipedia, MDN, etc.) to render in dark or light mode.

3. **⌨️ Keyboard Shortcut**
   - Press **`Alt + Shift + D`** to toggle instantly from anywhere without reaching for your mouse.
   - Fully customizable in `about:addons` → *Manage Extension Shortcuts*.

4. **🖱️ Right-Click Context Menu**
   - Right-click anywhere on a webpage or the toolbar icon:
     - 🌓 **Toggle Dark / Light**
     - ☀️ **Light Mode**
     - 🌙 **Dark Mode**
     - 💻 **Follow System (Auto)**
     - ⚙️ **Settings & Customization**

5. **🎨 Built-in Color Palettes**
   - **Dark Mode**:
     - *Firefox Charcoal* (Official Firefox Dark aesthetic)
     - *OLED Pure Black* (`#000000` pitch black for OLED/AMOLED screens & battery saving)
     - *Midnight Slate* (Deep blue-gray developer style)
     - *Dracula Purple* (Vibrant cyberpunk purple with neon accents)
     - *Nord Frost* (Cool arctic aesthetic)
   - **Light Mode**:
     - *Classic White* (Crisp modern white)
     - *Warm Paper / Sepia* (Gentle sepia/cream that reduces eye fatigue)
     - *Minimal Gray* (Neutral soft grayscale)

6. **⏰ Automation & Scheduling**
   - **Manual Mode**: Direct control on demand.
   - **Follow OS / System**: Dynamically follows your operating system's color scheme.
   - **Time-based Schedule**: Automatically turns dark at sunset/night (e.g. 20:00) and light in the morning (e.g. 07:00).

---

## 🚀 How to Install in Firefox

### Option A: Quick Load via `about:debugging` (Recommended for immediate testing)
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox` in the address bar.
2. Click **"Load Temporary Add-on…"**.
3. Navigate to `~/Source/firefox-theme-switcher/` and select the [manifest.json] file.
4. The extension will immediately load and appear in your Firefox toolbar!

### Option B: Install the Packaged Add-on (`.xpi` / `.zip`)
A ready-to-use package has already been built:
- Location: `~/Source/firefox-theme-switcher/dist/easy-theme-switcher.xpi`
- In Firefox:
  1. Go to `about:addons`.
  2. Click the gear icon (⚙️) at the top of the Extensions list.
  3. Select **"Install Add-on From File…"**.
  4. Choose the `easy-theme-switcher.xpi` file.
  *(Note: In Firefox ESR or Developer Edition, if unsigned add-ons are restricted, toggle `xpinstall.signatures.required` to `false` in `about:config`).*

---

## 🛠️ Project Structure

```text
firefox-theme-switcher/
├── manifest.json             # Manifest V3 extension configuration
├── background.js            # Background service handling toggling, alarms, menus
├── package.sh               # Shell script to build .zip and .xpi packages
├── .web-ext-config.cjs      # Configuration for web-ext linter
├── dist/                    # Built packages (.zip & .xpi)
├── shared/
│   ├── presets.js           # Theme palettes and color definitions
│   └── storage.js           # Settings persistence and defaults
├── popup/
│   ├── popup.html           # Quick popup selector interface
│   ├── popup.css            # Styles for popup
│   └── popup.js             # Logic for popup interactions
├── options/
│   ├── options.html         # Settings dashboard
│   ├── options.css          # Styles for settings
│   └── options.js           # Settings logic and palette previews
└── icons/
    ├── sun.svg / moon.svg / auto.svg
    └── sun-*.png / moon-*.png / auto-*.png (16, 32, 48, 128 px)
```

---

## 🔄 Rebuilding the Package

If you modify any files, simply re-run:
```bash
./package.sh
```
This generates fresh files in the `dist/` directory.
