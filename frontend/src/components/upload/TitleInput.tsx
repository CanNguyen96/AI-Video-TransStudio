interface TitleInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function TitleInput({ value, onChange }: TitleInputProps) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        Tiêu đề video
      </label>
      <input
        id="video-title-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập tiêu đề..."
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
        onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </div>
  );
}
