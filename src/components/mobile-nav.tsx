"use client";
import { GitBranch, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
type MobileNavItem = { href: string; label: string };

export function MobileNav({ items, organizationUrl, pathname }: {
  items: MobileNavItem[]; organizationUrl: string; pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { setIsOpen(false); trigger.current?.focus(); }
    }
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [isOpen]);
  return <div className="xl:hidden" ref={root}>
    <button ref={trigger} aria-controls={menuId} aria-expanded={isOpen}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-100 transition hover:border-cyan-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
      onClick={() => setIsOpen((open) => !open)} type="button">
      {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
    </button>
    <div hidden={!isOpen} id={menuId} className="absolute inset-x-6 top-full mt-2 max-h-[75dvh] overflow-y-auto rounded-2xl border border-white/10 bg-[#030712]/95 p-2 shadow-2xl backdrop-blur-xl">
      <nav aria-label="Mobile navigation" className="grid gap-1">
        {items.map((item) => <a key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(item.href + "/") ? "page" : undefined}
          className="rounded-md px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          onClick={() => setIsOpen(false)}>{item.label}</a>)}
        <a href={organizationUrl} rel="noopener noreferrer" target="_blank" className="mt-1 inline-flex items-center justify-between gap-3 rounded-md border border-white/12 bg-white/[0.04] px-3 py-3 text-sm font-semibold text-white">
          Farcasterorg GitHub<GitBranch className="h-4 w-4 text-cyan-200" aria-hidden="true" />
        </a>
      </nav>
    </div>
  </div>;
}
