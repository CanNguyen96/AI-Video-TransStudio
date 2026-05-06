import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EmptyState({
  icon = "🎬",
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-6 animate-float">{icon}</div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description && (
        <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="px-6 py-3 rounded-xl font-semibold text-white inline-block transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
