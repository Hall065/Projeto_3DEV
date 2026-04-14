type Theme = 'dark' | 'light';

interface BackgroundDotsProps {
  theme: Theme;
}

const DOTS = [
  { x: 4,  y: 8  }, { x: 14, y: 22 }, { x: 28, y: 6  }, { x: 42, y: 14 },
  { x: 58, y: 4  }, { x: 72, y: 18 }, { x: 88, y: 10 }, { x: 96, y: 28 },
  { x: 7,  y: 42 }, { x: 19, y: 55 }, { x: 33, y: 47 }, { x: 50, y: 38 },
  { x: 65, y: 50 }, { x: 80, y: 42 }, { x: 94, y: 55 }, { x: 11, y: 68 },
  { x: 24, y: 80 }, { x: 38, y: 72 }, { x: 52, y: 85 }, { x: 68, y: 76 },
  { x: 83, y: 88 }, { x: 96, y: 72 }, { x: 3,  y: 90 }, { x: 45, y: 60 },
  { x: 76, y: 62 }, { x: 30, y: 92 }, { x: 60, y: 92 }, { x: 88, y: 95 },
  { x: 16, y: 35 }, { x: 55, y: 25 }, { x: 85, y: 30 },
];

const RED_DOTS_DARK = [2, 7, 14, 20, 25];
const BRIGHT_DOTS_LIGHT = [0, 5, 12, 18, 26];

const CONNECT_THRESHOLD = 22;

function buildLines() {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < DOTS.length; i++) {
    for (let j = i + 1; j < DOTS.length; j++) {
      const d1 = DOTS[i], d2 = DOTS[j];
      const dist = Math.sqrt((d1.x - d2.x) ** 2 + (d1.y - d2.y) ** 2);
      if (dist < CONNECT_THRESHOLD) {
        lines.push({ x1: d1.x, y1: d1.y, x2: d2.x, y2: d2.y });
      }
    }
  }
  return lines;
}

const LINES = buildLines();

export function BackgroundDots({ theme }: BackgroundDotsProps) {
  const isDark = theme === 'dark';

  const dotColor     = isDark ? 'rgba(220,220,220,0.45)' : 'rgba(255,255,255,0.35)';
  const accentColor  = isDark ? '#CC0000'                : 'rgba(255,200,200,0.75)';
  const lineColor    = isDark ? 'rgba(200,200,200,0.10)' : 'rgba(255,255,255,0.12)';
  const accentSet    = isDark ? RED_DOTS_DARK : BRIGHT_DOTS_LIGHT;

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      {LINES.map((l, i) => (
        <line
          key={i}
          x1={`${l.x1}`} y1={`${l.y1}`}
          x2={`${l.x2}`} y2={`${l.y2}`}
          stroke={lineColor}
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {DOTS.map((d, i) => {
        const isAccent = accentSet.includes(i);
        return (
          <circle
            key={i}
            cx={`${d.x}`}
            cy={`${d.y}`}
            r={isAccent ? '0.9' : '0.45'}
            fill={isAccent ? accentColor : dotColor}
          />
        );
      })}
    </svg>
  );
}
