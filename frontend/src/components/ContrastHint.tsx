import { AA_NORMAL_TEXT, bestTextColour } from '@/lib/contrast';

// Shows how readable text is on the chosen accent colour.
export function ContrastHint({ colour }: { colour: string }) {
  const best = bestTextColour(colour);
  if (!best) return null;

  const ok = best.ratio >= AA_NORMAL_TEXT;
  const ratio = best.ratio.toFixed(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className="rounded-2xl px-4 py-2 text-sm font-bold"
        style={{ backgroundColor: colour, color: best.colour }}
      >
        Preview
      </span>
      <p className={`text-sm ${ok ? 'text-charcoal/80' : 'font-medium text-red-800'}`}>
        {ok
          ? `Good contrast (${ratio}:1) with ${best.colour === '#FFFFFF' ? 'white' : 'dark'} text.`
          : `Low contrast (${ratio}:1). Text may be hard to read. Try a darker or lighter colour.`}
      </p>
    </div>
  );
}
