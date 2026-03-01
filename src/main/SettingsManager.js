const { app, globalShortcut } = require('electron');
const fs   = require('fs');
const path = require('path');

const DEFAULTS = { hotkey: 'Ctrl+Shift+V', silentStart: false, useLocalStorage: false };

class SettingsManager {
  constructor() {
    this._path    = path.join(app.getPath('userData'), 'settings.json');
    this._historyPath = path.join(app.getPath('userData'), 'history.json');
    this.settings = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this._path))
        return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(this._path, 'utf8')) };
    } catch {}
    return { ...DEFAULTS };
  }

  save(data) {
    Object.assign(this.settings, data);
    try { fs.writeFileSync(this._path, JSON.stringify(this.settings, null, 2)); } catch {}
  }

  get(key) {
    return key ? this.settings[key] : this.settings;
  }

  registerHotkey(hotkey, cb) {
    globalShortcut.unregisterAll();
    try { return globalShortcut.register(hotkey, cb); } catch { return false; }
  }

  unregisterHotkeys() {
    globalShortcut.unregisterAll();
  }

  setAutostart(enabled) {
    app.setLoginItemSettings({
      openAtLogin:    enabled,
      openAsHidden:   true,
      name:           'Curse',
      executableName: 'Curse'
    });
  }

  saveHistory(history) {
    if (!this.settings.useLocalStorage) return;
    try {
      fs.writeFileSync(this._historyPath, JSON.stringify(history, null, 2));
    } catch {}
  }

  loadHistory() {
    try {
      if (fs.existsSync(this._historyPath)) {
        return JSON.parse(fs.readFileSync(this._historyPath, 'utf8'));
      }
    } catch {}
    return [];
  }

  clearHistory() {
    try {
      if (fs.existsSync(this._historyPath)) {
        fs.unlinkSync(this._historyPath);
      }
    } catch {}
  }

  getCacheSize() {
    try {
      let totalSize = 0;
      const userDataPath = app.getPath('userData');
      const files = fs.readdirSync(userDataPath);
      for (const file of files) {
        const filePath = path.join(userDataPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
      return this._formatSize(totalSize);
    } catch {
      return '0 B';
    }
  }

  clearCache() {
    try {
      const userDataPath = app.getPath('userData');
      const files = fs.readdirSync(userDataPath);
      for (const file of files) {
        if (file === 'settings.json') continue; // Keep settings
        const filePath = path.join(userDataPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
        }
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  getAppSize() {
    try {
      const exePath = app.getPath('exe');
      const appDir = path.dirname(exePath);
      return this._formatSize(this._getFolderSize(appDir));
    } catch {
      return '0 B';
    }
  }

  _getFolderSize(folderPath) {
    let totalSize = 0;
    try {
      const items = fs.readdirSync(folderPath);
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          totalSize += this._getFolderSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {}
    return totalSize;
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
  }
}

module.exports = SettingsManager;
