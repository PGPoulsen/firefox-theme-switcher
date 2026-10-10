// Popup script for Firefox Theme Switcher

document.addEventListener("DOMContentLoaded", async () => {
  const btnModeLight = document.getElementById("btnModeLight");
  const btnModeDark = document.getElementById("btnModeDark");
  const btnModeAuto = document.getElementById("btnModeAuto");
  const btnQuickToggle = document.getElementById("btnQuickToggle");
  const btnOpenOptions = document.getElementById("btnOpenOptions");
  const statusText = document.getElementById("statusText");
  const chkBrowserUI = document.getElementById("chkBrowserUI");
  const chkWebsites = document.getElementById("chkWebsites");
  const presetsContainer = document.getElementById("presetsContainer");
  const presetsTitle = document.getElementById("presetsTitle");

  let currentSettings = await globalThis.getSettings();

  // Initial UI Render
  renderUI(currentSettings);

  // Settings Icon click
  btnOpenOptions.addEventListener("click", () => {
    browser.runtime.openOptionsPage();
    window.close();
  });

  // Mode Selection
  btnModeLight.addEventListener("click", () => setMode("light"));
  btnModeDark.addEventListener("click", () => setMode("dark"));
  btnModeAuto.addEventListener("click", () => setMode("auto"));

  // Quick Toggle
  btnQuickToggle.addEventListener("click", async () => {
    const nextMode = currentSettings.currentMode === "dark" ? "light" : "dark";
    await setMode(nextMode);
  });

  // Scope Toggles
  chkBrowserUI.addEventListener("change", async (e) => {
    await globalThis.updateSettings({ toggleBrowserUI: e.target.checked });
    await notifySettingsUpdated();
  });

  chkWebsites.addEventListener("change", async (e) => {
    await globalThis.updateSettings({ toggleWebsites: e.target.checked });
    await notifySettingsUpdated();
  });

  /**
   * Set and apply a specific mode
   */
  async function setMode(mode) {
    await browser.runtime.sendMessage({ type: "SET_MODE", mode });
    currentSettings = await globalThis.getSettings();
    renderUI(currentSettings);
  }

  /**
   * Notify background to reload settings
   */
  async function notifySettingsUpdated() {
    await browser.runtime.sendMessage({ type: "RELOAD_SETTINGS" });
    currentSettings = await globalThis.getSettings();
    renderUI(currentSettings);
  }

  /**
   * Render the complete popup UI based on settings
   */
  function renderUI(settings) {
    // Mode Buttons Active State
    btnModeLight.classList.toggle("active", settings.currentMode === "light");
    btnModeDark.classList.toggle("active", settings.currentMode === "dark");
    btnModeAuto.classList.toggle("active", settings.currentMode === "auto");

    // Status Card & Quick Toggle
    if (settings.currentMode === "auto") {
      const isSysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      statusText.textContent = `Auto Mode (${isSysDark ? "Dark" : "Light"})`;
      btnQuickToggle.textContent = isSysDark ? "Switch to Light" : "Switch to Dark";
    } else if (settings.currentMode === "light") {
      statusText.textContent = "Light Theme Active";
      btnQuickToggle.textContent = "Switch to Dark";
    } else {
      statusText.textContent = "Dark Theme Active";
      btnQuickToggle.textContent = "Switch to Light";
    }

    // Checkboxes
    chkBrowserUI.checked = settings.toggleBrowserUI;
    chkWebsites.checked = settings.toggleWebsites;

    // Presets Row
    renderPresets(settings);
  }

  /**
   * Render preset chips for active mode
   */
  function renderPresets(settings) {
    presetsContainer.innerHTML = "";
    
    // Resolve mode to light or dark for presets
    let modeForPresets = settings.currentMode;
    if (modeForPresets === "auto") {
      modeForPresets = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    }

    const presets = globalThis.THEME_PRESETS[modeForPresets] || {};
    const activePresetKey = modeForPresets === "dark" ? settings.darkPreset : settings.lightPreset;

    presetsTitle.textContent = `${modeForPresets === "dark" ? "Dark" : "Light"} Palette`;

    Object.values(presets).forEach(preset => {
      const chip = document.createElement("button");
      chip.className = `preset-chip ${preset.id === activePresetKey ? "active" : ""}`;
      chip.title = preset.description;

      const swatch = document.createElement("span");
      swatch.className = "preset-swatch";
      swatch.style.backgroundColor = preset.preview.bg;
      swatch.style.borderColor = preset.preview.accent;

      const name = document.createElement("span");
      name.textContent = preset.name;

      chip.appendChild(swatch);
      chip.appendChild(name);

      chip.addEventListener("click", async () => {
        if (modeForPresets === "dark") {
          await globalThis.updateSettings({ darkPreset: preset.id });
        } else {
          await globalThis.updateSettings({ lightPreset: preset.id });
        }
        await notifySettingsUpdated();
      });

      presetsContainer.appendChild(chip);
    });
  }
});
