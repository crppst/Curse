'use strict';

class FavoritesStore {
  constructor() {
    this._key  = 'curse_favorites';
    this.items = this._load();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; }
  }

  _save() {
    try { localStorage.setItem(this._key, JSON.stringify(this.items)); } catch {}
  }

  has(id)    { return this.items.some(f => f.id === id); }
  count()    { return this.items.length; }

  add(item) {
    if (this.has(item.id)) return;
    this.items.unshift({ ...item, note: '' });
    this._save();
  }

  remove(id) {
    this.items = this.items.filter(f => f.id !== id);
    this._save();
  }

  toggle(item) {
    this.has(item.id) ? this.remove(item.id) : this.add(item);
  }

  updateNote(id, note) {
    const item = this.items.find(f => f.id === id);
    if (item) { item.note = note; this._save(); }
  }

  clear() {
    this.items = [];
    this._save();
  }
}
