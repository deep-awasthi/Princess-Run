class SettingsManager {
  static getSettings() {
    return StorageManager.load().settings;
  }

  static saveSettings(newSettings) {
    const data = StorageManager.load();
    data.settings = { ...data.settings, ...newSettings };
    StorageManager.save(data);
    this.applySettings(data.settings);
  }

  static applySettings(settings) {
    // 1. Theme class on body
    document.body.className = ''; // Reset
    if (settings.theme) {
      document.body.classList.add(`theme-${settings.theme}`);
    }

    // 2. High Contrast
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    }

    // 3. Reduced Motion
    if (settings.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
  }

  static initialize() {
    const settings = this.getSettings();
    this.applySettings(settings);
  }
}
window.SettingsManager = SettingsManager;
