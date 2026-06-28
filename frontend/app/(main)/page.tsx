export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-signal-text-secondary select-none">
      <div className="text-6xl mb-4 opacity-30">💬</div>
      <p className="text-lg font-medium">Select a conversation</p>
      <p className="text-sm mt-1 opacity-60">or start a new one</p>
    </div>
  );
}
