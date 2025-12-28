interface GoldenLineProps {
  position?: 'top' | 'bottom';
  thickness?: 'thin' | 'normal' | 'thick';
  opacity?: number;
  animate?: boolean;
  className?: string;
}

export default function GoldenLine({
  position = 'top',
  thickness = 'normal',
  opacity = 0.5,
  animate = false,
  className = ''
}: GoldenLineProps) {
  const heightClass = {
    thin: 'h-px',
    normal: 'h-0.5',
    thick: 'h-1'
  }[thickness];

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <>
      <div
        className={`absolute left-0 right-0 ${heightClass} ${positionClass} ${animate ? 'animate-shimmer' : ''} ${className}`}
        style={{
          background: `linear-gradient(to right, transparent, rgba(234, 179, 8, ${opacity}), transparent)`
        }}
      />
      {animate && (
        <style>{`
          @keyframes shimmer {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
        `}</style>
      )}
    </>
  );
}
