'use strict';

class ImageCardRenderer {
  constructor(favs) {
    this._favs = favs;
  }

  renderEmpty() {
    return '<div class="empty-state"><div class="empty-icon-wrap">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35">'
      + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'
      + '</svg></div><span class="empty-label">Скопируйте изображение</span></div>';
  }

  renderGrid(items, tab) {
    return '<div class="img-grid">' + items.map(i => this._card(i, tab)).join('') + '</div>';
  }

  renderSidebarItem(item, tab) {
    const isFav = this._favs.has(item.id);
    const delFn = tab === 'favorites' ? 'removeFav' : 'deleteItem';
    return '<div class="sidebar-img-item" onclick="App.scrollToCard(' + item.id + ')">'
      + '<img class="si-thumb" src="' + item.dataUrl + '" draggable="false">'
      + '<div class="si-img-meta">'
      + '<span class="si-img-dim">' + item.width + '×' + item.height + '</span>'
      + '<button class="si-del" onclick="event.stopPropagation();App.' + delFn + '(' + item.id + ')">'
      + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button></div></div>';
  }

  _card(item, tab) {
    const isFav = this._favs.has(item.id);
    const delFn = tab === 'favorites' ? 'removeFav' : 'deleteItem';
    return '<div class="img-card' + (isFav ? ' starred' : '') + '" id="card-' + item.id + '">'
      + '<div class="img-wrap" onclick="App.openImage(' + item.id + ')">'
      + '<img class="img-thumb" src="' + item.dataUrl + '" draggable="false">'
      + '<div class="img-overlay">'
      + '<button class="img-action-btn" onclick="event.stopPropagation();App.copyImageItem(' + item.id + ')" title="Копировать">'
      + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
      + '</button>'
      + '<button class="img-action-btn" onclick="event.stopPropagation();App.openImage(' + item.id + ')" title="Открыть">'
      + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
      + '</button>'
      + '</div></div>'
      + '<div class="img-meta">'
      + '<span class="img-time">' + item.date + ' ' + item.time + '</span>'
      + '<span class="img-dim">' + item.width + '×' + item.height + '</span>'
      + '<div class="img-btns">'
      + '<button class="star-btn' + (isFav ? ' active' : '') + '" onclick="App.toggleFav(' + item.id + ')">' + (isFav ? '★' : '☆') + '</button>'
      + '<button class="del-btn" onclick="App.' + delFn + '(' + item.id + ')">'
      + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button></div></div></div>';
  }
}
