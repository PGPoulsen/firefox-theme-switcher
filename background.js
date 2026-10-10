// Background script for Firefox Theme Switcher

// Initialize on install or startup
browser.runtime.onInstalled.addListener(async () => {
  console.log("Firefox Theme Switcher installed/updated");
  await initializeExtension();
});

browser.runtime.onStartup.addListener(async () => {
  console.log("Firefox Theme Switcher starting up");
  await initializeExtension();
});

// Also run immediately on script load
initializeExtension();

/**
 * Initialize extension state, menus, and theme
 */
async function initializeExtension() {
  const settings = await globalThis.getSettings();
  
  // Set toolbar button behavior
  await updateActionBehavior(settings.clickAction);
  
  // Setup context menus
  setupContextMenus(settings.currentMode);
  
  // Apply the active theme
  await applyCurrentMode(settings.currentMode);

  // Setup scheduling
  setupScheduling(settings);

  // Listen to OS system color-scheme changes if window is available
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.removeEventListener("change", onSystemThemeChange);
    mediaQuery.addEventListener("change", onSystemThemeChange);
  }
}

/**
 * Configure whether left-clicking toolbar button toggles directly or opens popup
 */
async function updateActionBehavior(clickAction) {
  try {
    if (clickAction === "popup") {
      await browser.action.setPopup({ popup: "popup/popup.html" });
    } else {
      await browser.action.setPopup({ popup: "" });
    }
  } catch (err) {
    console.warn("Could not set action popup:", err);
  }
}

/**
 * Create right-click context menu items
 */
function setupContextMenus(currentMode) {
  try {
    browser.menus.removeAll().then(() => {
      // Toggle
      browser.menus.create({
        id: "menu-toggle",
        title: "🌓 Toggle Dark / Light",
        contexts: ["action", "browser_action", "page"]
      });

      // Separator
      browser.menus.create({
        id: "menu-sep-1",
        type: "separator",
        contexts: ["action", "browser_action"]
      });

      // Light Mode Radio
      browser.menus.create({
        id: "menu-mode-light",
        type: "radio",
        title: "☀️ Light Mode",
        checked: currentMode === "light",
        contexts: ["action", "browser_action"]
      });

      // Dark Mode Radio
      browser.menus.create({
        id: "menu-mode-dark",
        type: "radio",
        title: "🌙 Dark Mode",
        checked: currentMode === "dark",
        contexts: ["action", "browser_action"]
      });

      // Auto / System Mode Radio
      browser.menus.create({
        id: "menu-mode-auto",
        type: "radio",
        title: "💻 Follow System (Auto)",
        checked: currentMode === "auto",
        contexts: ["action", "browser_action"]
      });

      // Separator
      browser.menus.create({
        id: "menu-sep-2",
        type: "separator",
        contexts: ["action", "browser_action"]
      });

      // Settings
      browser.menus.create({
        id: "menu-options",
        title: "⚙️ Theme Switcher Settings…",
        contexts: ["action", "browser_action"]
      });
    });
  } catch (err) {
    console.warn("Error creating context menus:", err);
  }
}

/**
 * Handle Toolbar Button Click (fired when clickAction is "toggle")
 */
browser.action.onClicked.addListener(async () => {
  await toggleDarkLight();
});

/**
 * Handle Keyboard Shortcuts (e.g. Alt+Shift+D)
 */
browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-theme") {
    await toggleDarkLight();
  }
});

/**
 * Handle Context Menu Selection
 */
browser.menus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "menu-toggle") {
    await toggleDarkLight();
  } else if (info.menuItemId === "menu-mode-light") {
    await applyCurrentMode("light");
  } else if (info.menuItemId === "menu-mode-dark") {
    await applyCurrentMode("dark");
  } else if (info.menuItemId === "menu-mode-auto") {
    await applyCurrentMode("auto");
  } else if (info.menuItemId === "menu-options") {
    browser.runtime.openOptionsPage();
  }
});

/**
 * Handle messages from popup / options page
 */
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "TOGGLE_THEME") {
    return await toggleDarkLight();
  } else if (message.type === "SET_MODE") {
    return await applyCurrentMode(message.mode);
  } else if (message.type === "RELOAD_SETTINGS") {
    const settings = await globalThis.getSettings();
    await updateActionBehavior(settings.clickAction);
    setupScheduling(settings);
    return await applyCurrentMode(settings.currentMode);
  }
});

/**
 * Toggle between Dark and Light mode
 */
async function toggleDarkLight() {
  const settings = await globalThis.getSettings();
  const nextMode = settings.currentMode === "dark" ? "light" : "dark";
  return await applyCurrentMode(nextMode);
}

/**
 * Apply the specified mode ("dark" | "light" | "auto")
 */
async function applyCurrentMode(targetMode) {
  const settings = await globalThis.getSettings();
  
  // Resolve effective visual mode if "auto"
  let effectiveMode = targetMode;
  if (targetMode === "auto") {
    if (typeof window !== "undefined" && window.matchMedia) {
      effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      effectiveMode = "dark";
    }
  }

  // 1. Update Firefox Webpage Content Color Scheme
  if (settings.toggleWebsites && browser.browserSettings && browser.browserSettings.overrideContentColorScheme) {
    try {
      await browser.browserSettings.overrideContentColorScheme.set({
        value: targetMode === "auto" ? "auto" : effectiveMode
      });
    } catch (err) {
      console.warn("Could not set overrideContentColorScheme:", err);
    }
  }

  // 2. Update Firefox Browser UI Theme
  if (settings.toggleBrowserUI) {
    await applyBrowserTheme(targetMode, effectiveMode, settings);
  }

  // 3. Update Icon & Tooltip
  await updateActionVisuals(targetMode, effectiveMode);

  // 4. Save to storage
  await globalThis.updateSettings({ currentMode: targetMode });

  // 5. Update context menu check states
  try {
    browser.menus.update("menu-mode-dark", { checked: targetMode === "dark" });
    browser.menus.update("menu-mode-light", { checked: targetMode === "light" });
    browser.menus.update("menu-mode-auto", { checked: targetMode === "auto" });
  } catch (err) {
    // Menu might not be ready yet
  }

  return { mode: targetMode, effectiveMode };
}

/**
 * Apply theme to browser UI (tabs, toolbars, address bar)
 */
async function applyBrowserTheme(targetMode, effectiveMode, settings) {
  // If Auto mode, reset dynamic theme to allow Firefox default to follow system
  if (targetMode === "auto" && settings.themeEngine !== "presets") {
    try {
      await browser.theme.reset();
      return;
    } catch (err) {
      console.warn("Could not reset theme:", err);
    }
  }

  if (settings.themeEngine === "builtin") {
    const success = await applyFirefoxBuiltinTheme(effectiveMode);
    if (success) return;
    // Fallback to presets if built-in theme activation fails
  }

  // Apply dynamic color preset
  const presetKey = effectiveMode === "dark" ? settings.darkPreset : settings.lightPreset;
  const presetList = globalThis.THEME_PRESETS[effectiveMode];
  const selectedPreset = (presetList && presetList[presetKey]) ? presetList[presetKey] : (effectiveMode === "dark" ? presetList.charcoal : presetList.classic);

  if (selectedPreset && selectedPreset.colors) {
    try {
      await browser.theme.update(selectedPreset.colors);
    } catch (err) {
      console.warn("Could not update theme:", err);
    }
  }
}

/**
 * Try enabling Firefox built-in light / dark themes via management API
 */
async function applyFirefoxBuiltinTheme(mode) {
  if (!browser.management || !browser.management.getAll) {
    return false;
  }
  try {
    const extensions = await browser.management.getAll();
    const themes = extensions.filter(ext => ext.type === "theme");

    let targetTheme = null;
    if (mode === "dark") {
      targetTheme = themes.find(t => t.id === "firefox-compact-dark@mozilla.org" || /dark/i.test(t.name) || /dark/i.test(t.id));
    } else {
      targetTheme = themes.find(t => t.id === "firefox-compact-light@mozilla.org" || /light/i.test(t.name) || /light/i.test(t.id));
    }

    if (targetTheme) {
      await browser.management.setEnabled(targetTheme.id, true);
      // Reset any manual theme overrides
      await browser.theme.reset();
      return true;
    }
  } catch (err) {
    console.warn("Failed to activate Firefox built-in theme via management API:", err);
  }
  return false;
}

/**
 * Update Toolbar Action Icon and Tooltip
 */
async function updateActionVisuals(targetMode, effectiveMode) {
  let iconPrefix = "moon";
  let modeLabel = "Dark";

  if (targetMode === "auto") {
    iconPrefix = "auto";
    modeLabel = `Auto (${effectiveMode === "dark" ? "Dark" : "Light"})`;
  } else if (targetMode === "light") {
    iconPrefix = "sun";
    modeLabel = "Light";
  } else {
    iconPrefix = "moon";
    modeLabel = "Dark";
  }

  const icons = {
    16: `icons/${iconPrefix}-16.png`,
    32: `icons/${iconPrefix}-32.png`,
    48: `icons/${iconPrefix}-48.png`,
    128: `icons/${iconPrefix}-128.png`
  };

  try {
    await browser.action.setIcon({ path: icons });
    const nextToggleText = effectiveMode === "dark" ? "Light" : "Dark";
    await browser.action.setTitle({
      title: `Theme Switcher: ${modeLabel} Mode\nClick to switch to ${nextToggleText} (Alt+Shift+D)`
    });
  } catch (err) {
    console.warn("Could not update action visuals:", err);
  }
}

/**
 * Handle system color scheme change
 */
async function onSystemThemeChange() {
  const settings = await globalThis.getSettings();
  if (settings.currentMode === "auto" || settings.autoSchedule === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    await applyCurrentMode(isDark ? "dark" : "light");
  }
}

/**
 * Setup alarms for time-based scheduling
 */
function setupScheduling(settings) {
  if (!browser.alarms) return;

  browser.alarms.clear("theme-scheduler");

  if (settings.autoSchedule === "time") {
    browser.alarms.create("theme-scheduler", { periodInMinutes: 1 });
  }
}

if (browser.alarms) {
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "theme-scheduler") {
      const settings = await globalThis.getSettings();
      if (settings.autoSchedule !== "time") return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      const [darkH, darkM] = (settings.scheduleDarkTime || "20:00").split(":").map(Number);
      const [lightH, lightM] = (settings.scheduleLightTime || "07:00").split(":").map(Number);
      const darkVal = darkH * 60 + darkM;
      const lightVal = lightH * 60 + lightM;

      let shouldBeDark = false;
      if (darkVal > lightVal) {
        // e.g. 20:00 to 07:00 next morning
        shouldBeDark = currentTimeVal >= darkVal || currentTimeVal < lightVal;
      } else {
        // e.g. dark during daytime (unusual, but handle anyway)
        shouldBeDark = currentTimeVal >= darkVal && currentTimeVal < lightVal;
      }

      const desiredMode = shouldBeDark ? "dark" : "light";
      if (settings.currentMode !== desiredMode) {
        await applyCurrentMode(desiredMode);
      }
    }
  });
}
