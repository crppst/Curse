const { clipboard, nativeImage } = require('electron');

class ClipboardManager {
  constructor(settingsManager) {
    this.history   = [];
    this._lastText = '';
    this._lastImg  = '';
    this._timer    = null;
    this._onChange = null;
    this.maxItems  = 100;
    this._settings = settingsManager;
  }

  loadHistory() {
    if (this._settings && this._settings.settings.useLocalStorage) {
      this.history = this._settings.loadHistory();
      return this.history;
    }
    return [];
  }

  _saveHistory() {
    if (this._settings) {
      this._settings.saveHistory(this.history);
    }
  }

  start(onChange) {
    this._onChange = onChange;
    this._timer = setInterval(() => this._poll(), 500);
  }

  stop() { clearInterval(this._timer); }

  _ts() {
    return {
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    };
  }

  _poll() {
    const img = clipboard.readImage();
    if (!img.isEmpty()) {
      const { width, height } = img.getSize();
      const hash = width + 'x' + height + ':' + img.toDataURL().slice(-32);
      if (hash !== this._lastImg) {
        this._lastImg  = hash;
        this._lastText = '';
        const dataUrl  = img.toDataURL();
        const type     = dataUrl.startsWith('data:image/gif') ? 'gif' : 'image';
        this._push({ type, dataUrl, width, height });
        return;
      }
    }

    const text = clipboard.readText();
    if (!text || text === this._lastText || !text.trim()) return;
    this._lastText = text;
    this._lastImg  = '';
    this._push({ type: 'text', text });
  }

  _push(data) {
    const item = { id: Date.now(), ...data, ...this._ts() };
    this.history = this.history.filter(i =>
      data.type === 'text' ? i.text !== data.text : i.dataUrl !== data.dataUrl
    );
    this.history.unshift(item);
    if (this.history.length > this.maxItems) this.history.pop();
    this._saveHistory();
    this._onChange?.(this.history);
  }

  copy(text) { clipboard.writeText(text); this._lastText = text; }

  copyImage(dataUrl) {
    clipboard.writeImage(nativeImage.createFromDataURL(dataUrl));
    this._lastImg = '';
  }

  delete(id) {
    this.history = this.history.filter(i => i.id !== id);
    this._saveHistory();
    return this.history;
  }

  clear() { 
    this.history = []; 
    this._saveHistory();
    this._onChange?.(this.history);
    return this.history; 
  }

  clearWithoutSave() {
    this.history = [];
    this._onChange?.(this.history);
    return this.history;
  }

  clearByType(type) {
    this.history = this.history.filter(i => i.type !== type);
    this._saveHistory();
    return this.history;
  }

  getAll() { return this.history; }
}

module.exports = ClipboardManager;
