import React from "react";

/**
 * Animated hero scenes: civic activities set in a Himachal hill town
 * (snow peaks, deodar forest, tin-roofed houses on the slope).
 * Pure SVG + SMIL, no external files. `still` renders the same scene without motion.
 *
 * Canvas: 1600 x 560 (object-fit: slice), action sits in the centre / right so the
 * headline on the left stays readable.
 */

const NAVY = "#14245a";
const ROAD_Y = 420;

const Ani = ({ still, ...p }) => (still ? null : <animate {...p} />);
const AniT = ({ still, ...p }) => (still ? null : <animateTransform {...p} />);

/* ---------------------------------------------------------------- backdrop */
const Tree = ({ x, y, s = 1, shade = "#174a3d" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <polygon points="0,-120 26,-70 12,-70 34,-30 14,-30 40,10 -40,10 -14,-30 -34,-30 -12,-70 -26,-70" fill={shade} />
    <rect x="-4" y="10" width="8" height="14" fill="#3b2a1e" />
  </g>
);

const House = ({ x, y, w = 70, h = 46, roof = "#c0392b", wall = "#f3e2c7" }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="0" y={-h} width={w} height={h} fill={wall} />
    <polygon points={`-6,${-h} ${w / 2},${-h - 26} ${w + 6},${-h}`} fill={roof} />
    <rect x={w * 0.18} y={-h * 0.62} width={w * 0.2} height={h * 0.34} fill="#3b4a7a" />
    <rect x={w * 0.6} y={-h * 0.62} width={w * 0.2} height={h * 0.34} fill="#3b4a7a" />
  </g>
);

const Backdrop = ({ still }) => (
  <g>
    <defs>
      <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0f1d52" />
        <stop offset="0.55" stopColor="#2b4bb8" />
        <stop offset="1" stopColor="#f7b27a" />
      </linearGradient>
      <linearGradient id="hs-road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#222c55" />
        <stop offset="1" stopColor="#141a38" />
      </linearGradient>
    </defs>
    <rect width="1600" height="560" fill="url(#hs-sky)" />
    <circle cx="1210" cy="330" r="150" fill="#ffd9a8" opacity="0.28" />
    <circle cx="1210" cy="330" r="70" fill="#ffe8c4" opacity="0.5" />

    <g transform="translate(0 -58)">
    {/* far peaks with snow */}
    <polygon points="0,380 150,230 260,320 420,170 560,300 700,210 860,330 1020,190 1180,310 1340,200 1480,300 1600,230 1600,420 0,420" fill="#3f55a8" opacity="0.9" />
    <polygon points="420,170 372,230 410,222 436,246 470,216" fill="#eaf0ff" />
    <polygon points="1020,190 972,252 1008,244 1040,270 1072,236" fill="#eaf0ff" />
    <polygon points="150,230 112,280 146,272 172,292 196,262" fill="#eaf0ff" />
    <polygon points="1340,200 1296,262 1330,254 1358,276 1388,244" fill="#eaf0ff" />
    {/* mid hills */}
    <polygon points="0,430 200,340 380,400 600,330 820,410 1040,340 1260,410 1450,350 1600,400 1600,480 0,480" fill="#223483" />

    {/* town on the right slope */}
    <polygon points="900,478 1100,360 1330,330 1600,300 1600,478" fill="#1c5a47" />
    <House x={1010} y={420} roof="#b8352b" />
    <House x={1100} y={392} w={60} h={42} roof="#2e7d6b" wall="#f6ead6" />
    <House x={1180} y={372} w={78} h={50} roof="#c0392b" />
    <House x={1290} y={352} w={64} h={44} roof="#8e44ad" wall="#f1e0c9" />
    <House x={1380} y={338} w={72} h={48} roof="#b8352b" />
    <House x={1470} y={324} w={60} h={40} roof="#2e7d6b" />

    {/* Pahari pagoda-style temple on the far ridge */}
    <g transform="translate(1545 318)">
      <rect x="-22" y="-34" width="44" height="34" fill="#e9d9bd" />
      <polygon points="-34,-34 0,-62 34,-34" fill="#7a2e2e" />
      <polygon points="-24,-62 0,-84 24,-62" fill="#7a2e2e" />
      <rect x="-3" y="-96" width="6" height="14" fill="#f5c542" />
    </g>
    </g>
    {/* deodar forest on the left and right */}
    {[40, 110, 180, 250].map((x, i) => (
      <Tree key={`l${i}`} x={x} y={ROAD_Y - 4 - (i % 2) * 14} s={0.9 + (i % 3) * 0.18} />
    ))}
    {[1010, 1540, 1580].map((x, i) => (
      <Tree key={`r${i}`} x={x} y={ROAD_Y - 6} s={1 + (i % 2) * 0.2} shade="#1b5243" />
    ))}

    {/* "Swachh Himachal" board by the road */}
    <g transform="translate(1040 382)">
      <rect x="-3" y="0" width="6" height="40" fill="#3b4a7a" />
      <rect x="-86" y="-40" width="172" height="44" rx="6" fill="#1f3a8a" stroke="#ffffff" strokeWidth="2" />
      <text x="0" y="-12" textAnchor="middle" fontFamily="Noto Sans Devanagari, Roboto, sans-serif" fontWeight="700" fontSize="19" fill="#ffffff">स्वच्छ हिमाचल</text>
    </g>
    {/* road */}
    <rect x="0" y={ROAD_Y} width="1600" height="150" fill="url(#hs-road)" />
    <rect x="0" y={ROAD_Y} width="1600" height="6" fill="#33406e" />
    {[...Array(14)].map((x, i) => (
      <rect key={i} x={i * 120 + 20} y={ROAD_Y + 38} width="62" height="6" rx="3" fill="#f5c542" opacity="0.8" />
    ))}
    {/* low cloud drifting */}
    <g opacity="0.55">
      <ellipse cx="0" cy="120" rx="150" ry="22" fill="#ffffff">
        <Ani still={still} attributeName="cx" values="-200;1800" dur="60s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="0" cy="80" rx="110" ry="16" fill="#ffffff">
        <Ani still={still} attributeName="cx" values="-300;1700" dur="80s" repeatCount="indefinite" />
      </ellipse>
    </g>
  </g>
);

/* ------------------------------------------------------------------ people */
/**
 * Indian characters. Origin is at the feet; the figure is ~175 tall.
 * - topi: Himachali (Pahari) cap, green crown with a maroon band
 * - woman: salwar-kameez with a dupatta over the head and a bindi
 */
const SKIN = ["#b98150", "#a8703f", "#c48e5c"];

const Person = ({ woman = false, topi = false, skinTone = 0, shirt = "#e9e3d8", vest, bottom = "#2b3a6b", dupatta = "#e5484d", scale = 1, flip = false, children }) => {
  const skin = SKIN[skinTone % SKIN.length];
  return (
    <g transform={`scale(${flip ? -scale : scale} ${scale})`}>
      {/* legs / salwar */}
      {woman ? (
        <g>
          <path d="M-20,-66 L20,-66 L24,-4 L-24,-4 Z" fill={bottom} />
          <rect x="-24" y="-8" width="20" height="10" rx="5" fill="#2a1a12" />
          <rect x="4" y="-8" width="20" height="10" rx="5" fill="#2a1a12" />
        </g>
      ) : (
        <g>
          <rect x="-14" y="-66" width="12" height="62" rx="5" fill={bottom} />
          <rect x="2" y="-66" width="12" height="62" rx="5" fill={bottom} />
          <rect x="-17" y="-6" width="17" height="9" rx="4" fill="#111827" />
          <rect x="0" y="-6" width="17" height="9" rx="4" fill="#111827" />
        </g>
      )}
      {/* torso: kameez / shirt */}
      <rect x="-21" y={woman ? -136 : -130} width="42" height={woman ? 78 : 70} rx="13" fill={shirt} />
      {vest && (
        <g>
          <rect x="-21" y="-130" width="42" height="70" rx="13" fill={vest} />
          <rect x="-21" y="-100" width="42" height="7" fill="#ffffff" opacity="0.85" />
          <rect x="-21" y="-82" width="42" height="5" fill="#ffffff" opacity="0.6" />
        </g>
      )}
      {/* head */}
      <circle cx="0" cy="-150" r="17" fill={skin} />
      {woman ? (
        <g>
          {/* hair + braid, dupatta over head and shoulders */}
          <path d="M-18,-152 Q0,-176 18,-152 L18,-140 L-18,-140 Z" fill="#1a1410" />
          <rect x="10" y="-142" width="8" height="50" rx="4" fill="#1a1410" />
          <path d="M-24,-146 Q0,-188 24,-146 L28,-110 Q0,-124 -28,-110 Z" fill={dupatta} opacity="0.92" />
          <circle cx="0" cy="-158" r="2.4" fill="#c1121f" />
        </g>
      ) : topi ? (
        <g>
          <path d="M-17,-158 Q0,-164 17,-158 L17,-150 L-17,-150 Z" fill="#1a1410" />
          <rect x="-19" y="-170" width="38" height="14" rx="4" fill="#8e1b2b" />
          <rect x="-17" y="-182" width="34" height="14" rx="5" fill="#1f6f43" />
          <path d="M-8,-142 Q0,-137 8,-142" stroke="#1a1410" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M-18,-154 Q0,-176 18,-154 L18,-146 L-18,-146 Z" fill="#1a1410" />
          <path d="M-8,-142 Q0,-137 8,-142" stroke="#1a1410" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {children}
    </g>
  );
};

/** hand holding a phone */
const PhoneInHand = () => (
  <g transform="translate(26 -118)">
    <rect x="0" y="0" width="30" height="46" rx="6" fill="#0b1230" />
    <rect x="3" y="4" width="24" height="36" rx="3" fill="#8fb4ff" />
  </g>
);

/* ============================================================= 1. sweeping */
const Broom = ({ still }) => (
  <g transform="translate(18 -112)">
    <AniT still={still} attributeName="transform" type="rotate" values="-8 0 0; 22 0 0; -8 0 0" dur="1s" additive="sum" repeatCount="indefinite" />
    <rect x="0" y="-6" width="64" height="11" rx="5" fill="#b98150" />
    <rect x="58" y="-4" width="6" height="104" rx="3" fill="#8b5a2b" transform="rotate(-18 61 -4)" />
    <path d="M44,92 L88,92 L98,118 L36,118 Z" fill="#c9a227" transform="rotate(-18 61 -4)" />
  </g>
);

const Sweeping = ({ still }) => (
  <g>
    <Backdrop still={still} />
    <g transform={`translate(0 ${ROAD_Y + 28})`}>
      {/* sweeper with a Himachali cap */}
      <g transform="translate(700 0)">
        <AniT still={still} attributeName="transform" type="translate" values="700 0; 1040 0; 700 0" dur="14s" repeatCount="indefinite" />
        <Person topi vest="#f47b20" shirt="#d9c9a3" skinTone={0}>
          <Broom still={still} />
        </Person>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={74 + i * 10} cy="-8" r="6" fill="#d9d3c7" opacity="0">
            <Ani still={still} attributeName="opacity" values="0;0.7;0" dur="1s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
            <Ani still={still} attributeName="cy" values="-4;-34" dur="1s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      {/* second sweeper (woman, dupatta) a few steps behind */}
      <g transform="translate(590 0)">
        <AniT still={still} attributeName="transform" type="translate" values="590 0; 930 0; 590 0" dur="14s" repeatCount="indefinite" />
        <Person woman vest="#f5c542" shirt="#2e7d6b" bottom="#e8ecf4" dupatta="#e5484d" skinTone={1} scale={0.95}>
          <Broom still={still} />
        </Person>
      </g>
    </g>
    {[760, 880, 1000].map((x, i) => (
      <ellipse key={i} cx={x} cy={ROAD_Y + 32 + (i % 2) * 10} rx="9" ry="4" fill={i % 2 ? "#c0752b" : "#d8a02b"} />
    ))}
  </g>
);

/* ========================================================= 2. collection */
/** Indian three-wheeler tipper ("garbage auto") */
const Tipper = () => (
  <g>
    <rect x="-170" y="-110" width="170" height="82" rx="8" fill="#2e8b57" />
    <rect x="-170" y="-110" width="170" height="14" rx="7" fill="#3fae6f" />
    <path d="M0,-96 L60,-96 Q86,-96 92,-70 L100,-28 L0,-28 Z" fill="#f5c542" />
    <path d="M18,-88 L56,-88 Q68,-88 72,-72 L72,-56 L18,-56 Z" fill="#bfe4f5" />
    <text x="-158" y="-60" fontFamily="Noto Sans Devanagari, Roboto, sans-serif" fontWeight="800" fontSize="22" fill="#ffffff">स्वच्छ हिमाचल</text>
    <text x="-158" y="-38" fontFamily="Roboto, sans-serif" fontWeight="600" fontSize="13" fill="#d9f2e4">Municipal Corporation</text>
    <rect x="-176" y="-30" width="282" height="10" rx="4" fill="#144d31" />
    {[-120, 52].map((x) => (
      <g key={x} transform={`translate(${x} -10)`}>
        <circle r="20" fill="#10151f" />
        <circle r="9" fill="#9aa4bd" />
      </g>
    ))}
  </g>
);

const Collection = ({ still }) => (
  <g>
    <Backdrop still={still} />
    {/* tipper rolls in, pauses, rolls out */}
    <g transform={`translate(0 ${ROAD_Y + 26})`}>
      <g transform="translate(1030 0)">
        <AniT still={still} attributeName="transform" type="translate" values="1900 0; 1030 0; 1030 0; -300 0" keyTimes="0;0.35;0.7;1" dur="12s" repeatCount="indefinite" />
        <Tipper />
      </g>
    </g>
    {/* kerbside bins */}
    {[700, 780].map((x, i) => (
      <g key={x} transform={`translate(${x} ${ROAD_Y + 4})`}>
        <rect x="-22" y="-52" width="44" height="52" rx="6" fill={i ? "#2563eb" : "#1e9e62"} />
        <rect x="-26" y="-60" width="52" height="10" rx="4" fill={i ? "#1d4ed8" : "#15803d"} />
      </g>
    ))}
    {/* collector (Himachali cap) walks to the bin, lifts it, returns */}
    <g transform={`translate(0 ${ROAD_Y + 30})`}>
      <g transform="translate(880 0)">
        <AniT still={still} attributeName="transform" type="translate" values="880 0; 810 0; 810 0; 880 0; 880 0" keyTimes="0;0.25;0.55;0.8;1" dur="12s" repeatCount="indefinite" />
        <Person topi vest="#f5c542" shirt="#d9c9a3" bottom="#394b78" skinTone={2} flip>
          <g transform="translate(-30 -104)">
            <rect x="-34" y="-4" width="40" height="10" rx="5" fill="#b98150" />
            <rect x="-62" y="-26" width="38" height="44" rx="6" fill="#1e9e62">
              <Ani still={still} attributeName="y" values="-26;-26;-62;-62;-26" keyTimes="0;0.4;0.55;0.7;1" dur="12s" repeatCount="indefinite" />
            </rect>
          </g>
        </Person>
      </g>
    </g>
    {/* helper (woman) with a bag, near the vehicle */}
    <g transform={`translate(${960} ${ROAD_Y + 32})`}>
      <Person woman shirt="#7b3fa0" bottom="#e8ecf4" dupatta="#f5c542" vest="#f47b20" skinTone={1} scale={0.95} />
    </g>
  </g>
);

/* ==================================================== phone-based scenes */
const Phone = ({ x = 900, y = 70, w = 250, h = 410, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="0" y="0" width={w} height={h} rx="34" fill="#0b1230" />
    <rect x="9" y="9" width={w - 18} height={h - 18} rx="26" fill="#ffffff" />
    <rect x={w / 2 - 34} y="14" width="68" height="9" rx="4.5" fill="#0b1230" />
    {children}
  </g>
);

const Check = ({ still, cx, cy, r = 28, begin = "0s", dur = "6s" }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#1e9e62" opacity="0">
      <Ani still={still} attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.4;0.5;0.9;1" dur={dur} begin={begin} repeatCount="indefinite" />
    </circle>
    <path d={`M${cx - r * 0.45},${cy} l${r * 0.3},${r * 0.35} l${r * 0.6},${-r * 0.7}`} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0">
      <Ani still={still} attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.45;0.52;0.9;1" dur={dur} begin={begin} repeatCount="indefinite" />
    </path>
  </g>
);

/* ============================================ 3. paying taxes online */
const PayTax = ({ still }) => (
  <g>
    <Backdrop still={still} />
    <g transform={`translate(690 ${ROAD_Y + 30})`}>
      <Person woman shirt="#d4326d" bottom="#f1f3f9" dupatta="#f5c542" skinTone={0} scale={0.95}>
        <PhoneInHand />
      </Person>
    </g>
    <g transform="scale(0.8)">
    <Phone x={925} y={118}>
      <text x="125" y="62" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="20" fill={NAVY}>Property Tax</text>
      <text x="125" y="86" textAnchor="middle" fontFamily="Roboto, sans-serif" fontSize="13" fill="#66708f">Shimla · 2025-26</text>
      <rect x="28" y="108" width="194" height="96" rx="16" fill="#e8f0ff" />
      <text x="125" y="140" textAnchor="middle" fontFamily="Roboto, sans-serif" fontSize="13" fill="#66708f">Amount payable</text>
      <text x="125" y="180" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="34" fill={NAVY}>₹ 4,820</text>
      {["UPI", "Card", "Net"].map((m, i) => (
        <g key={m}>
          <rect x={28 + i * 66} y="222" width="58" height="30" rx="15" fill={i === 0 ? "#1f3a8a" : "#eef1f8"} />
          <text x={57 + i * 66} y="242" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="12" fill={i === 0 ? "#fff" : "#66708f"}>{m}</text>
        </g>
      ))}
      <rect x="28" y="290" width="194" height="52" rx="26" fill="#f47b20">
        <Ani still={still} attributeName="fill" values="#f47b20;#f47b20;#1e9e62;#1e9e62;#f47b20" keyTimes="0;0.4;0.5;0.9;1" dur="6s" repeatCount="indefinite" />
      </rect>
      <text x="125" y="323" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="17" fill="#fff">Pay securely</text>
      <Check still={still} cx={125} cy={366} r={24} />
      <text x="125" y="388" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="12" fill="#1e9e62" opacity="0">
        Receipt sent
        <Ani still={still} attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.5;0.58;0.9;1" dur="6s" repeatCount="indefinite" />
      </text>
    </Phone>
    </g>
    {/* floating rupees */}
    {[0, 1, 2, 3].map((i) => (
      <text key={i} x={690 + i * 110} y="380" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="34" fill="#ffd27a" opacity="0">
        ₹
        <Ani still={still} attributeName="opacity" values="0;0.9;0" dur="3s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
        <Ani still={still} attributeName="y" values="400;220" dur="3s" begin={`${i * 0.7}s`} repeatCount="indefinite" />
      </text>
    ))}
  </g>
);

/* ================================================ 4. tracking dues */
const Dues = ({ still }) => {
  const rows = [
    { t: "Water charges", d: "Due 31 Oct", a: "₹ 1,850", w: 150, c: "#f47b20" },
    { t: "Garbage collection", d: "Due 05 Nov", a: "₹ 600", w: 96, c: "#2f6bff" },
    { t: "Trade licence", d: "Paid", a: "₹ 250", w: 60, c: "#1e9e62" },
  ];
  return (
    <g>
      <Backdrop still={still} />
      <g transform="translate(690 116) scale(0.7)">
        <rect width="560" height="360" rx="22" fill="#0b1230" />
        <rect x="10" y="10" width="540" height="340" rx="16" fill="#ffffff" />
        <text x="32" y="48" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="20" fill={NAVY}>My dues</text>
        <rect x="430" y="28" width="96" height="28" rx="14" fill="#fff1e5" />
        <text x="478" y="47" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="12" fill="#f47b20">3 pending</text>
        {rows.map((r, i) => (
          <g key={r.t} transform={`translate(32 ${80 + i * 72})`}>
            <rect width="496" height="58" rx="12" fill="#f5f7fc" />
            <text x="16" y="25" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="15" fill={NAVY}>{r.t}</text>
            <text x="16" y="45" fontFamily="Roboto, sans-serif" fontSize="12" fill="#66708f">{r.d}</text>
            <rect x="200" y="22" width="180" height="10" rx="5" fill="#e3e8f4" />
            <rect x="200" y="22" width="0" height="10" rx="5" fill={r.c}>
              <Ani still={still} attributeName="width" values={`0;${r.w};${r.w};0`} keyTimes="0;0.35;0.9;1" dur="6s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </rect>
            <text x="480" y="36" textAnchor="end" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="17" fill={NAVY}>{r.a}</text>
          </g>
        ))}
        <text x="32" y="322" fontFamily="Roboto, sans-serif" fontSize="13" fill="#66708f">Total pending</text>
        <text x="528" y="326" textAnchor="end" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="24" fill="#f47b20">₹ 2,450</text>
      </g>
      {/* citizen checking dues */}
      <g transform={`translate(1010 ${ROAD_Y + 30})`}>
        <Person topi shirt="#4a6fa5" bottom="#2b3a6b" skinTone={2} scale={0.95} flip>
          <PhoneInHand />
        </Person>
      </g>
      {/* notification bell pulse */}
      <g transform="translate(1040 112)">
        <circle r="26" fill="#f47b20">
          <Ani still={still} attributeName="r" values="26;32;26" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <path d="M-9,6 V-4 a9,9 0 0 1 18,0 V6 l4,4 h-26 z" fill="#fff" />
      </g>
    </g>
  );
};

/* ============================================ 5. online advertisements */
const VIS = ["1;1;0;0;0;1", "0;0;1;1;0;0", "0;0;0;0;1;0"]; // crossfade order of the three ad panels

const Advertising = ({ still }) => {
  const panels = [
    { l1: "Apply for hoarding", l2: "permission online", bg: "#1f3a8a" },
    { l1: "Pay the fee", l2: "UPI · Card · Net banking", bg: "#f47b20" },
    { l1: "Permission granted", l2: "Display from 1 Nov", bg: "#1e9e62" },
  ];
  return (
    <g>
      <Backdrop still={still} />
      {/* poles */}
      <rect x="700" y="232" width="14" height="190" fill="#3b4a7a" />
      <rect x="990" y="232" width="14" height="190" fill="#3b4a7a" />
      <g transform="translate(655 70) scale(0.9)">
        <rect width="420" height="190" rx="12" fill="#0b1230" />
        {panels.map((p, i) => (
          <g key={p.l1} opacity={i === 0 ? 1 : 0}>
            <Ani still={still} attributeName="opacity" values={VIS[i]} keyTimes="0;0.28;0.33;0.6;0.66;1" dur="9s" repeatCount="indefinite" />
            <rect x="10" y="10" width="400" height="170" rx="8" fill={p.bg} />
            <text x="30" y="82" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="30" fill="#fff">{p.l1}</text>
            <text x="30" y="122" fontFamily="Roboto, sans-serif" fontWeight="600" fontSize="22" fill="#e6ecff">{p.l2}</text>
          </g>
        ))}
      </g>
      {/* citizen looking up at the hoarding */}
      <g transform={`translate(880 ${ROAD_Y + 30})`}>
        <Person woman shirt="#2e7d6b" bottom="#e8ecf4" dupatta="#e5484d" skinTone={1} scale={0.95} />
      </g>
      {/* little phone on the pavement */}
      <g transform="translate(790 300)">
        <rect width="56" height="96" rx="10" fill="#0b1230" />
        <rect x="5" y="5" width="60" height="110" rx="8" fill="#fff" />
        <rect x="14" y="18" width="42" height="10" rx="5" fill="#e8f0ff" />
        <rect x="14" y="40" width="42" height="28" rx="6" fill="#1f3a8a" />
        <rect x="14" y="82" width="42" height="18" rx="9" fill="#f47b20" />
      </g>
    </g>
  );
};

/* ================================================= 6. online payments */
const Payments = ({ still }) => (
  <g>
    <Backdrop still={still} />
    <g transform="scale(0.8)">
    <Phone x={1062} y={120} w={230} h={400}>
      <text x="115" y="60" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="18" fill={NAVY}>Scan to pay</text>
      <rect x="45" y="84" width="140" height="140" rx="12" fill="#f5f7fc" />
      {[...Array(7)].map((_, r) =>
        [...Array(7)].map((__, c) => ((r * 3 + c * 5 + (r ^ c)) % 3 === 0 || (r < 2 && c < 2) ? <rect key={`${r}-${c}`} x={57 + c * 15} y={96 + r * 15} width="12" height="12" rx="2" fill={NAVY} /> : null))
      )}
      <text x="115" y="258" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="26" fill={NAVY}>₹ 1,250</text>
      <Check still={still} cx={115} cy={320} r={30} dur="5s" />
      <text x="115" y="372" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="13" fill="#1e9e62" opacity="0">
        Payment successful
        <Ani still={still} attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.5;0.58;0.9;1" dur="5s" repeatCount="indefinite" />
      </text>
    </Phone>
    </g>
    {/* citizen scanning with his phone */}
    <g transform={`translate(700 ${ROAD_Y + 30})`}>
      <Person topi shirt="#c0752b" bottom="#2b3a6b" skinTone={0} scale={0.95}>
        <PhoneInHand />
      </Person>
    </g>
    {/* card sliding towards the phone */}
    <g transform="translate(600 300)">
      <AniT still={still} attributeName="transform" type="translate" values="600 300; 690 250; 690 250; 600 300" keyTimes="0;0.4;0.9;1" dur="5s" repeatCount="indefinite" />
      <rect width="200" height="124" rx="16" fill="#1f3a8a" />
      <rect y="26" width="200" height="22" fill="#0b1230" />
      <rect x="18" y="74" width="60" height="14" rx="4" fill="#ffd27a" />
      <text x="18" y="108" fontFamily="Roboto, sans-serif" fontSize="13" fill="#cfd9ff" letterSpacing="2">•••• 4821</text>
    </g>
    {/* method chips */}
    {["UPI", "Card", "Net banking"].map((m, i) => (
      <g key={m} transform={`translate(${700 + i * 100} 120)`}>
        <rect width={m.length > 4 ? 124 : 76} height="34" rx="17" fill="#ffffff" opacity="0.92" />
        <text x={m.length > 4 ? 62 : 38} y="22" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="14" fill={NAVY}>{m}</text>
      </g>
    ))}
  </g>
);

/* =========================================== 7. garbage segregation */
const Bin = ({ x, color, dark, label, still, begin }) => (
  <g transform={`translate(${x} ${ROAD_Y - 2})`}>
    <rect x="-52" y="-120" width="104" height="120" rx="10" fill={color} />
    <g>
      <rect x="-58" y="-132" width="116" height="16" rx="6" fill={dark} />
      <AniT still={still} attributeName="transform" type="rotate" values="0 -58 -124; -24 -58 -124; 0 -58 -124" keyTimes="0;0.15;0.3" dur="6s" begin={begin} repeatCount="indefinite" />
    </g>
    <text x="0" y="-52" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="18" fill="#fff">{label}</text>
  </g>
);

const Segregation = ({ still }) => {
  const items = [
    { x: 740, c: "#e4c35d", r: 14, begin: "0s", label: "peel" },
    { x: 860, c: "#7fc4ff", r: 14, begin: "2s", label: "bottle" },
    { x: 980, c: "#e5484d", r: 14, begin: "4s", label: "battery" },
  ];
  return (
    <g>
      <Backdrop still={still} />
      <Bin x={740} color="#1e9e62" dark="#15803d" label="WET" still={still} begin="0s" />
      <Bin x={860} color="#2563eb" dark="#1d4ed8" label="DRY" still={still} begin="2s" />
      <Bin x={980} color="#c0392b" dark="#991b1b" label="E-WASTE" still={still} begin="4s" />
      {/* household members segregating */}
      <g transform={`translate(660 ${ROAD_Y + 30})`}>
        <Person woman shirt="#7b3fa0" bottom="#e8ecf4" dupatta="#f5c542" skinTone={1} scale={0.95} />
      </g>
      <g transform={`translate(1070 ${ROAD_Y + 30})`}>
        <Person topi shirt="#4a6fa5" bottom="#2b3a6b" skinTone={0} scale={0.95} flip />
      </g>
      {items.map((it) => (
        <circle key={it.label} cx={it.x} cy="150" r={it.r} fill={it.c} opacity="0">
          <Ani still={still} attributeName="cy" values="150;285;285" keyTimes="0;0.15;1" dur="6s" begin={it.begin} repeatCount="indefinite" />
          <Ani still={still} attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.14;0.16;1" dur="6s" begin={it.begin} repeatCount="indefinite" />
        </circle>
      ))}
      <text x="860" y="140" textAnchor="middle" fontFamily="Roboto, sans-serif" fontWeight="800" fontSize="22" fill="#ffffff" opacity="0.9">
        Segregate at source
      </text>
    </g>
  );
};

export const scenes = [
  { id: "sweeping", titleKey: "LANDING_SCENE_SWEEPING", title: "MC sweepers keep our hill towns clean", Scene: Sweeping },
  { id: "collection", titleKey: "LANDING_SCENE_COLLECTION", title: "Doorstep garbage collection, every day", Scene: Collection },
  { id: "tax", titleKey: "LANDING_SCENE_TAX", title: "Pay property tax and bills online", Scene: PayTax },
  { id: "dues", titleKey: "LANDING_SCENE_DUES", title: "Track your dues in one place", Scene: Dues },
  { id: "ads", titleKey: "LANDING_SCENE_ADS", title: "Apply for advertisement permissions online", Scene: Advertising },
  { id: "payments", titleKey: "LANDING_SCENE_PAYMENTS", title: "Secure online payments: UPI, card, net banking", Scene: Payments },
  { id: "segregation", titleKey: "LANDING_SCENE_SEGREGATION", title: "Segregate at source: wet, dry, e-waste", Scene: Segregation },
];

export default scenes;
