import DiamondPattern from './DiamondPattern';
import GoldenLine from './GoldenLine';
import CornerOrnaments from './CornerOrnaments';

interface MedievalContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'modal' | 'page';
  showDiamonds?: boolean;
  showGoldenLine?: boolean;
  showBottomLine?: boolean;
  showCorners?: boolean;
  cornerVariant?: 'bracket' | 'curve';
  cornerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  cornerOpacity?: number;
  cornerAnimate?: boolean;
  diamondOpacity?: number;
  diamondSize?: number;
  lineOpacity?: number;
  lineAnimate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles = {
  default: 'relative rounded-xl overflow-hidden',
  card: 'relative rounded-xl overflow-hidden p-4 sm:p-6',
  modal: 'relative rounded-xl md:rounded-2xl overflow-hidden',
  page: 'relative rounded-xl md:rounded-2xl overflow-hidden p-4 sm:p-6 md:p-8'
};

export default function MedievalContainer({
  children,
  variant = 'default',
  showDiamonds = true,
  showGoldenLine = true,
  showBottomLine = false,
  showCorners = true,
  cornerVariant = 'curve',
  cornerSize = 'sm',
  cornerOpacity = 0.3,
  cornerAnimate = false,
  diamondOpacity = 0.03,
  diamondSize = 30,
  lineOpacity = 0.5,
  lineAnimate = false,
  className = '',
  style = {}
}: MedievalContainerProps) {
  const baseStyle: React.CSSProperties = {
    background: 'linear-gradient(to bottom, rgb(17 24 39 / 0.95), rgb(17 24 39 / 0.98), rgb(0 0 0 / 0.95))',
    border: '1px solid rgb(202 138 4 / 0.2)',
    ...(variant === 'modal' && {
      boxShadow: '0 0 60px rgba(234, 179, 8, 0.2), inset 0 1px 0 rgba(234, 179, 8, 0.1)'
    }),
    ...style
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} style={baseStyle}>
      {showDiamonds && <DiamondPattern opacity={diamondOpacity} size={diamondSize} rounded />}
      {showGoldenLine && <GoldenLine position="top" opacity={lineOpacity} animate={lineAnimate} />}
      {showBottomLine && <GoldenLine position="bottom" opacity={lineOpacity} animate={lineAnimate} />}
      {showCorners && (
        <CornerOrnaments
          variant={cornerVariant}
          size={cornerSize}
          opacity={cornerOpacity}
          animate={cornerAnimate}
        />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
