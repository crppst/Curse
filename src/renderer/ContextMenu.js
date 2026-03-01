'use strict';

class ContextMenu {
  constructor() {
    this._el  = null;
    this._id  = null;
    this._cbs = {};
  }

  init(onCopy, onStar, onDelete) {
    this._el  = document.getElementById('ctxMenu');
    this._cbs = { copy: onCopy, star: onStar, delete: onDelete };

    document.getElementById('ctxCopyBtn').addEventListener('click',   () => { this._cbs.copy(this._id);   this.hide(); });
    document.getElementById('ctxStarBtn').addEventListener('click',   () => { this._cbs.star(this._id);   this.hide(); });
    document.getElementById('ctxDeleteBtn').addEventListener('click', () => { this._cbs.delete(this._id); this.hide(); });
    document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu')) this.hide(); });
  }

  show(e, id, isFav) {
    e.preventDefault();
    e.stopPropagation();
    this._id = id;
    document.getElementById('ctxStarLabel').textContent = isFav ? 'Убрать из избранного' : 'В избранное';
    this._el.style.left = Math.min(e.clientX, window.innerWidth  - 190) + 'px';
    this._el.style.top  = Math.min(e.clientY, window.innerHeight - 130) + 'px';
    this._el.classList.add('visible');
  }

  hide() {
    this._el?.classList.remove('visible');
  }
}
