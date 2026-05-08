/**
 * AgriHubLogo — drop this wherever you need the logo.
 * size: 'sm' | 'md' | 'lg' | 'xl'
 * showTagline: show "Connecting Farmers · Traders · Markets"
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm:  'w-8 h-8',
  md:  'w-12 h-12',
  lg:  'w-16 h-16',
  xl:  'w-24 h-24',
};

const TEXT_SIZES = {
  sm:  'text-sm',
  md:  'text-lg',
  lg:  'text-2xl',
  xl:  'text-3xl',
};

export default function AgriHubLogo({
  size = 'md',
  showTagline = false,
  className = '',
}: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/agrihub_logo.png"
        alt="AgriHub Logo"
        className={`${SIZES[size]} object-contain`}
      />
      {showTagline && (
        <p className="text-xs text-gray-400 mt-1 tracking-wide uppercase">
          Connecting Farmers · Traders · Markets
        </p>
      )}
    </div>
  );
}
