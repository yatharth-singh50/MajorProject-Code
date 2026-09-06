export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-inset text-text-faint">
          <Icon size={22} strokeWidth={1.6} />
        </div>
      )}
      <p className="font-serif text-lg text-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-text-dim">{description}</p>}
      {action}
    </div>
  );
}
