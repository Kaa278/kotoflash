"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Languages, User } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        { name: "Review", href: "/review", icon: BookOpen },
        { name: "Kosa Kata", href: "/vocabulary", icon: Languages },
        { name: "Profil", href: "/profile", icon: User },
    ];

    return (
        <header className="fixed bottom-0 left-0 right-0 md:sticky md:top-0 md:bottom-auto z-50 w-full border-t md:border-t-0 md:border-b border-slate-200/60 bg-white/90 backdrop-blur-xl pb-safe md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center h-20 md:h-16">
                    {/* Logo - Hidden on mobile bottom nav */}
                    <div className="hidden md:flex flex-shrink-0 items-center">
                        <Link
                            href="/"
                            className="flex items-center text-xl font-bold tracking-tight text-slate-900 hover:opacity-80 transition-opacity"
                        >
                            <svg className="w-8 h-8 mr-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="48" fill="#BC002D" />
                                <rect x="26" y="31" width="40" height="50" rx="4" fill="#000000" fillOpacity="0.1" />
                                <rect x="25" y="30" width="40" height="50" rx="4" fill="#F5F5F5" />
                                <rect x="30" y="25" width="40" height="50" rx="4" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="0.5" />
                                <rect x="35" y="20" width="40" height="50" rx="4" fill="#FFFFFF" stroke="#BC002D" strokeWidth="1.5" />
                                <path d="M55 40V50M50 45H60" stroke="#BC002D" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            Kotoflash
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex w-full md:w-auto h-full items-center justify-around md:justify-end md:space-x-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative flex flex-col md:flex-row items-center justify-center md:space-x-2 px-6 md:px-4 py-2 md:py-2 rounded-2xl md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 active:scale-95 ${isActive
                                        ? "text-[#BC002D]"
                                        : "text-slate-400 md:text-slate-500 hover:text-slate-900 md:hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 md:w-4 md:h-4 mb-1 md:mb-0 ${isActive ? "animate-in zoom-in-75" : ""}`} />
                                    <span>{link.name}</span>
                                    {/* Indicator - Only on Desktop */}
                                    <span
                                        className={`hidden md:block absolute bottom-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#BC002D] rounded-full transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {/* Active background - Mobile only */}
                                    {isActive && (
                                        <span className="md:hidden absolute inset-0 bg-red-50 -z-10 rounded-2xl" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}
