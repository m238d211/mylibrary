"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/tools", label: "Browse" },
  { href: "/categories", label: "Categories" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="MyLibrary home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm font-bold text-white" aria-hidden="true">
            M
          </span>
          <span className="text-[17px]">
            My<span className="text-accent">Library</span>
          </span>
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 font-medium ${active ? "bg-surface text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
