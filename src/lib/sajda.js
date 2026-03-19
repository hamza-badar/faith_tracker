export const SAJDA_BUTTONS = [9, 13, 14, 15, 16, 17, 19, 19, 21, 23, 24, 27, 30, 30];

function formatJuzList(values) {
  if (values.length === 0) return '';
  if (values.length === 1) return `${values[0]}`;
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
}

export function getUncheckedSajdaJuz(pressed = [], recitedJuz = 0) {
  const pressedSet = new Set(Array.isArray(pressed) ? pressed.filter((n) => Number.isInteger(n)) : []);

  return SAJDA_BUTTONS.filter((juz, idx) => juz <= recitedJuz && !pressedSet.has(idx));
}

export function formatUncheckedSajdaReminder(missingJuz = []) {
  if (missingJuz.length === 0) return '';
  return `Please make sure to Sajda for Juz ${formatJuzList(missingJuz)}`;
}
