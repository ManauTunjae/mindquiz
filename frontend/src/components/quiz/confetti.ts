// Confetti in the colours of the app: the accent colour of the campaign and the palette.
const PALETTE = ['#FF7A00', '#FFE3CC', '#1E1E1E'];

export async function fireConfetti(accent: string) {
  // No confetti for visitors who want less motion. (canvas-confetti is told the same below.)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Loaded only now, so the quiz page does not get heavier for the confetti.
  const { default: confetti } = await import('canvas-confetti');

  const colors = [...new Set(/^#[0-9a-f]{6}$/i.test(accent) ? [accent, ...PALETTE] : PALETTE)];
  const base = { colors, disableForReducedMotion: true, ticks: 220, gravity: 0.9, scalar: 1 };

  confetti({ ...base, particleCount: 70, spread: 70, origin: { x: 0.5, y: 0.65 } });
  setTimeout(() => {
    confetti({ ...base, particleCount: 40, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confetti({ ...base, particleCount: 40, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
  }, 180);
}
