// Options page logic for Firefox Theme Switcher

document.addEventListener("DOMContentLoaded", async () => {
  const clickActionToggle = document.getElementById("clickActionToggle");
  const clickActionPopup = document.getElementById("clickActionPopup");
  const optToggleBrowserUI = document.getElementById("optToggleBrowserUI");
  const optToggleWebsites = document.getElementById("optToggleWebsites");
  const optThemeEngine = document.getElementById("optThemeEngine");
  const optAutoSchedule = document.getElementById("optAutoSchedule");
  const scheduleTimeContainer = document.getElementById("scheduleTimeContainer");
  const optDarkTime = document.getElementById("optDarkTime");
  const optLightTime = document.getElementById("optLightTime");
  const darkPresetsGrid = document.getElementById("darkPresetsGrid");
  const lightPresetsGrid = document.getElementById("lightPresetsGrid");
  const btnQuickTest = document.getElementById("btnQuickTest");
  const btnManageShortcuts = document.getElementById("btnManageShortcuts");
  const btnResetSettings = document.getElementById("btnResetSettings");
  const saveToast = document.getElementById("saveToast");

  let currentSettings = await globalThis.getSettings();

  // Populate UI
  populateUI(currentSettings);

  // Event Listeners for Changes
  clickActionToggle.addEventListener("change", () => saveSetting({ clickAction: "toggle" }));
  clickActionPopup.addEventListener("change", () => saveSetting({ clickAction: "popup" }));

  optToggleBrowserUI.addEventListener("change", (e) => saveSetting({ toggleBrowserUI: e.target.checked }));
  optToggleWebsites.addEventListener("change", (e) => saveSetting({ toggleWebsites: e.target.checked }));

  optThemeEngine.addEventListener("change", (e) => saveSetting({ themeEngine: e.target.value }));

  optAutoSchedule.addEventListener("change", (e) => {
    const val = e.target.value;
    scheduleTimeContainer.classList.toggle("hidden", val !== "time");
    saveSetting({ autoSchedule: val });
  });

  optDarkTime.addEventListener("change", (e) => saveSetting({ scheduleDarkTime: e.target.value }));
  optLightTime.addEventListener("change", (e) => saveSetting({ scheduleLightTime: e.target.value }));

  // Quick Test Switch
  btnQuickTest.addEventListener("click", async () => {
    await browser.runtime.sendMessage({ type: "TOGGLE_THEME" });
    showToast("Theme switched!");
  });

  // Manage Shortcuts
  btnManageShortcuts.addEventListener("click", () => {
    browser.tabs.create({ url: "about:addons" });
  });

  // Reset to Defaults
  btnResetSettings.addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset all Theme Switcher settings to defaults?")) {
      await browser.storage.local.clear();
      currentSettings = await globalThis.getSettings();
      populateUI(currentSettings);
      await browser.runtime.sendMessage({ type: "RELOAD_SETTINGS" });
      showToast("Reset to defaults!");
    }
  });

  /**
   * Save a partial setting change and update background
   */
  async function saveSetting(partial) {
    await globalThis.updateSettings(partial);
    currentSettings = await globalThis.getSettings();
    await browser.runtime.sendMessage({ type: "RELOAD_SETTINGS" });
    showToast();
  }

  /**
   * Populate UI from settings object
   */
  function populateUI(settings) {
    // Click action radios
    if (settings.clickAction === "popup") {
      clickActionPopup.checked = true;
    } else {
      clickActionToggle.checked = true;
    }

    // Update parent radio card classes
    updateRadioCardStyles();

    // Checkboxes
    optToggleBrowserUI.checked = settings.toggleBrowserUI;
    optToggleWebsites.checked = settings.toggleWebsites;

    // Dropdowns
    optThemeEngine.value = settings.themeEngine || "presets";
    optAutoSchedule.value = settings.autoSchedule || "disabled";
    scheduleTimeContainer.classList.toggle("hidden", settings.autoSchedule !== "time");

    // Times
    optDarkTime.value = settings.scheduleDarkTime || "20:00";
    optLightTime.value = settings.scheduleLightTime || "07:00";

    // Palette Grids
    renderPaletteGrid(darkPresetsGrid, "dark", settings.darkPreset, async (selectedId) => {
      await saveSetting({ darkPreset: selectedId });
      populateUI(currentSettings);
    });

    renderPaletteGrid(lightPresetsGrid, "light", settings.lightPreset, async (selectedId) => {
      await saveSetting({ lightPreset: selectedId });
      populateUI(currentSettings);
    });
  }

  function updateRadioCardStyles() {
    document.querySelectorAll(".radio-card").forEach(card => {
      const radio = card.querySelector("input[type=radio]");
      card.classList.toggle("active", radio && radio.checked);
    });
  }

  document.querySelectorAll("input[name=clickAction]").forEach(radio => {
    radio.addEventListener("change", updateRadioCardStyles);
  });

  /**
   * Render preset cards into grid container
   */
  function renderPaletteGrid(container, mode, activeId, onSelect) {
    container.innerHTML = "";
    const presets = globalThis.THEME_PRESETS[mode] || {};

    Object.values(presets).forEach(preset => {
      const card = document.createElement("div");
      card.className = `palette-card ${preset.id === activeId ? "active" : ""}`;

      // Mini browser window preview
      const miniWin = document.createElement("div");
      miniWin.className = "palette-mini-window";
      miniWin.style.backgroundColor = preset.preview.bg;

      const miniBar = document.createElement("div");
      miniBar.className = "mini-tab-bar";
      miniBar.style.backgroundColor = preset.preview.bar;

      const miniTab = document.createElement("div");
      miniTab.className = "mini-tab";
      miniTab.style.backgroundColor = preset.preview.bg;

      const miniContent = document.createElement("div");
      miniContent.className = "mini-content";

      const accentLine = document.createElement("div");
      accentLine.className = "mini-accent-line";
      accentLine.style.backgroundColor = preset.preview.accent;

      miniBar.appendChild(miniTab);
      miniContent.appendChild(accentLine);
      miniWin.appendChild(miniBar);
      miniWin.appendChild(miniContent);

      const name = document.createElement("div");
      name.className = "palette-name";
      name.textContent = preset.name;

      card.appendChild(miniWin);
      card.appendChild(name);

      card.addEventListener("click", () => onSelect(preset.id));

      container.appendChild(card);
    });
  }

  /**
   * Display toast notification
   */
  let toastTimer;
  function showToast(message = "Settings saved successfully!") {
    saveToast.textContent = message;
    saveToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      saveToast.classList.remove("show");
    }, 2200);
  }
});
