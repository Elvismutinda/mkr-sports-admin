export function SummaryBar({
  items,
}: {
  items: { label: string; value: string | number; accent?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-lg p-3 border">
          <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
          <p
            className={`text-lg font-black ${item.accent ?? "text-slate-800"}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
