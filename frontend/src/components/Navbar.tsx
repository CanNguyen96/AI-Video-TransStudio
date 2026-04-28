"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/upload", label: "Upload Video" },
    { href: "/library", label: "Thư viện" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center glow-purple transition-transform duration-300 group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg">
            <span className="gradient-text">AI Video</span>
            <span className="text-white/80 ml-1">TransStudio</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/upload"
          id="nav-upload-cta"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg glow-purple"
        >
          + Upload Video
        </Link>
      </div>
    </header>
  );
}
