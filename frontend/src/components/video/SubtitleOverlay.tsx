import { SubtitleMode } from "@/types/video";

interface SubtitleOverlayProps {
  subtitleMode: SubtitleMode;
  activeSub: string;
}

export default function SubtitleOverlay({ subtitleMode, activeSub }: SubtitleOverlayProps) {
  if (subtitleMode === "off" || !activeSub) return null;

  return (
    <div
      className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none px-8"
      style={{ zIndex: 10 }}
    >
      <div
        className="text-center rounded-lg px-4 py-2 max-w-3xl"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          fontSize: "clamp(14px, 2.2vw, 20px)",
          lineHeight: 1.5,
          color: "#fff",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          whiteSpace: "pre-line",
        }}
      >
        {subtitleMode === "bilingual"
          ? activeSub.split("\n").map((line, i) => (
              <div
                key={i}
                style={{
                  color: i === 0 ? "rgba(255,255,255,0.65)" : "#fff",
                  fontSize: i === 0 ? "0.88em" : "1em",
                }}
              >
                {line}
              </div>
            ))
          : activeSub}
      </div>
    </div>
  );
}
