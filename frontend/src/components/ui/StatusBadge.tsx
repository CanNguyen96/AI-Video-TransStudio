type VideoStatus = "uploaded" | "processing" | "completed" | "error";

interface StatusBadgeProps {
  status: VideoStatus;
}

const statusConfig: Record<VideoStatus, { label: string; color: string; bg: string; border: string }> = {
  uploaded:   { label: "Đã upload",    color: "#60a5fa", bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.4)"  },
  processing: { label: "Đang xử lý",  color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)"  },
  completed:  { label: "Hoàn thành",  color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)"  },
  error:      { label: "Lỗi",         color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

/** Xuất config để dùng lại màu sắc (vd: watch page) */
export { statusConfig };
