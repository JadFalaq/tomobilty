"use client";
type Props = { subtitle: string; title: string };
export default function SectionTitle({ subtitle, title }: Props) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-[2px] bg-[#ff003c]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">{subtitle}</span>
      </div>
      <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-none tracking-tight">{title}</h2>
    </div>
  );
}

