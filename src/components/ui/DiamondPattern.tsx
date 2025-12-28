interface DiamondPatternProps {
  opacity?: number;
  size?: number;
  className?: string;
  rounded?: boolean;
}

export default function DiamondPattern({
  opacity = 0.03,
  size = 30,
  className = '',
  rounded = false
}: DiamondPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${rounded ? 'rounded-xl' : ''} ${className}`}
      style={{
        opacity,
        backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 0L60 30L30 60L0 30z" fill="%23d4af37" fill-opacity="0.4"/%3E%3C/svg%3E')`,
        backgroundSize: `${size}px ${size}px`
      }}
    />
  );
}
