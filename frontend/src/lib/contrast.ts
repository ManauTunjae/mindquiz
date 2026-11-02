// WCAG contrast helpers. Ratio 4.5 is the AA minimum for normal text.

const WHITE = '#FFFFFF';
const CHARCOAL = '#1E1E1E';
export const AA_NORMAL_TEXT = 4.5;

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  if (!a || !b) return null;
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// Picks white or dark text, whichever is easier to read on this background.
export function bestTextColour(background: string): { colour: string; ratio: number } | null {
  const onWhite = contrastRatio(background, WHITE);
  const onDark = contrastRatio(background, CHARCOAL);
  if (onWhite === null || onDark === null) return null;
  return onWhite > onDark ? { colour: WHITE, ratio: onWhite } : { colour: CHARCOAL, ratio: onDark };
}
