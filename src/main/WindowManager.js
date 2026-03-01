const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.win = null;
  }

  create() {
    this.win = new BrowserWindow({
      width: 720, height: 680,
      minWidth: 500, minHeight: 400,
      frame: false, resizable: true,
      show: false,
      backgroundColor: '#262624',
      icon: path.join(__dirname, '../../icon.ico'),
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    this.win.loadFile(path.join(__dirname, '../../index.html'));
    this.win.on('close', e => { e.preventDefault(); this.hide(); });
  }

  show()     { this.win?.show(); this.win?.focus(); }
  hide()     { this.win?.hide(); }
  minimize() { this.win?.minimize(); }

  toggle() {
    this.win?.isVisible() && this.win?.isFocused() ? this.hide() : this.show();
  }

  send(channel, ...args) {
    if (this.win && !this.win.isDestroyed())
      this.win.webContents.send(channel, ...args);
  }
}

module.exports = WindowManager;
