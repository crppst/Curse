'use strict';

class SettingsPage {
  constructor(ipc) {
    this._ipc          = ipc;
    this._settings     = {};
    this._pendingKey   = null;
    this._isRecording  = false;
  }

  async init() {
    this._settings = await this._ipc.invoke('get-settings');
    this._applyToUI(this._settings);
  }

  _applyToUI(s) {
    this._pendingKey = null;
    this._el('hotkeyDisplay').textContent = s.hotkey || 'Ctrl+Shift+V';
    this._el('silentStartToggle').checked = !!s.silentStart;
    this._el('localStorageToggle').checked = !!s.useLocalStorage;
    this._el('hotkeyTip').innerHTML = '<kbd>' + (s.hotkey || 'Ctrl+Shift+V') + '</kbd>';
    this._hint('Нажми, чтобы изменить');
    this._updateStorageInfo();
  }

  async _updateStorageInfo() {
    const cacheSize = await this._ipc.invoke('get-cache-size');
    const appSize = await this._ipc.invoke('get-app-size');
    this._el('cacheSize').textContent = cacheSize;
    this._el('appSize').textContent = appSize;
  }

  startRecording() {
    this._isRecording = true;
    this._el('hotkeyDisplay').classList.add('recording');
    this._el('hotkeyDisplay').textContent = 'Нажми сочетание...';
    this._hint('Нажми Escape для отмены');
  }

  stopRecording() {
    this._isRecording = false;
    this._el('hotkeyDisplay').classList.remove('recording');
    this._el('hotkeyDisplay').textContent = this._pendingKey || this._settings.hotkey || 'Ctrl+Shift+V';
    this._hint(this._pendingKey ? 'Нажми «Сохранить» чтобы применить' : 'Нажми, чтобы изменить');
  }

  handleKeydown(e) {
    if (!this._isRecording) return false;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') { this.stopRecording(); return true; }
    if (['Control','Shift','Alt','Meta'].includes(e.key)) return true;

    const parts = [];
    if (e.ctrlKey)  parts.push('Ctrl');
    if (e.altKey)   parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    const keyMap = { ' ': 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' };
    parts.push(keyMap[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key));

    if (parts.length < 2) { this._hint('Нужно хотя бы 2 клавиши'); return true; }

    this._pendingKey = parts.join('+');
    this._el('hotkeyDisplay').textContent = this._pendingKey;
    this.stopRecording();
    return true;
  }

  isRecording() { return this._isRecording; }

  async save() {
    const result = await this._ipc.invoke('save-settings', {
      hotkey:          this._pendingKey || this._settings.hotkey,
      silentStart:     this._el('silentStartToggle').checked,
      useLocalStorage: this._el('localStorageToggle').checked
    });

    if (result.ok) {
      this._settings = result.settings;
      this._applyToUI(this._settings);
      this._status('Настройки сохранены', 'ok');
    } else {
      this._status(result.error || 'Ошибка сохранения', 'err');
      if (result.settings) { this._settings = result.settings; this._applyToUI(this._settings); }
    }

    setTimeout(() => this._status('', ''), 3000);
  }

  _el(id)   { return document.getElementById(id); }
  _hint(msg){ const el = this._el('hotkeyHint'); if (el) el.textContent = msg; }

  showClearCacheDialog() {
    const dialog = document.getElementById('cacheDialog');
    if (dialog) {
      dialog.classList.add('visible');

      const historyCb = document.getElementById('clearHistoryOption');
      const favsCb = document.getElementById('clearFavoritesOption');
      if (historyCb) historyCb.checked = true;
      if (favsCb) favsCb.checked = false;
    }
  }

  hideClearCacheDialog() {
    const dialog = document.getElementById('cacheDialog');
    if (dialog) dialog.classList.remove('visible');
  }

  async confirmClearCache() {
    const clearHistory = document.getElementById('clearHistoryOption')?.checked;
    const clearFavorites = document.getElementById('clearFavoritesOption')?.checked;

    if (!clearHistory && !clearFavorites) {
      this.hideClearCacheDialog();
      return;
    }

    this.hideClearCacheDialog();

    const result = await this._ipc.invoke('clear-cache', { clearHistory, clearFavorites });
    if (result.ok) {
      this._status('Кеш очищен', 'ok');
      this._updateStorageInfo();
    } else {
      this._status(result.error || 'Ошибка очистки кеша', 'err');
    }
    setTimeout(() => this._status('', ''), 3000);
  }

  _status(msg, type) {
    const el = this._el('settingsStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'settings-status' + (type ? ' ' + type : '');
  }
}
