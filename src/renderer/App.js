'use strict';

const App = (() => {
  const { ipcRenderer } = require('electron');

  let history    = [];
  let currentTab = 'history-text';
  let query      = '';

  const favs     = new FavoritesStore();
  const cards    = new CardRenderer(favs);
  const imgCards = new ImageCardRenderer(favs);
  const setts    = new SettingsPage(ipcRenderer);
  const ctxMenu  = new ContextMenu();

  const TOP_TABS = ['history', 'favorites', 'settings'];
  const ALL_TABS = ['history-text', 'history-image', 'favorites-text', 'favorites-image', 'settings'];

  async function init() {
    await setts.init();
    ipcRenderer.invoke('get-history').then(h => { 
      history = h || []; 
      render(); 
    });
    ipcRenderer.on('clipboard-updated', (_, h) => { history = h || []; render(); });
    ipcRenderer.on('clear-favorites', () => { 
      favs.clear(); 
      render(); 
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      query = e.target.value.toLowerCase();
      render();
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (setts.isRecording()) { setts.handleKeydown(e); return; }
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('searchInput').focus(); }
      if (e.key === 'Escape') { ctxMenu.hide(); closeViewer(); }
    });

    ctxMenu.init(
      id => copyItem(id),
      id => { const item = _find(id); if (item) { favs.toggle(item); render(); } },
      id => { _isFavTab() ? removeFav(id) : deleteItem(id); }
    );

    render();
  }

  function _isFavTab()   { return currentTab.startsWith('favorites-'); }
  function _isImageTab() { return currentTab.endsWith('-image'); }

  function switchTab(tab) {
    currentTab = tab;
    query = '';
    document.getElementById('searchInput').value = '';

    TOP_TABS.forEach(t => {
      const el = document.getElementById('tab-' + t);
      if (el) el.classList.toggle('active', tab === t || tab.startsWith(t + '-'));
    });

    const histSubs = document.getElementById('histSubTabs');
    const favSubs  = document.getElementById('favSubTabs');

    if (histSubs) {
      histSubs.style.display = tab.startsWith('history-') ? 'flex' : 'none';
      ['text','image'].forEach(t =>
        document.getElementById('hist-sub-' + t)?.classList.toggle('active', tab === 'history-' + t)
      );
    }
    if (favSubs) {
      favSubs.style.display = tab.startsWith('favorites-') ? 'flex' : 'none';
      ['text','image'].forEach(t =>
        document.getElementById('fav-sub-' + t)?.classList.toggle('active', tab === 'favorites-' + t)
      );
    }

    const layout      = document.getElementById('mainLayout');
    const settingsPage = document.getElementById('settingsPage');

    if (tab === 'settings') {
      layout.style.display = 'none';
      settingsPage.classList.add('visible');
      setts.stopRecording();
      return;
    }

    layout.style.display = 'flex';
    settingsPage.classList.remove('visible');
    document.getElementById('searchArea').style.display = _isImageTab() ? 'none' : '';
    document.getElementById('clearBtn').style.display   = _isFavTab()   ? 'none' : '';
    document.getElementById('sidebar-label').textContent = _isFavTab() ? 'Сохранённые' : 'Недавние';

    render();
  }

  function render() {
    const textItems  = history.filter(i => i.type === 'text');
    const imageItems = history.filter(i => i.type === 'image');
    const favTexts   = favs.items.filter(i => i.type === 'text');
    const favImages  = favs.items.filter(i => i.type === 'image');

    document.getElementById('count-history').textContent   = textItems.length + imageItems.length;
    document.getElementById('count-favorites').textContent = favs.count();

    if (currentTab === 'settings') return;

    if (currentTab === 'history-image') {
      document.getElementById('countDisplay').textContent = imageItems.length;
      _setSidebar(imageItems.map(i => imgCards.renderSidebarItem(i, 'history-image')));
      document.getElementById('detail').innerHTML = imageItems.length
        ? imgCards.renderGrid(imageItems, 'history-image') : imgCards.renderEmpty();
      return;
    }

    if (currentTab === 'history-text') {
      const filtered = query ? textItems.filter(i => i.text?.toLowerCase().includes(query)) : textItems;
      document.getElementById('countDisplay').textContent = filtered.length;
      _setSidebar(filtered.map(i => cards.renderSidebarItem(i, 'history-text')));
      document.getElementById('detail').innerHTML = filtered.length
        ? filtered.map((i, idx) => cards.renderCard(i, idx, 'history-text', query)).join('')
        : cards.renderEmpty('history-text', !!query);
      return;
    }

    if (currentTab === 'favorites-image') {
      document.getElementById('countDisplay').textContent = favImages.length;
      _setSidebar(favImages.map(i => imgCards.renderSidebarItem(i, 'favorites-image')));
      document.getElementById('detail').innerHTML = favImages.length
        ? imgCards.renderGrid(favImages, 'favorites-image') : imgCards.renderEmpty();
      return;
    }

    if (currentTab === 'favorites-text') {
      const filtered = query ? favTexts.filter(i => i.text?.toLowerCase().includes(query)) : favTexts;
      document.getElementById('countDisplay').textContent = filtered.length;
      _setSidebar(filtered.map(i => cards.renderSidebarItem(i, 'favorites-text')));
      document.getElementById('detail').innerHTML = filtered.length
        ? filtered.map((i, idx) => cards.renderCard(i, idx, 'favorites-text', query)).join('')
        : cards.renderEmpty('favorites-text', !!query);
      return;
    }
  }

  function _setSidebar(parts) {
    document.getElementById('sidebarList').innerHTML = parts.length
      ? parts.join('')
      : '<div style="padding:5px 8px;font-size:12px;color:var(--text-muted)">Пусто</div>';
  }

  function openImage(id) {
    const item = _find(id);
    if (!item?.dataUrl) return;
    App._viewerId = id;
    document.getElementById('imgViewerImg').src = item.dataUrl;
    document.getElementById('imgViewerDim').textContent = item.width + ' × ' + item.height + ' px';
    document.getElementById('imgViewer').classList.add('visible');
  }

  function closeViewer() {
    document.getElementById('imgViewer')?.classList.remove('visible');
  }

  function copyItem(id) {
    const item = _find(id);
    if (!item) return;
    ipcRenderer.send('copy-item', item.text);
    _flash(id);
  }

  function copyImageItem(id) {
    const item = _find(id);
    if (!item?.dataUrl) return;
    ipcRenderer.send('copy-image', item.dataUrl);
    _flash(id);
  }

  function _flash(id) {
    const el = document.getElementById('card-' + id);
    el?.classList.add('just-copied');
    setTimeout(() => el?.classList.remove('just-copied'), 900);
  }

  function toggleFav(id)    { const i = _find(id); if (i) { favs.toggle(i); render(); } }
  function removeFav(id)    { favs.remove(id); render(); }
  function deleteItem(id)   { cards._expanded.delete(id); ipcRenderer.send('delete-item', id); }
  function clearCurrent()   {
    if (currentTab === 'history-text')  { cards._expanded.clear(); ipcRenderer.send('clear-all'); }
    if (currentTab === 'history-image') ipcRenderer.send('clear-by-type', 'image');
  }
  function toggleExpand(id) { cards.toggleExpand(id); render(); }
  function saveNote(id, n)  { favs.updateNote(id, n); }
  function scrollToCard(id) { document.getElementById('card-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function closeApp()       { ipcRenderer.send('close-window'); }
  function minimize()       { ipcRenderer.send('minimize-window'); }
  function _find(id)        { return history.find(i => i.id === id) || favs.items.find(i => i.id === id); }

  return {
    init, switchTab,
    copyItem, copyImageItem, openImage, closeViewer,
    toggleFav, removeFav, deleteItem,
    clearCurrent, toggleExpand, saveNote, scrollToCard,
    closeApp, minimize,
    saveSettings:        () => setts.save(),
    startRecording:      () => setts.startRecording(),
    showClearCacheDialog:  () => setts.showClearCacheDialog(),
    hideClearCacheDialog:  () => setts.hideClearCacheDialog(),
    confirmClearCache:   () => setts.confirmClearCache()
  };
})();

App.init();
