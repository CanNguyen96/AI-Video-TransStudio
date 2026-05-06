interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex justify-between text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
        <span>Đang upload...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-card)" }}>
        <div className="h-full rounded-full progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
