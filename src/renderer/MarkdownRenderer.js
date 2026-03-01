'use strict';

class MarkdownRenderer {
  static isMarkdown(text) {
    return /```[\s\S]*?```/.test(text)
      || /^#{1,6}\s/m.test(text)
      || /\*\*[^*]+\*\*/.test(text)
      || /\*[^*]+\*/.test(text)
      || /`[^`]+`/.test(text)
      || /^\s*[-*+]\s/m.test(text)
      || /^\s*\d+\.\s/m.test(text)
      || /^\s*>\s/m.test(text)
      || /\[.+?\]\(.+?\)/.test(text)
      || /^---+$/m.test(text);
  }

  static render(text) {
    let h = this._esc(text);

    h = h.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) =>
      '<div class="md-code-block"><div class="md-code-header">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
      + (lang.trim() ? '<span class="md-code-lang">' + lang.trim() + '</span>' : '')
      + '</div><pre class="md-pre"><code>' + code.replace(/\n$/, '') + '</code></pre></div>'
    );

    h = h.replace(/`([^`\n]+)`/g, '<code class="md-inline-code">$1</code>');

    [6,5,4,3,2,1].forEach(n =>
      h = h.replace(new RegExp('^#{' + n + '}\\s(.+)$', 'gm'), `<h${n} class="md-h">$1</h${n}>`)
    );

    h = h.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    h = h.replace(/\*\*([^*]+)\*\*/g,     '<strong>$1</strong>');
    h = h.replace(/\*([^*\n]+)\*/g,       '<em>$1</em>');
    h = h.replace(/^&gt;\s?(.+)$/gm,      '<blockquote class="md-blockquote">$1</blockquote>');
    h = h.replace(/^---+$/gm,             '<hr class="md-hr">');

    h = h.replace(/((?:^[ \t]*[-*+]\s.+\n?)+)/gm, m =>
      '<ul class="md-ul">' + m.trim().split('\n').map(l =>
        '<li>' + l.replace(/^[ \t]*[-*+]\s/, '').trim() + '</li>'
      ).join('') + '</ul>'
    );

    h = h.replace(/((?:^[ \t]*\d+\.\s.+\n?)+)/gm, m =>
      '<ol class="md-ol">' + m.trim().split('\n').map(l =>
        '<li>' + l.replace(/^[ \t]*\d+\.\s/, '').trim() + '</li>'
      ).join('') + '</ol>'
    );

    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link" title="$2">$1</span>');
    h = h.replace(/^(?!<[a-z]).+$/gm, l => '<p class="md-p">' + l + '</p>');
    h = h.replace(/\n{3,}/g, '\n\n');

    return h;
  }

  static _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
