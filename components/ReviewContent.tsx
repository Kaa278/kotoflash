"use client";

import { useState, useEffect } from "react";
import { getWords, Word, updateWord, deleteWord } from "@/lib/storage";
import Flashcard from "@/components/Flashcard";
import { ChevronLeft, ChevronRight, BookOpen, PlusCircle, CheckCircle2, RotateCcw, Home, Trash2, Edit3, AlertCircle, Check } from "lucide-react";
import Link from "next/link";

export default function ReviewContent() {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<"left" | "right" | "none">("none");
    const [mounted, setMounted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Edit/Delete State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [wordInput, setWordInput] = useState("");
    const [meaningInput, setMeaningInput] = useState("");

    useEffect(() => {
        setWords(getWords());
        setMounted(true);
    }, []);

    const handleNext = () => {
        if (words.length === 0) return;
        if (currentIndex === words.length - 1) {
            setIsFinished(true);
            return;
        }
        setDirection("right");
        setCurrentIndex((prev) => prev + 1);
    };

    const handlePrev = () => {
        if (words.length === 0 || currentIndex === 0) return;
        setDirection("left");
        setCurrentIndex((prev) => prev - 1);
    };

    const handleShuffle = () => {
        if (words.length === 0) return;
        setWords((prev) => [...prev].sort(() => Math.random() - 0.5));
        setCurrentIndex(0);
        setDirection("none");
    };

    const handleDelete = () => {
        const targetWord = words[currentIndex].word;
        deleteWord(targetWord);
        const newWords = words.filter((w) => w.word !== targetWord);
        setWords(newWords);
        setIsDeleteModalOpen(false);

        if (newWords.length === 0) {
            // Handled by return null/empty state
        } else if (currentIndex >= newWords.length) {
            setCurrentIndex(newWords.length - 1);
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        const targetWord = words[currentIndex].word;
        updateWord(targetWord, { word: wordInput, meaning: meaningInput });

        setWords((prev) =>
            prev.map((w, i) =>
                i === currentIndex ? { ...w, word: wordInput, meaning: meaningInput } : w
            )
        );
        setIsEditModalOpen(false);
    };

    const openEdit = () => {
        setWordInput(words[currentIndex].word);
        setMeaningInput(words[currentIndex].meaning);
        setIsEditModalOpen(true);
    };

    if (!mounted) return null;

    if (words.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto animate-in fade-in duration-700 bg-white">
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-100/50">
                    <BookOpen className="w-10 h-10 text-[#BC002D]" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                    Siap Belajar?
                </h2>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                    Koleksi kamu saat ini kosong. Tambahkan kata atau frasa baru untuk memulai sesi review.
                </p>
                <Link
                    href="/vocabulary"
                    className="flex items-center space-x-2 px-8 py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/30 transform active:scale-95"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>Tambah Kosa Kata</span>
                </Link>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-500 bg-white">
                <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-green-100/50 shadow-xl shadow-green-500/10">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                    Sesi Selesai!
                </h2>
                <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                    Mantap! Kamu sudah mereview semua <span className="text-slate-900 font-bold">{words.length}</span> kosa kata hari ini.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setIsFinished(false);
                            setDirection("none");
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-500/20 active:scale-95"
                    >
                        <RotateCcw className="w-5 h-5" />
                        <span>Ulang Sesi</span>
                    </button>
                    <Link
                        href="/"
                        className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-95"
                    >
                        <Home className="w-5 h-5" />
                        <span>Beranda</span>
                    </Link>
                </div>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative w-full max-w-7xl mx-auto bg-white overflow-hidden">
            {/* Mobile Title - Absolute to avoid pushing center content */}
            <div className="absolute top-6 left-6 right-6 sm:hidden pointer-events-none">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 rounded-xl text-[#BC002D]">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">Review Sesi</h2>
                        <p className="text-xs text-slate-400 font-medium tracking-tight">Asah kemampuanmu hari ini.</p>
                    </div>
                </div>
            </div>

            <div className="w-full flex flex-col items-center justify-center">
                <div className="w-full max-w-xl mb-6 md:mb-12 flex justify-between items-center bg-white p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm sm:bg-slate-50 sm:border-slate-100/50 sm:shadow-none translate-y-4 sm:translate-y-0">
                    <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"> Progress Sesi </h3>
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <div className="h-1.5 w-20 md:w-32 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#BC002D] transition-all duration-500 ease-out"
                                    style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                                {currentIndex + 1} <span className="text-slate-400 font-medium">/ {words.length}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {currentIndex === words.length - 1 && (
                            <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-100 animate-pulse">
                                TERAKHIR
                            </div>
                        )}
                        <button
                            onClick={handleShuffle}
                            className="px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-600 hover:text-[#BC002D] hover:border-red-200 transition-all flex items-center space-x-2 active:scale-95"
                            title="Acak Kartu"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                            </svg>
                            <span>ACAK</span>
                        </button>
                    </div>
                </div>

                {/* Animation Container */}
                <div className="w-full max-w-2xl relative min-h-[300px] md:min-h-[400px] flex items-center justify-center overflow-hidden py-4">
                    <div
                        key={currentIndex}
                        className={`w-full perspective-2000 ${direction === "right" ? "animate-slide-right" :
                            direction === "left" ? "animate-slide-left" : "animate-fade-in"
                            }`}
                    >
                        <div className="relative group">
                            <Flashcard word={currentWord} />

                            {/* Quick Actions Bar */}

                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 md:gap-10 mt-6 md:mt-12 w-full max-w-2xl">
                    <button
                        onClick={handlePrev}
                        className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white border border-slate-200/60 text-slate-400 hover:text-[#BC002D] hover:border-red-200 shadow-sm transition-all outline-none"
                        aria-label="Previous card"
                    >
                        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={handleNext}
                        className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white border border-slate-200/60 text-slate-400 hover:text-[#BC002D] hover:border-red-200 shadow-sm transition-all outline-none"
                        aria-label="Next card"
                    >
                        {currentIndex === words.length - 1 ? (
                            <div className="relative">
                                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-500 animate-in zoom-in duration-300" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">FINISH</span>
                            </div>
                        ) : (
                            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-1 transition-transform" />
                        )}
                    </button>
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                        <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Kata</h2>
                            <form onSubmit={handleUpdate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Kata / Frasa</label>
                                    <input
                                        type="text"
                                        value={wordInput}
                                        onChange={(e) => setWordInput(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Arti</label>
                                    <input
                                        type="text"
                                        value={meaningInput}
                                        onChange={(e) => setMeaningInput(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold">Batal</button>
                                    <button type="submit" className="flex-1 px-6 py-3.5 bg-[#BC002D] text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5" />
                                        <span>Simpan</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hapus Kata?</h2>
                            <p className="text-slate-500 mb-8">Tindakan ini tidak bisa dibatalkan.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-3.5 bg-slate-100 rounded-2xl font-bold">Batal</button>
                                <button onClick={handleDelete} className="flex-1 px-6 py-3.5 bg-red-500 text-white rounded-2xl font-bold">Hapus</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
