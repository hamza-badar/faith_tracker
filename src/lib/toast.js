/** Long enough to read which Juz need Sajda Tilawat. */
export const SAJDA_REMINDER_TOAST_DURATION_MS = 6000;

export function getOppositeThemeToastStyle() {
  const s = getComputedStyle(document.documentElement);
  const bg = s.getPropertyValue('--opposite-theme-background').trim();
  const fg = s.getPropertyValue('--opposite-theme-foreground').trim();
  return {
    borderRadius: '16px',
    background: `hsl(${bg})`,
    color: `hsl(${fg})`,
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
  };
}
