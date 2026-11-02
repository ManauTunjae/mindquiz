import type { CSSProperties } from 'react';
import { bestTextColour } from './contrast';

const DEFAULT_ACCENT = '#FF7A00';

// Turns the accent colour of a campaign into CSS variables. Put them on a wrapper element
// and everything inside uses the campaign colour instead of the default orange.
// - on-primary: white or dark text, whichever is easier to read on the accent colour
// - primary-soft: a light version of the accent (for the selected answer)
export function accentStyle(accent: string): CSSProperties {
  const colour = /^#[0-9a-f]{6}$/i.test(accent) ? accent : DEFAULT_ACCENT;
  const text = bestTextColour(colour)?.colour ?? '#1E1E1E';

  return {
    '--color-primary': colour,
    '--color-on-primary': text,
    '--color-primary-soft': `color-mix(in srgb, ${colour} 16%, white)`,
  } as CSSProperties;
}
