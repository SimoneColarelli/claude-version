(function (root, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YogisLegalMarkdown = api;

  if (typeof document === 'undefined') return;

  const initialise = () => api.initialiseDocuments(document);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_MARKDOWN_LENGTH = 100000;

  function inlineTokens(value) {
    const text = String(value || '');
    const tokens = [];
    const pattern = /\*\*([^*\n]+)\*\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > cursor) tokens.push({ type: 'text', value: text.slice(cursor, match.index) });

      if (match[1] !== undefined) {
        tokens.push({ type: 'strong', value: match[1] });
      } else {
        tokens.push({ type: 'link', value: match[2], href: match[3] });
      }

      cursor = pattern.lastIndex;
    }

    if (cursor < text.length) tokens.push({ type: 'text', value: text.slice(cursor) });
    return tokens;
  }

  function parseMarkdown(markdown) {
    const lines = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push({ type: 'paragraph', lines: paragraph.map(line => inlineTokens(line)) });
      paragraph = [];
    };

    const flushList = () => {
      if (!list.length) return;
      blocks.push({ type: 'list', items: list.map(item => inlineTokens(item)) });
      list = [];
    };

    lines.forEach(rawLine => {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'heading', level: heading[1].length, content: inlineTokens(heading[2]) });
        return;
      }

      const listItem = /^[-*]\s+(.+)$/.exec(line);
      if (listItem) {
        flushParagraph();
        list.push(listItem[1]);
        return;
      }

      flushList();
      paragraph.push(line);
    });

    flushParagraph();
    flushList();
    return blocks;
  }

  function plainText(tokens) {
    return tokens.map(token => token.value).join('');
  }

  function safeLinkUrl(value, baseUrl) {
    try {
      const url = new URL(value, baseUrl);
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return null;
      return url;
    } catch (_error) {
      return null;
    }
  }

  function appendInline(target, tokens, baseUrl) {
    tokens.forEach(token => {
      if (token.type === 'strong') {
        const strong = document.createElement('strong');
        strong.textContent = token.value;
        target.append(strong);
        return;
      }

      if (token.type === 'link') {
        const url = safeLinkUrl(token.href, baseUrl);
        if (!url) {
          target.append(document.createTextNode(token.value));
          return;
        }

        const link = document.createElement('a');
        link.href = url.href;
        link.textContent = token.value;
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          link.rel = 'noopener noreferrer';
          if (url.origin !== window.location.origin) link.target = '_blank';
        }
        target.append(link);
        return;
      }

      target.append(document.createTextNode(token.value));
    });
  }

  function renderBlocks(blocks, baseUrl) {
    const fragment = document.createDocumentFragment();
    let title = '';

    blocks.forEach(block => {
      if (block.type === 'heading') {
        if (block.level === 1 && !title) {
          title = plainText(block.content);
          return;
        }

        const heading = document.createElement(block.level === 3 ? 'h3' : 'h2');
        appendInline(heading, block.content, baseUrl);
        fragment.append(heading);
        return;
      }

      if (block.type === 'list') {
        const list = document.createElement('ul');
        block.items.forEach(item => {
          const listItem = document.createElement('li');
          appendInline(listItem, item, baseUrl);
          list.append(listItem);
        });
        fragment.append(list);
        return;
      }

      const paragraph = document.createElement('p');
      block.lines.forEach((line, index) => {
        if (index > 0) paragraph.append(document.createElement('br'));
        appendInline(paragraph, line, baseUrl);
      });
      fragment.append(paragraph);
    });

    return { fragment, title };
  }

  function sourceUrl(element) {
    const source = element.dataset.markdownSource || '';
    const url = new URL(source, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/content/') || !url.pathname.endsWith('.md')) {
      throw new Error('invalid_markdown_source');
    }
    return url;
  }

  function showError(element, source) {
    const message = document.createElement('p');
    message.className = 'legal-error';
    message.textContent = 'Il documento non è temporaneamente disponibile. ';

    if (source) {
      const link = document.createElement('a');
      link.href = source.href;
      link.textContent = 'Apri la versione testuale.';
      message.append(link);
    }

    element.replaceChildren(message);
    element.setAttribute('aria-busy', 'false');
  }

  async function initialiseDocument(element) {
    let source;

    try {
      source = sourceUrl(element);
      const response = await fetch(source.href, {
        headers: { Accept: 'text/markdown, text/plain;q=0.9' },
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('markdown_unavailable');

      const markdown = await response.text();
      if (!markdown || markdown.length > MAX_MARKDOWN_LENGTH) throw new Error('invalid_markdown_length');

      const rendered = renderBlocks(parseMarkdown(markdown), source.href);
      if (!rendered.title || !rendered.fragment.childNodes.length) throw new Error('empty_markdown_document');

      const page = element.closest('[data-legal-page]');
      const title = page && page.querySelector('[data-markdown-title]');
      if (title) title.textContent = rendered.title;
      document.title = 'Yogis - Studio Yoga a L\'Aquila';

      element.replaceChildren(rendered.fragment);
      element.setAttribute('aria-busy', 'false');
    } catch (_error) {
      showError(element, source);
    }
  }

  function initialiseDocuments(scope) {
    scope.querySelectorAll('[data-markdown-source]').forEach(initialiseDocument);
  }

  return {
    inlineTokens,
    parseMarkdown,
    safeLinkUrl,
    initialiseDocuments
  };
}));
