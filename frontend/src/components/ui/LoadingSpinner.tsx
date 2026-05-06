interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeMap = { sm: "w-3 h-3", md: "w-8 h-8", lg: "w-12 h-12" };

export default function LoadingSpinner({
  size = "md",
  color = "border-purple-500",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full border-2 ${color} border-t-transparent animate-spin`}
    />
  );
}
