export function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid gap-3 px-4 py-5" role="status" aria-live="polite">
      <p className="muted text-sm">{label}</p>
      <div className="panel h-24 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="panel h-52 animate-pulse" />
        <div className="panel h-52 animate-pulse" />
      </div>
    </div>
  );
}
