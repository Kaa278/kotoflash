"use client";

import { useState } from "react";
import { X, LogIn, UserPlus, Key, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { saveToken, saveProfile, UserProfile } from "@/lib/storage";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "register") {
                await apiFetch("/register", {
                    method: "POST",
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                        name: formData.name,
                    }),
                });
                setSuccess("Pendaftaran berhasil! Silakan masuk.");
                setMode("login");
            } else {
                const { token } = await apiFetch("/login", {
                    method: "POST",
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                    }),
                });
                saveToken(token);

                // Fetch user profile after login
                const userProfile = await apiFetch("/profile", { method: "GET" });
                saveProfile(userProfile);
                onSuccess(userProfile);
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan. Pastikan backend di STB Anda berjalan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-red-100">
                            {mode === "login" ? <LogIn className="w-8 h-8 text-[#BC002D]" /> : <UserPlus className="w-8 h-8 text-[#BC002D]" />}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900">{mode === "login" ? "Selamat Datang" : "Buat Akun"}</h2>
                        <p className="text-slate-500 font-medium mt-2">
                            {mode === "login" ? "Masuk ke akun Kotoflash Anda" : "Mulai petualangan belajar bahasa Anda"}
                        </p>
                    </div>

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center space-x-3 text-green-600">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-y-1 text-red-600 flex-col text-center">
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all font-medium"
                                        placeholder="Erdhikaa"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all font-medium"
                                    placeholder="erdhikaa_kotoflash"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold shadow-xl shadow-red-500/20 transition-all flex items-center justify-center space-x-3 active:scale-[0.98] disabled:opacity-70 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{mode === "login" ? "Masuk Sekarang" : "Daftar Akun"}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <p className="text-slate-500 font-medium">
                            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}
                            <button
                                onClick={() => {
                                    setMode(mode === "login" ? "register" : "login");
                                    setError("");
                                    setSuccess("");
                                }}
                                className="ml-2 text-[#BC002D] font-black hover:underline"
                            >
                                {mode === "login" ? "Daftar" : "Masuk"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
