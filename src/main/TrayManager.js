const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor() {
    this.tray = null;
  }

  create(onToggle, onQuit) {
    const icon = nativeImage
      .createFromPath(path.join(__dirname, '../../icon.png'))
      .resize({ width: 16, height: 16 });

    this.tray = new Tray(icon);
    this.tray.setToolTip('Curse');
    this.tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Открыть', click: onToggle },
      { type: 'separator' },
      { label: 'Выход',   click: onQuit }
    ]));
    this.tray.on('click', onToggle);
  }
}

module.exports = TrayManager;
