interface CornerOrnamentsProps {
  variant?: 'bracket' | 'curve';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  animate?: boolean;
  offset?: number;
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-10 h-10'
};

function BracketSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
      <path d="M0 0 L50 0 L50 10 L10 10 L10 50 L0 50 Z" fill="currentColor"/>
      <path d="M15 15 L30 15 L30 20 L20 20 L20 30 L15 30 Z" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}

function CurveSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-yellow-500">
      <path d="M0 0 L40 0 Q0 0 0 40 Z" fill="currentColor"/>
    </svg>
  );
}

export default function CornerOrnaments({
  variant = 'curve',
  size = 'sm',
  opacity = 0.3,
  animate = false,
  offset = 2,
  className = ''
}: CornerOrnamentsProps) {
  const sizeClass = sizeMap[size];
  const offsetPx = offset * 4;
  const SVGComponent = variant === 'bracket' ? BracketSVG : CurveSVG;

  const corners = [
    { position: { top: offsetPx, left: offsetPx }, transform: 'none' },
    { position: { top: offsetPx, right: offsetPx }, transform: 'scaleX(-1)' },
    { position: { bottom: offsetPx, left: offsetPx }, transform: 'scaleY(-1)' },
    { position: { bottom: offsetPx, right: offsetPx }, transform: 'scale(-1)' }
  ];

  return (
    <>
      {corners.map((corner, index) => (
        <div
          key={index}
          className={`absolute pointer-events-none ${sizeClass} ${animate ? 'animate-corner-glow' : ''} ${className}`}
          style={{
            ...corner.position,
            opacity,
            transform: corner.transform
          }}
        >
          <SVGComponent />
        </div>
      ))}
      {animate && (
        <style>{`
          @keyframes corner-glow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          .animate-corner-glow {
            animation: corner-glow 2s ease-in-out infinite;
          }
        `}</style>
      )}
    </>
  );
}
