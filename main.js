const { app } = require('electron');

app.setAppUserModelId('com.thousandcursedenemies.curse');
app.setName('Curse');

const ClipboardManager = require('./src/main/ClipboardManager');
const SettingsManager  = require('./src/main/SettingsManager');
const WindowManager    = require('./src/main/WindowManager');
const TrayManager      = require('./src/main/TrayManager');
const IpcHandler       = require('./src/main/IpcHandler');

const settings  = new SettingsManager();
const clipboard = new ClipboardManager(settings);
const window_   = new WindowManager();
const tray      = new TrayManager();
const ipc       = new IpcHandler(clipboard, settings, window_);

app.whenReady().then(() => {
  window_.create();
  ipc.register();
  tray.create(() => window_.toggle(), () => app.exit(0));
  clipboard.loadHistory();
  clipboard.start(history => window_.send('clipboard-updated', history));
  settings.registerHotkey(settings.get('hotkey'), () => window_.toggle());
  if (!settings.get('silentStart')) window_.show();
});

app.on('will-quit', () => settings.unregisterHotkeys());
