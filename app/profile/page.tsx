"use client";

import { useState, useEffect, useRef } from "react";
import { getWords, getProfile, saveProfile, UserProfile, saveWords, isLoggedIn, clearAuth, syncWordsWithCloud } from "@/lib/storage";
import {
    User,
    Settings,
    Download,
    Database,
    Cpu,
    ShieldCheck,
    Sparkles,
    ChevronRight,
    LogIn,
    LogOut,
    Edit2,
    Info,
    Camera,
    Check,
    Upload,
    Cloud,
    CloudOff,
    Loader2
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { apiFetch } from "@/lib/api";

export default function ProfilePage() {
    const [wordCount, setWordCount] = useState<number>(0);
    const [mounted, setMounted] = useState(false);
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoggedInState, setIsLoggedInState] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const [dragY, setDragY] = useState(0);
    const startY = useRef(0);
    const isDraggingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<UserProfile>({ name: "", bio: "" });
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editAvatar, setEditAvatar] = useState<string | undefined>("");

    useEffect(() => {
        setWordCount(getWords().length);
        const loggedIn = isLoggedIn();
        setIsLoggedInState(loggedIn);

        if (loggedIn) {
            // Fetch fresh profile from backend
            apiFetch("/profile", { method: "GET" })
                .then(p => {
                    setProfile(p);
                    setEditName(p.name || "");
                    setEditBio(p.bio || "");
                    setEditAvatar(p.avatar || "");
                    saveProfile(p);
                })
                .catch(err => {
                    console.error("Gagal ambil profil dari STB:", err);
                    // Fallback to local
                    const p = getProfile();
                    setProfile(p);
                });

            // Sync vocabulary words
            setIsSyncing(true);
            syncWordsWithCloud()
                .then(() => setWordCount(getWords().length))
                .catch(err => console.error("Auto sync failed:", err))
                .finally(() => setIsSyncing(false));
        } else {
            const p = getProfile();
            setProfile(p);
            setEditName(p.name || "");
            setEditBio(p.bio || "");
            setEditAvatar(p.avatar || "");
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isDevModalOpen && !isSettingsModalOpen && !isEditModalOpen) {
            setHasDragged(false);
            setDragY(0);
        }
    }, [isDevModalOpen, isSettingsModalOpen, isEditModalOpen]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const updated = { ...profile, name: editName, bio: editBio, avatar: editAvatar };

        setIsSyncing(true);
        try {
            if (isLoggedInState) {
                // Sync to STB
                await apiFetch("/profile", {
                    method: "PUT",
                    body: JSON.stringify(updated)
                });
            }
            saveProfile(updated);
            setProfile(updated);
            setIsEditModalOpen(false);
        } catch (err) {
            alert("Gagal sinkronisasi profil ke STB. Hubungkan kembali STB Anda.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            clearAuth();
            setIsLoggedInState(false);
            const guestProfile = { name: "Pengguna Tamu", bio: "Hafalkan kosa katanya, kuasai bahasanya." };
            setProfile(guestProfile);
            setEditName(guestProfile.name || "");
            setEditBio(guestProfile.bio || "");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true;
        setIsDragging(true);
        setHasDragged(true);
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        startY.current = e.clientY;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;
        const deltaY = e.clientY - startY.current;
        if (deltaY > 0) {
            setDragY(deltaY);
        } else {
            // Resistance for pulling up ("naik")
            setDragY(deltaY * 0.2);
        }
    };

    const handlePointerUp = (e: React.PointerEvent, closeFn: () => void) => {
        isDraggingRef.current = false;
        setIsDragging(false);
        const target = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) {
            target.releasePointerCapture(e.pointerId);
        }

        if (dragY > 100) {
            closeFn();
        }
        setDragY(0);
    };

    const handleExport = () => {
        const data = getWords();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kotoflash-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedWords = JSON.parse(content);

                if (Array.isArray(importedWords)) {
                    // Simple validation: check if each item has word and meaning
                    const isValid = importedWords.every(w => w.word && w.meaning);
                    if (isValid) {
                        saveWords(importedWords);
                        setWordCount(importedWords.length);
                        alert(`Berhasil mengimpor ${importedWords.length} kata!`);
                        setIsSettingsModalOpen(false);
                    } else {
                        alert("Format file tidak valid. Pastikan JSON berisi array kata dengan 'word' dan 'meaning'.");
                    }
                }
            } catch (err) {
                alert("Gagal membaca file JSON.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    if (!mounted) return null;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 w-full animate-in fade-in duration-500 bg-white min-h-full pb-20 md:pb-10">
            {/* Profile Header */}
            <div className="mb-4 md:mb-12 flex flex-col items-center text-center space-y-4 md:space-y-6">
                <div className="relative group">
                    <div className="w-32 h-32 bg-slate-50 rounded-[3rem] border-4 border-red-50 flex items-center justify-center shadow-2xl shadow-red-500/10 overflow-hidden group-hover:border-[#BC002D] transition-all duration-500 transform group-hover:scale-105">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                                <User className="w-16 h-16 text-slate-300 group-hover:text-[#BC002D] transition-colors" />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">{profile.name}</h1>
                    {profile.id && (
                        <p className="text-[10px] md:text-xs font-black text-[#BC002D] bg-red-50 px-3 py-1 rounded-full border border-red-100 inline-block mt-1.5 uppercase tracking-[0.2em]">
                            ID: {profile.id}
                        </p>
                    )}
                    <p className="text-sm md:text-lg text-slate-500 font-medium mt-1.5">{profile.bio}</p>
                </div>
                {isLoggedInState ? (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="h-2" />
                        <div className="flex flex-col items-center space-y-4">
                            <div className="h-2" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="h-2" />
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="flex items-center space-x-3 px-8 py-3.5 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 active:scale-95 animate-in fade-in slide-in-from-bottom-2"
                        >
                            <LogIn className="w-5 h-5" />
                            <span>Masuk / Daftar</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Menu Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Edit Profile */}
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200/60 p-4 md:p-8 ring-1 ring-slate-900/5 hover:border-red-200 transition-all group flex flex-row md:flex-col items-center md:justify-center space-x-4 md:space-x-0 md:space-y-4 outline-none active:scale-[0.99]"
                >
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 rounded-xl md:rounded-[1.5rem] border border-slate-100 flex items-center justify-center group-hover:bg-red-50 group-hover:text-[#BC002D] transition-colors shrink-0">
                        <Edit2 className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left md:text-center flex-1">
                        <h2 className="text-base md:text-xl font-bold text-slate-900 group-hover:text-[#BC002D] transition-colors">Edit Profil</h2>
                        <p className="text-slate-500 font-medium text-xs md:text-sm">Ubah nama & foto.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 md:hidden" />
                </button>

                {/* Developer Profiles */}
                <button
                    onClick={() => setIsDevModalOpen(true)}
                    className="w-full bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200/60 p-4 md:p-8 ring-1 ring-slate-900/5 hover:border-red-200 transition-all group flex flex-row md:flex-col items-center md:justify-center space-x-4 md:space-x-0 md:space-y-4 outline-none active:scale-[0.99]"
                >
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 rounded-xl md:rounded-[1.5rem] border border-slate-100 flex items-center justify-center group-hover:bg-red-50 group-hover:text-[#BC002D] transition-colors shrink-0">
                        <Info className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left md:text-center flex-1">
                        <h2 className="text-base md:text-xl font-bold text-slate-900 group-hover:text-[#BC002D] transition-colors">Developer</h2>
                        <p className="text-slate-500 font-medium text-xs md:text-sm">Kenali pembuatnya.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 md:hidden" />
                </button>

                {/* App Settings */}
                <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-full bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-200/60 p-4 md:p-8 ring-1 ring-slate-900/5 hover:border-red-200 transition-all group flex flex-row md:flex-col items-center md:justify-center space-x-4 md:space-x-0 md:space-y-4 outline-none active:scale-[0.99]"
                >
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 rounded-xl md:rounded-[1.5rem] border border-slate-100 flex items-center justify-center group-hover:bg-red-50 group-hover:text-[#BC002D] transition-colors shrink-0">
                        <Settings className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left md:text-center flex-1">
                        <h2 className="text-base md:text-xl font-bold text-slate-900 group-hover:text-[#BC002D] transition-colors">Pengaturan</h2>
                        <p className="text-slate-500 font-medium text-xs md:text-sm">Cadangan & Lanjutan.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 md:hidden" />
                </button>

                {/* Version Info Card - Integrated into Grid */}
                <div className="w-full bg-slate-50/50 rounded-2xl md:rounded-[2.5rem] border border-slate-100 p-4 md:p-8 flex flex-row md:flex-col items-center md:justify-center space-x-4 md:space-x-0 md:space-y-4">
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-xl md:rounded-[1.5rem] border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Cpu className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left md:text-center flex-1">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Aplikasi Versi</p>
                        <p className="text-sm md:text-base font-bold text-slate-600">Kotoflash 1.0.0</p>
                    </div>
                    <div className="px-2 py-1 bg-green-50 text-[10px] font-black text-green-600 uppercase tracking-widest rounded-lg border border-green-100">
                        Stabil
                    </div>
                </div>
            </div>


            {/* Developer Profile Modal */}
            {isDevModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        style={{
                            opacity: isDragging ? 1 - Math.max(0, dragY) / 1000 : 1,
                            transition: isDragging ? 'none' : 'opacity 0.4s ease-out'
                        }}
                        onClick={() => setIsDevModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div
                        className={`relative w-full md:max-w-2xl bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] ${!hasDragged ? "animate-slide-up" : ""}`}
                        style={{
                            transform: hasDragged ? `translateY(${dragY}px) scale(${1 - Math.max(0, dragY) / 10000})` : undefined,
                            transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
                        }}
                    >
                        {/* Drag Zone for Mobile */}
                        <div
                            className="pt-6 pb-2 md:hidden touch-none select-none cursor-grab active:cursor-grabbing shrink-0 flex flex-col items-center"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={(e) => handlePointerUp(e, () => setIsDevModalOpen(false))}
                            onPointerCancel={(e) => handlePointerUp(e, () => setIsDevModalOpen(false))}
                        >
                            <div className="w-12 h-1.2 bg-slate-200 rounded-full mx-auto" />
                        </div>

                        {/* Content Area */}
                        <div className="p-6 md:p-8 pt-2 md:pt-8 overflow-y-auto flex-1">
                            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left mb-6 pb-6 border-b border-slate-100 mt-2 md:mt-0">
                                <div className="w-24 h-24 bg-slate-100 rounded-[2rem] border-2 border-red-100 flex items-center justify-center shadow-inner overflow-hidden">
                                    <User className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">Erdhikaa</h3>
                                    <p className="text-slate-500 text-lg">Kotoflash Application Developer</p>
                                    <p className="text-sm font-medium text-slate-400 bg-slate-50 px-4 py-2 rounded-xl inline-block mt-2">
                                        Building tools to learn faster and better.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <a href="https://instagram.com/erdhikaa" target="_blank" rel="noopener noreferrer" className="flex flex-row md:flex-col items-center md:justify-center p-4 md:p-6 bg-slate-50 hover:bg-red-50 rounded-2xl md:rounded-[2rem] border border-slate-100 hover:border-red-100 transition-all text-slate-600 hover:text-[#BC002D] group shadow-sm hover:shadow-md gap-4 md:gap-0">
                                    <div className="p-3 bg-white rounded-xl md:rounded-2xl shadow-sm md:mb-4 group-hover:scale-110 transition-transform shrink-0 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#E1306C]" viewBox="0 0 448 512" fill="currentColor">
                                            <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col items-start md:items-center overflow-hidden">
                                        <span className="font-bold truncate w-full">@erdhikaa</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">Instagram</span>
                                    </div>
                                </a>
                                <a href="https://tiktok.com/@erdhikaa" target="_blank" rel="noopener noreferrer" className="flex flex-row md:flex-col items-center md:justify-center p-4 md:p-6 bg-slate-50 hover:bg-red-50 rounded-2xl md:rounded-[2rem] border border-slate-100 hover:border-red-100 transition-all text-slate-600 hover:text-[#BC002D] group shadow-sm hover:shadow-md gap-4 md:gap-0">
                                    <div className="p-3 bg-white rounded-xl md:rounded-2xl shadow-sm md:mb-4 group-hover:scale-110 transition-transform shrink-0 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-black" viewBox="0 0 448 512" fill="currentColor">
                                            <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col items-start md:items-center overflow-hidden">
                                        <span className="font-bold truncate w-full">@erdhikaa</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">TikTok</span>
                                    </div>
                                </a>
                                <a href="https://wa.me/6285176729586" target="_blank" rel="noopener noreferrer" className="flex flex-row md:flex-col items-center md:justify-center p-4 md:p-6 bg-slate-50 hover:bg-red-50 rounded-2xl md:rounded-[2rem] border border-slate-100 hover:border-red-100 transition-all text-slate-600 hover:text-[#BC002D] group shadow-sm hover:shadow-md gap-4 md:gap-0">
                                    <div className="p-3 bg-white rounded-xl md:rounded-2xl shadow-sm md:mb-4 group-hover:scale-110 transition-transform shrink-0 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 448 512" fill="currentColor">
                                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.4 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.9 4.4 26.5 3.8 36.5 2.3 11.1-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.7z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col items-start md:items-center overflow-hidden">
                                        <span className="font-bold truncate w-full">Chat Support</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">WhatsApp</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* App Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        style={{
                            opacity: isDragging ? 1 - Math.max(0, dragY) / 1000 : 1,
                            transition: isDragging ? 'none' : 'opacity 0.4s ease-out'
                        }}
                        onClick={() => setIsSettingsModalOpen(false)}
                    />

                    <div
                        className={`relative w-full md:max-w-2xl bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] ${!hasDragged ? "animate-slide-up" : ""}`}
                        style={{
                            transform: hasDragged ? `translateY(${dragY}px) scale(${1 - Math.max(0, dragY) / 10000})` : undefined,
                            transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
                        }}
                    >
                        {/* Combined Drag Zone & Header for Settings */}
                        <div
                            className="pt-6 md:hidden touch-none select-none cursor-grab active:cursor-grabbing shrink-0"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={(e) => handlePointerUp(e, () => setIsSettingsModalOpen(false))}
                            onPointerCancel={(e) => handlePointerUp(e, () => setIsSettingsModalOpen(false))}
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
                            <div className="px-6 pb-2 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-900">Pengaturan Aplikasi</h2>
                            </div>
                        </div>

                        <div className="p-4 md:p-8 pt-2 md:pt-8 overflow-y-auto flex-1">
                            {/* Desktop/Tablet Header */}
                            <div className="hidden md:flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-900">Pengaturan Aplikasi</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                {/* Data Section */}
                                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 space-y-4">
                                    <div className="flex items-center space-x-3 text-slate-400 mb-1">
                                        <Database className="w-5 h-5" />
                                        <h2 className="text-[10px] font-black uppercase tracking-widest">Data & Cadangan</h2>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1 px-1">
                                            <p className="font-bold text-slate-900">Data & Cadangan</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Ekspor atau impor daftar kosa kata kamu.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleExport}
                                                disabled={wordCount === 0}
                                                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-30 disabled:grayscale active:scale-95"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-xs">Ekspor</span>
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center space-x-2 active:scale-95"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span className="text-xs">Impor</span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImport}
                                                accept=".json"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Features Section */}
                                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center space-x-3 text-red-500 mb-4">
                                            <Cpu className="w-5 h-5" />
                                            <h2 className="text-[10px] font-black uppercase tracking-widest">Lanjutan</h2>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { title: "Cloud Sync", icon: ShieldCheck, locked: true },
                                                { title: "AI Generation", icon: Sparkles, locked: false }
                                            ].map((item, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-between p-4 rounded-2xl border border-dashed border-red-100 ${item.locked ? 'opacity-60' : 'cursor-pointer hover:bg-red-50/50 hover:border-solid transition-colors'}`}
                                                    onClick={() => !item.locked && (window.location.href = "/vocabulary")}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-red-50 rounded-xl">
                                                            <item.icon className="w-4 h-4 text-red-400" />
                                                        </div>
                                                        <p className="font-bold text-slate-600 text-sm">{item.title}</p>
                                                    </div>
                                                    {item.locked ? (
                                                        <div className="text-[9px] font-black text-red-300 uppercase tracking-widest px-1.5 py-0.5 border border-red-50 rounded-full">
                                                            Terkunci
                                                        </div>
                                                    ) : (
                                                        <div className="text-[9px] font-black text-green-500 uppercase tracking-widest px-1.5 py-0.5 border border-green-100 bg-green-50 rounded-full">
                                                            Aktif
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Logout Button in Settings */}
                                    {isLoggedInState && (
                                        <button
                                            onClick={handleLogout}
                                            className="mt-6 flex items-center justify-center space-x-3 px-6 py-3.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all active:scale-95 border border-red-100 hover:border-red-500 group shadow-sm hover:shadow-red-500/20"
                                        >
                                            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            <span>Keluar Akun</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        style={{
                            opacity: isDragging ? 1 - Math.max(0, dragY) / 600 : 1,
                            transition: isDragging ? 'none' : 'opacity 0.4s ease-out'
                        }}
                        onClick={() => setIsEditModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div
                        className={`relative w-full md:max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] ${!hasDragged ? "animate-slide-up" : ""}`}
                        style={{
                            transform: hasDragged ? `translateY(${dragY}px) scale(${1 - Math.max(0, dragY) / 10000})` : undefined,
                            transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
                        }}
                    >
                        {/* Combined Drag Zone & Header for Edit Profile */}
                        <div
                            className="pt-6 md:hidden touch-none select-none cursor-grab active:cursor-grabbing shrink-0"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={(e) => handlePointerUp(e, () => setIsEditModalOpen(false))}
                            onPointerCancel={(e) => handlePointerUp(e, () => setIsEditModalOpen(false))}
                        >
                            <div className="w-12 h-1.2 bg-slate-200 rounded-full mx-auto mb-4" />
                            <div className="px-6 pb-2 border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-900">Edit Profil</h2>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 pt-2 md:pt-8 overflow-y-auto flex-1">
                            {/* Desktop/Tablet Header */}
                            <div className="hidden md:flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                                <h2 className="text-2xl font-bold text-slate-900">Edit Profil</h2>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                {/* Avatar Upload */}
                                <div className="flex flex-col items-center space-y-4 mb-2">
                                    <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] border-4 border-slate-100 flex items-center justify-center overflow-hidden shadow-inner hover:border-red-100 transition-all">
                                            {editAvatar ? (
                                                <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-slate-200" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 p-3 bg-[#BC002D] text-white rounded-2xl shadow-xl transform hover:scale-110 active:scale-90 transition-all">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Klik untuk Ubah Foto</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Nama</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Nama Kamu"
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Bio</label>
                                    <textarea
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Tulis sesuatu tentang dirimu..."
                                        rows={3}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                                    />
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all flex-1 text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!editName.trim() || isSyncing}
                                        className="flex-[1.5] px-4 py-3 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all disabled:opacity-30 disabled:grayscale transform active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 text-sm"
                                    >
                                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        <span>{isSyncing ? "Simpan..." : "Simpan Profil"}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={(p) => {
                    setIsLoggedInState(true);
                    setProfile(p);
                    setEditName(p.name);
                    setEditBio(p.bio);
                    setEditAvatar(p.avatar);

                    // Sync words immediately after login
                    setIsSyncing(true);
                    syncWordsWithCloud()
                        .then(() => setWordCount(getWords().length))
                        .catch(err => console.error("Login sync failed:", err))
                        .finally(() => setIsSyncing(false));
                }}
            />
        </div>
    );
}
