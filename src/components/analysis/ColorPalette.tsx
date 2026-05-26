import type { Color } from '@/types/analysis';

interface Props {
  colors: Color[];
}

export function ColorPalette({ colors }: Props) {
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color, index) => (
        <div key={`${color.hex}-${index}`} className="flex flex-col items-center text-xs">
          <div
            className="h-12 w-12 rounded border"
            style={{ backgroundColor: color.hex }}
            aria-label={`${color.hex} - ${color.role}`}
          />
          <span className="mt-1 font-mono">{color.hex}</span>
          <span className="text-gray-600">{color.role}</span>
        </div>
      ))}
    </div>
  );
}
