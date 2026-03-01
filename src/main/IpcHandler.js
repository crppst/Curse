const { ipcMain } = require('electron');

class IpcHandler {
  constructor(clipboard, settings, window_) {
    this._cb = clipboard;
    this._st = settings;
    this._wn = window_;
  }

  register() {
    const { _cb, _st, _wn } = this;

    ipcMain.on('copy-item',       (_, text)    => _cb.copy(text));
    ipcMain.on('copy-image',      (_, dataUrl) => _cb.copyImage(dataUrl));
    ipcMain.on('delete-item',     (_, id)      => _wn.send('clipboard-updated', _cb.delete(id)));
    ipcMain.on('clear-all',       ()           => _wn.send('clipboard-updated', _cb.clear()));
    ipcMain.on('clear-by-type',   (_, type)    => _wn.send('clipboard-updated', _cb.clearByType(type)));
    ipcMain.on('close-window',    ()           => _wn.hide());
    ipcMain.on('minimize-window', ()           => _wn.minimize());

    ipcMain.handle('get-history',  () => _cb.getAll());
    ipcMain.handle('get-settings', () => _st.get());

    ipcMain.handle('save-settings', (_, data) => {
      const hotkeyChanged = data.hotkey && data.hotkey !== _st.get('hotkey');
      const storageChanged = data.useLocalStorage !== undefined && 
                             data.useLocalStorage !== _st.get('useLocalStorage');
      
      _st.save(data);

      if (hotkeyChanged) {
        const ok = _st.registerHotkey(data.hotkey, () => _wn.toggle());
        if (!ok) {
          _st.save({ hotkey: 'Ctrl+Shift+V' });
          _st.registerHotkey('Ctrl+Shift+V', () => _wn.toggle());
          return { ok: false, error: 'Горячая клавиша занята', settings: _st.get() };
        }
      }

      if (data.silentStart !== undefined) _st.setAutostart(data.silentStart);

      if (storageChanged) {
        if (data.useLocalStorage) {
          _st.saveHistory(_cb.getAll());
        } else {
          _st.clearHistory();
        }
      }

      return { ok: true, settings: _st.get() };
    });

    ipcMain.handle('get-cache-size', () => _st.getCacheSize());
    ipcMain.handle('get-app-size', () => _st.getAppSize());
    ipcMain.handle('clear-cache', (_, { clearHistory, clearFavorites }) => {
      if (clearHistory) {
        _cb.clearWithoutSave();
        _st.clearCache();
      }
      
      if (clearFavorites) {
        _wn.send('clear-favorites');
      }
      
      return { ok: true };
    });
  }
}

module.exports = IpcHandler;
