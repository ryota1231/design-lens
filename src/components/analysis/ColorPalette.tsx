import type { Color } from '@/types/analysis';

interface Props {
  colors: Color[];
}

export function ColorPalette({ colors }: Props) {
  if (colors.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {colors.map((color, index) => (
        <div
          key={`${color.hex}-${index}`}
          className="flex items-center gap-3 rounded-md border border-stone-200 bg-white p-3 text-xs"
        >
          <div
            className="h-11 w-11 shrink-0 rounded-md border border-stone-200"
            style={{ backgroundColor: color.hex }}
            aria-label={`${color.hex} - ${color.role}`}
          />
          <div className="min-w-0">
            <span className="block font-mono text-stone-950">{color.hex}</span>
            <span className="block truncate text-stone-600">{color.role}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
