type Status = "sent" | "delivered" | "read";

export default function TickMark({ status }: { status: Status }) {
  if (status === "sent") {
    return (
      <svg className="w-4 h-4 text-signal-text-secondary opacity-60" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      </svg>
    );
  }
  const color = status === "read" ? "text-sky-400" : "text-signal-text-secondary opacity-60";
  return (
    <svg className={`w-4 h-4 ${color}`} fill="currentColor" viewBox="0 0 16 16">
      <path d="M12.354 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 0 1 .708-.708L5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
      <path d="M15.354 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-.354-.354.708-.708.354.353 6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>
  );
}
