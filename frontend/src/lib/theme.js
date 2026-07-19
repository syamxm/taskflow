const THEME_KEY = 'taskflow-theme';

export const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'pink', label: 'Light Pink' },
];

export function getTheme() {
  return document.documentElement.dataset.theme === 'pink' ? 'pink' : 'dark';
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage blocked — theme still applies for this session */
  }
}
