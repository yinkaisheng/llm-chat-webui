import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import mk from '@iktakahiro/markdown-it-katex';
import DOMPurify from 'dompurify';
import { t } from './i18n';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});
md.use(mk);

md.renderer.rules.fence = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const lang = token.info.trim();
  const content = token.content;

  let highlightedContent = '';
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlightedContent = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value;
    } catch (__) {
      highlightedContent = md.utils.escapeHtml(content);
    }
  } else {
    highlightedContent = md.utils.escapeHtml(content);
  }

  const encodedContent = encodeURIComponent(content);
  const copyBtn = `<button class="code-copy-btn" data-code="${encodedContent}">${t('copyCode')}</button>`;
  const headerHtml = `<div class="code-block-header"><span>${lang || 'code'}</span>${copyBtn}</div>`;

  return `${headerHtml}<pre class="hljs"><code>${highlightedContent}</code></pre>`;
};

export function parseMarkdown(content) {
  const rawHtml = md.render(content);
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-code'] });
}
