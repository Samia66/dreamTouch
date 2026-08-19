// Positions fixes (deterministes) pour 20 points, evite tout mismatch
// d'hydratation SSR/CSR. Chaque point represente un des 20 participants;
// les lignes qui s'allument evoquent le pilier CONNECT.
const POINTS: [number, number][] = [
  [8, 22], [18, 55], [26, 12], [34, 70], [41, 34], [49, 8], [55, 58], [62, 24],
  [69, 78], [75, 41], [82, 16], [88, 62], [15, 82], [22, 38], [31, 92], [46, 88],
  [58, 90], [66, 6], [91, 34], [95, 80]
];

const LINKS: [number, number][] = [
  [0, 4], [1, 8], [2, 5], [3, 9], [4, 7], [6, 10], [7, 11], [9, 12],
  [10, 18], [12, 15], [13, 16], [14, 17], [16, 19], [5, 17], [8, 11], [2, 6]
];

export function Constellation({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {LINKS.map(([a, b], i) => {
        const [x1, y1] = POINTS[a]!;
        const [x2, y2] = POINTS[b]!;
        return (
          <line
            key={`l-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#D9B25C"
            strokeWidth="0.12"
            opacity="0.25"
            className="animate-pulseGlow"
            style={{ animationDelay: `${(i % 7) * 0.6}s` }}
          />
        );
      })}
      {POINTS.map(([x, y], i) => (
        <circle
          key={`p-${i}`}
          cx={x}
          cy={y}
          r={i % 5 === 0 ? 0.9 : 0.55}
          fill={i % 5 === 0 ? "#EFD79A" : "#8B8894"}
          opacity="0.8"
        />
      ))}
    </svg>
  );
}
