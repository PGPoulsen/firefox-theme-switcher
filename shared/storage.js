// Storage management for Firefox Theme Switcher

const DEFAULT_SETTINGS = {
  currentMode: "dark",          // "dark" | "light" | "auto"
  clickAction: "toggle",        // "toggle" (1-click direct toggle) | "popup" (open menu popup)
  toggleBrowserUI: true,        // Apply theme to Firefox browser UI
  toggleWebsites: true,         // Apply prefers-color-scheme override to webpages
  themeEngine: "presets",       // "presets" (dynamic presets) | "builtin" (Firefox default theme)
  darkPreset: "charcoal",       // "charcoal" | "oled" | "slate" | "dracula" | "nord"
  lightPreset: "classic",       // "classic" | "warm" | "minimal"
  autoSchedule: "disabled",     // "disabled" | "system" | "time"
  scheduleDarkTime: "20:00",
  scheduleLightTime: "07:00"
};

/**
 * Get all current settings merged with defaults
 */
async function getSettings() {
  try {
    const stored = await browser.storage.local.get(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch (err) {
    console.error("Error reading storage:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Update one or more settings
 */
async function updateSettings(partial) {
  try {
    await browser.storage.local.set(partial);
    return true;
  } catch (err) {
    console.error("Error saving storage:", err);
    return false;
  }
}

globalThis.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
globalThis.getSettings = getSettings;
globalThis.updateSettings = updateSettings;
