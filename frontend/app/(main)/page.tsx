export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-signal-text-secondary select-none bg-[radial-gradient(ellipse_at_center,rgba(58,118,196,0.05)_0%,transparent_70%)]">
      <div className="text-7xl mb-6 grayscale opacity-20">🔒</div>
      <p className="text-xl font-medium text-signal-text-primary opacity-60">Signal Clone</p>
      <p className="text-sm mt-2 opacity-40">Select a conversation to start messaging</p>
      <div className="mt-6 flex items-center gap-2 text-xs text-signal-text-secondary opacity-30">
        <span>🔒</span>
        <span>Messages are mock-encrypted</span>
      </div>
    </div>
  );
}
