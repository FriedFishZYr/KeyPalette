import { mix, shadeTowardContrast } from '../../utils/colorUtils.js';

const PADDING = 8;

export default function Case({ width, height, caseColor, caseFinish, filterId, boardId, plate = false }) {
  const x = -PADDING;
  const y = -PADDING;
  const caseW = width + PADDING * 2;
  const caseH = height + PADDING * 2;
  const isGloss = caseFinish === 'gloss';
  // Gradient id is per board so two boards in comparison mode never share
  // (and therefore never duplicate) an element id.
  const glossId = `case-gloss-${boardId}`;
  // The plate is the darker floor visible between keycaps on a real board.
  const plateColor = mix(caseColor, '#000000', 0.28);
  // A thin rim in a shade of the case color, so a case that matches the
  // background (black on the dark workspace, white on light) keeps its edge.
  const rimColor = shadeTowardContrast(caseColor, 0.16);

  return (
    <g>
      <defs>
        {/* Gloss reflection: white 8% at top fading out by ~40% down */}
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x={x} y={y} width={caseW} height={caseH} rx={10} ry={10} fill={caseColor} filter={`url(#${filterId})`} />
      <rect x={x + 0.5} y={y + 0.5} width={caseW - 1} height={caseH - 1} rx={9.5} ry={9.5} fill="none" stroke={rimColor} strokeWidth={1} pointerEvents="none" />

      {/* Matte is the flat fill alone; gloss adds a reflection on top. */}
      {isGloss && (
        <>
          <rect x={x} y={y} width={caseW} height={caseH} rx={10} ry={10} fill={`url(#${glossId})`} pointerEvents="none" />
          <line x1={x + 10} y1={y + 1} x2={x + caseW - 10} y2={y + 1} stroke="rgba(255,255,255,0.18)" strokeWidth={1} pointerEvents="none" />
        </>
      )}

      {/* Inner bezel edge. */}
      <rect x={x + 1.5} y={y + 1.5} width={caseW - 3} height={caseH - 3} rx={9} ry={9} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} pointerEvents="none" />

      {plate && (
        <rect x={0} y={0} width={width} height={height} rx={4} ry={4} fill={plateColor} pointerEvents="none" />
      )}
    </g>
  );
}

export function CaseFilter({ id, caseFinish }) {
  const isGloss = caseFinish === 'gloss';
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="140%">
      <feDropShadow
        dx={0}
        dy={isGloss ? 6 : 4}
        stdDeviation={isGloss ? 16 : 12}
        floodColor="#000"
        floodOpacity={isGloss ? 0.6 : 0.4}
      />
    </filter>
  );
}
