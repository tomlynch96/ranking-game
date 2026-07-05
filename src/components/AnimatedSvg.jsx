// Hand-drawn animated SVG set. All motion is CSS keyframes on transform and
// opacity only (compositor-friendly), driven by classes in styles.css, and
// disabled globally via prefers-reduced-motion. Parts that move are wrapped
// in their own <g> so CSS transforms never fight SVG positioning attributes.

const STROKE = '#1d0f3d';

export function PencilSvg({ size = 130 }) {
  return (
    <svg className="asvg" width={size} height={size} viewBox="0 0 130 130" aria-hidden>
      <path
        className="pencil-trail"
        d="M18 104 q14 -12 28 0 t28 0 t28 0"
        fill="none" stroke="#ffe14d" strokeWidth="5" strokeLinecap="round"
      />
      <g className="pencil-body">
        <rect x="56" y="18" width="18" height="52" rx="4" fill="#ffb03a" stroke={STROKE} strokeWidth="4" />
        <rect x="56" y="10" width="18" height="12" rx="4" fill="#ff4d9d" stroke={STROKE} strokeWidth="4" />
        <polygon points="56,70 74,70 65,92" fill="#fdf6ff" stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
        <polygon points="61,81 69,81 65,92" fill={STROKE} />
      </g>
    </svg>
  );
}

export function BallotSvg({ size = 130 }) {
  return (
    <svg className="asvg" width={size} height={size} viewBox="0 0 130 130" aria-hidden>
      <g className="ballot-paper">
        <rect x="47" y="12" width="36" height="44" rx="4" fill="#fdf6ff" stroke={STROKE} strokeWidth="4" />
        <line x1="55" y1="24" x2="75" y2="24" stroke="#b9a9e8" strokeWidth="4" strokeLinecap="round" />
        <line x1="55" y1="34" x2="75" y2="34" stroke="#b9a9e8" strokeWidth="4" strokeLinecap="round" />
        <path d="M55 45 l5 5 l10 -11" fill="none" stroke="#3ee6c4" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="ballot-box">
        <rect x="25" y="62" width="80" height="52" rx="8" fill="#ff4d9d" stroke={STROKE} strokeWidth="4" />
        <rect x="25" y="62" width="80" height="14" rx="7" fill="#ff77b5" stroke={STROKE} strokeWidth="4" />
        <rect x="50" y="66" width="30" height="6" rx="3" fill={STROKE} />
        <circle cx="65" cy="96" r="9" fill="#ffe14d" stroke={STROKE} strokeWidth="4" />
      </g>
    </svg>
  );
}

export function DrumrollSvg({ size = 120 }) {
  return (
    <svg className="asvg" width={size} height={size * 0.92} viewBox="0 0 140 128" aria-hidden>
      {/* impact sparks, flashing in time with the sticks */}
      <g className="drum-spark drum-spark-l">
        <path d="M44 34 l3 7 M38 40 l7 3 M36 30 l5 5" stroke="#ffe14d" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className="drum-spark drum-spark-r">
        <path d="M96 34 l-3 7 M102 40 l-7 3 M104 30 l-5 5" stroke="#ffe14d" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* sticks: chunky, rotating around the grip end */}
      <g className="drum-stick-l">
        <line x1="14" y1="8" x2="50" y2="42" stroke="#ffb03a" strokeWidth="8" strokeLinecap="round" />
        <line x1="14" y1="8" x2="50" y2="42" stroke="#e08b1d" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <circle cx="52" cy="44" r="7.5" fill="#fdf6ff" stroke={STROKE} strokeWidth="3.5" />
      </g>
      <g className="drum-stick-r">
        <line x1="126" y1="8" x2="90" y2="42" stroke="#ffb03a" strokeWidth="8" strokeLinecap="round" />
        <line x1="126" y1="8" x2="90" y2="42" stroke="#e08b1d" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <circle cx="88" cy="44" r="7.5" fill="#fdf6ff" stroke={STROKE} strokeWidth="3.5" />
      </g>
      <g className="drum-body">
        {/* cylindrical shell with a curved bottom edge */}
        <path
          d="M30 62 v40 a40 14 0 0 0 80 0 v-40"
          fill="#ff4d9d" stroke={STROKE} strokeWidth="4.5" strokeLinejoin="round"
        />
        {/* bottom hoop */}
        <path d="M30 96 a40 14 0 0 0 80 0" fill="none" stroke="#c22f74" strokeWidth="5" />
        {/* zig-zag lacing */}
        <path
          d="M34 70 L48 96 L56 68 L70 98 L84 68 L92 96 L106 70"
          fill="none" stroke="#ffe14d" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"
        />
        {/* tension lugs */}
        <circle cx="34" cy="70" r="3.5" fill="#ffe14d" stroke={STROKE} strokeWidth="2.5" />
        <circle cx="56" cy="68" r="3.5" fill="#ffe14d" stroke={STROKE} strokeWidth="2.5" />
        <circle cx="84" cy="68" r="3.5" fill="#ffe14d" stroke={STROKE} strokeWidth="2.5" />
        <circle cx="106" cy="70" r="3.5" fill="#ffe14d" stroke={STROKE} strokeWidth="2.5" />
        {/* drum head with inner ring for depth */}
        <ellipse cx="70" cy="62" rx="40" ry="14" fill="#fdf6ff" stroke={STROKE} strokeWidth="4.5" />
        <ellipse cx="70" cy="62" rx="30" ry="9.5" fill="none" stroke="#d9cbf2" strokeWidth="3" />
      </g>
    </svg>
  );
}

export function TrophySvg({ size = 140 }) {
  return (
    <svg className="asvg" width={size} height={size} viewBox="0 0 130 130" aria-hidden>
      <g className="trophy-rock">
        <path d="M30 22 h-12 a4 4 0 0 0 -4 4 c0 16 8 24 18 26" fill="none" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <path d="M100 22 h12 a4 4 0 0 1 4 4 c0 16 -8 24 -18 26" fill="none" stroke={STROKE} strokeWidth="6" strokeLinecap="round" />
        <path d="M30 16 h70 v22 a35 35 0 0 1 -70 0 z" fill="#ffe14d" stroke={STROKE} strokeWidth="4.5" strokeLinejoin="round" />
        <path className="trophy-shine" d="M44 20 l-8 46" stroke="#fdf6ff" strokeWidth="7" strokeLinecap="round" opacity="0.8" />
        <path d="M65 30 l4.7 9.6 10.6 1.5 -7.7 7.5 1.8 10.5 -9.4 -5 -9.4 5 1.8 -10.5 -7.7 -7.5 10.6 -1.5 z"
          fill="#ff4d9d" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
        <rect x="57" y="86" width="16" height="12" fill="#ffb03a" stroke={STROKE} strokeWidth="4" />
        <rect x="42" y="97" width="46" height="12" rx="4" fill="#ff4d9d" stroke={STROKE} strokeWidth="4" />
      </g>
      <g className="trophy-spark trophy-spark-1">
        <path d="M0 -8 Q1.5 -1.5 8 0 Q1.5 1.5 0 8 Q-1.5 1.5 -8 0 Q-1.5 -1.5 0 -8" fill="#fdf6ff" transform="translate(20 30)" />
      </g>
      <g className="trophy-spark trophy-spark-2">
        <path d="M0 -8 Q1.5 -1.5 8 0 Q1.5 1.5 0 8 Q-1.5 1.5 -8 0 Q-1.5 -1.5 0 -8" fill="#3ee6c4" transform="translate(112 44)" />
      </g>
    </svg>
  );
}

export function PodiumSvg({ size = 150 }) {
  return (
    <svg className="asvg" width={size} height={size * 0.73} viewBox="0 0 150 110" aria-hidden>
      <g className="podium-bar podium-bar-2">
        <rect x="8" y="55" width="42" height="55" rx="5" fill="#3ee6c4" stroke={STROKE} strokeWidth="4" />
        <text x="29" y="88" textAnchor="middle" fontSize="26" fontWeight="800" fill={STROKE} fontFamily="'Baloo 2', sans-serif">2</text>
      </g>
      <g className="podium-bar podium-bar-1">
        <rect x="54" y="32" width="42" height="78" rx="5" fill="#ffe14d" stroke={STROKE} strokeWidth="4" />
        <text x="75" y="70" textAnchor="middle" fontSize="26" fontWeight="800" fill={STROKE} fontFamily="'Baloo 2', sans-serif">1</text>
      </g>
      <g className="podium-bar podium-bar-3">
        <rect x="100" y="70" width="42" height="40" rx="5" fill="#ff4d9d" stroke={STROKE} strokeWidth="4" />
        <text x="121" y="97" textAnchor="middle" fontSize="26" fontWeight="800" fill={STROKE} fontFamily="'Baloo 2', sans-serif">3</text>
      </g>
      <g className="podium-star">
        <path d="M75 2 l4.2 8.6 9.5 1.4 -6.9 6.7 1.6 9.4 -8.4 -4.4 -8.4 4.4 1.6 -9.4 -6.9 -6.7 9.5 -1.4 z"
          fill="#ffb03a" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// One-shot star burst for exact hits. Positioned absolutely by the parent.
export function SparkleBurstSvg({ size = 180 }) {
  const spark = 'M0 -11 Q2 -2 11 0 Q2 2 0 11 Q-2 2 -11 0 Q-2 -2 0 -11';
  const spots = [
    [30, 30, '#ffe14d'], [150, 26, '#3ee6c4'], [90, 12, '#ff4d9d'],
    [20, 100, '#ff4d9d'], [160, 105, '#ffe14d'], [60, 140, '#3ee6c4'],
    [125, 145, '#ffb03a'], [90, 165, '#fdf6ff'],
  ];
  return (
    <svg className="asvg sparkle-burst" width={size} height={size} viewBox="0 0 180 180" aria-hidden>
      {spots.map(([x, y, fill], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g className="sparkle-bit" style={{ animationDelay: `${i * 0.09}s` }}>
            <path d={spark} fill={fill} />
          </g>
        </g>
      ))}
    </svg>
  );
}

export function SadCloudSvg({ size = 90 }) {
  return (
    <svg className="asvg" width={size} height={size * 0.9} viewBox="0 0 110 100" aria-hidden>
      <g className="cloud-bob">
        <path
          d="M28 52 a16 16 0 0 1 6 -31 a20 20 0 0 1 38 -5 a15 15 0 0 1 8 36 z"
          fill="#b9a9e8" stroke={STROKE} strokeWidth="4" strokeLinejoin="round"
        />
        <circle cx="42" cy="34" r="3" fill={STROKE} />
        <circle cx="60" cy="34" r="3" fill={STROKE} />
        <path d="M44 45 q7 -6 14 0" fill="none" stroke={STROKE} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g className="rain-drop rain-drop-1"><line x1="34" y1="62" x2="30" y2="74" stroke="#3ee6c4" strokeWidth="5" strokeLinecap="round" /></g>
      <g className="rain-drop rain-drop-2"><line x1="55" y1="62" x2="51" y2="74" stroke="#3ee6c4" strokeWidth="5" strokeLinecap="round" /></g>
      <g className="rain-drop rain-drop-3"><line x1="76" y1="62" x2="72" y2="74" stroke="#3ee6c4" strokeWidth="5" strokeLinecap="round" /></g>
    </svg>
  );
}

export function DevilSvg({ size = 84 }) {
  return (
    <svg className="asvg" width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <g className="devil-wiggle">
        <polygon points="24,34 16,10 38,26" fill="#ff6b6b" stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
        <polygon points="76,34 84,10 62,26" fill="#ff6b6b" stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="50" cy="56" r="34" fill="#ff6b6b" stroke={STROKE} strokeWidth="4" />
        <g className="devil-eyes">
          <circle cx="38" cy="50" r="5" fill={STROKE} />
          <circle cx="62" cy="50" r="5" fill={STROKE} />
        </g>
        <path d="M34 68 q16 14 32 0 l-6 3 q-10 6 -20 0 z" fill={STROKE} />
      </g>
    </svg>
  );
}
