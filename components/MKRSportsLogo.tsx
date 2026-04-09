export function MKRSportsLogo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="#ffea00"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }

  return (
    <p className="flex items-center">
      <span className="text-xl font-black text-white italic tracking-tighter">MKR</span>
      <svg
        className="w-5 h-5 fill-[#ffea00] animate-bolt-flash mx-0.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      <span className="text-xs font-bold text-[#ffea00] uppercase tracking-[0.15em] ml-1">
        Sports
      </span>
    </p>
  );
}