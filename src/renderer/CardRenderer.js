'use strict';

class CardRenderer {
  constructor(favs) {
    this._favs       = favs;
    this._expanded   = new Set();
    this.COLLAPSE_AT = 220;
  }

  toggleExpand(id) {
    this._expanded.has(id) ? this._expanded.delete(id) : this._expanded.add(id);
  }

  renderEmpty(tab, hasQuery) {
    const msgs = {
      text:      hasQuery ? 'Ничего не найдено' : 'Скопируйте что-нибудь',
      favorites: hasQuery ? 'Ничего не найдено' : 'Добавьте записи в избранное ★'
    };
    const icons = {
      favorites: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      text:      '<rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/>'
    };
    return '<div class="empty-state"><div class="empty-icon-wrap">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35">'
      + (icons[tab] || icons.text) + '</svg></div>'
      + '<span class="empty-label">' + (msgs[tab] || msgs.text) + '</span></div>';
  }

  renderCard(item, index, tab, query) {
    const isFav  = this._favs.has(item.id);
    const isExp  = this._expanded.has(item.id);
    const isMd   = MarkdownRenderer.isMarkdown(item.text);
    const isLong = item.text.length > this.COLLAPSE_AT;
    const delFn  = tab === 'favorites' ? 'removeFav' : 'deleteItem';

    let h = '<div class="detail-card' + (isFav ? ' starred' : '') + '" id="card-' + item.id + '" onclick="App.copyItem(' + item.id + ')">';

    h += '<div class="card-header"><div class="card-meta">'
      + '<span>' + (item.date || '') + '</span><span>' + item.time + '</span>'
      + (index === 0 && !query && tab === 'text' ? '<span class="badge-new">Новое</span>' : '')
      + (isMd ? '<span class="badge-md">MD</span>' : '')
      + '</div><div class="card-actions">'
      + '<button class="star-btn' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();App.toggleFav(' + item.id + ')">' + (isFav ? '★' : '☆') + '</button>'
      + '<button class="del-btn" onclick="event.stopPropagation();App.' + delFn + '(' + item.id + ')">'
      + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button></div></div>';

    if (isMd && !isExp) {
      h += '<div class="card-text md-rendered' + (isLong ? ' collapsed' : '') + '">' + MarkdownRenderer.render(item.text) + '</div>';
    } else if (isMd && isExp) {
      h += '<div class="card-text raw-source">' + this._esc(item.text) + '</div>';
    } else {
      const txt = query ? this._highlight(this._esc(item.text), query) : this._esc(item.text);
      h += '<div class="card-text' + (isLong && !isExp ? ' collapsed' : '') + '">' + txt + '</div>';
    }

    if (tab === 'favorites') {
      h += '<textarea class="fav-note" rows="2" placeholder="Заметка..." onclick="event.stopPropagation()" onchange="App.saveNote(' + item.id + ',this.value)">' + this._esc(item.note || '') + '</textarea>';
    }

    if (isLong || isMd) {
      const label = isMd
        ? (isExp ? 'Скрыть исходник' : 'Показать исходник')
        : (isExp ? 'Свернуть' : 'Показать полностью · ' + item.text.length + ' симв.');
      const chevron = isExp
        ? '<path d="m18 15-6-6-6 6"/>'
        : '<path d="m6 9 6 6 6-6"/>';
      h += '<button class="expand-toggle" onclick="event.stopPropagation();App.toggleExpand(' + item.id + ')">'
        + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + chevron + '</svg> ' + label
        + '</button>';
    } else {
      h += '<div class="char-label">' + item.text.length + ' симв.</div>';
    }

    return h + '</div>';
  }

  renderSidebarItem(item, tab) {
    const delFn = tab === 'favorites' ? 'removeFav' : 'deleteItem';
    return '<div class="sidebar-item" onclick="App.scrollToCard(' + item.id + ')">'
      + '<span class="si-text">' + this._esc(item.text.replace(/\s+/g, ' ').trim()) + '</span>'
      + '<button class="si-del" onclick="event.stopPropagation();App.' + delFn + '(' + item.id + ')">'
      + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      + '</button></div>';
  }

  _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  _highlight(html, q) {
    return html.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'), m => '<mark>' + m + '</mark>');
  }
}
