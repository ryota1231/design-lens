import type { Color } from '@/types/analysis';

interface Props {
  colors: Color[];
}

export function ColorPalette({ colors }: Props) {
  if (colors.length === 0) return null;

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {colors.map((color, index) => (
        <div
          key={`${color.hex}-${index}`}
          className="flex min-w-0 items-start gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-sm"
        >
          <div
            className="h-12 w-12 shrink-0 rounded-xl border border-stone-200"
            style={{ backgroundColor: color.hex }}
            aria-label={`${color.hex} - ${color.role}`}
          />
          <div className="min-w-0">
            <span className="block font-mono text-stone-950">{color.hex}</span>
            <span className="block leading-6 break-words text-stone-600">{color.role}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
