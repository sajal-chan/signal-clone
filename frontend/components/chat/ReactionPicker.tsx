"use client";

interface Props {
  onReact: (emoji: string) => void;
  onReply: () => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function ReactionPicker({ onReact, onReply, onClose, position }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-signal-sidebar border border-signal-divider rounded-2xl shadow-xl p-2 flex flex-col gap-1"
        style={{ left: position.x, top: position.y, transform: position.y < 120 ? "translate(-50%, 10px)" : "translate(-50%, -110%)" }}
      >
        <div className="flex gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onReact(emoji); onClose(); }}
              className="text-2xl hover:bg-white/10 rounded-lg p-1.5 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => { onReply(); onClose(); }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-signal-text-secondary hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Reply
        </button>
      </div>
    </>
  );
}
