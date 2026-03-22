import { ref } from 'vue';
import lightThemeCss from 'highlight.js/styles/github.min.css?raw';
import darkThemeCss from 'highlight.js/styles/github-dark.min.css?raw';

export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'light');

  const applyHljsTheme = (t) => {
    let styleEl = document.getElementById('dynamic-hljs-theme');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-hljs-theme';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = t === 'dark' ? darkThemeCss : lightThemeCss;
  };

  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', theme.value);
    applyHljsTheme(theme.value);
  };

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', theme.value);
    document.documentElement.setAttribute('data-theme', theme.value);
    applyHljsTheme(theme.value);
  };

  return {
    theme,
    toggleTheme,
    initTheme
  };
}
