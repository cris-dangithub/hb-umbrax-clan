interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  color = 'from-yellow-400 to-yellow-600',
  height = 'h-8',
  showPercentage = true,
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`relative w-full ${height} bg-yellow-900/20 rounded-lg overflow-hidden border border-yellow-900/30`}>
      <div
        className={`${height} bg-gradient-to-r ${color} transition-all duration-500 ease-out`}
        style={{ width: `${clampedValue}%` }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {clampedValue.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
