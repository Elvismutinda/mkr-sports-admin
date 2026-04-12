export function ReportCard({
  title,
  description,
  icon,
  color,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className={`px-5 py-4 border-b flex items-center gap-3 ${color}`}>
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-black text-base">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
}
