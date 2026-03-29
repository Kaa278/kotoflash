"use client";

import { useState, useEffect } from "react";
import { getWords, saveWord, deleteWord, Word, updateWord } from "@/lib/storage";
import { Trash2, Plus, Languages, BookText, AlertCircle, Sparkles, Loader2, Wand2 } from "lucide-react";

export default function VocabularyPage() {
    const [words, setWords] = useState<Word[]>([]);
    const [wordInput, setWordInput] = useState("");
    const [meaningInput, setMeaningInput] = useState("");
    const [mounted, setMounted] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState("");
    const [generatedCount, setGeneratedCount] = useState(5);
    const [error, setError] = useState<string | null>(null);

    const [wordToDelete, setWordToDelete] = useState<string | null>(null);
    const [editingWord, setEditingWord] = useState<Word | null>(null);

    useEffect(() => {
        setWords(getWords());
        setMounted(true);
    }, []);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wordInput.trim() || !meaningInput.trim()) return;

        if (editingWord) {
            updateWord(editingWord.id, {
                word: wordInput.trim(),
                meaning: meaningInput.trim(),
            });
            setWords((prev) =>
                prev.map((w) =>
                    w.id === editingWord.id
                        ? { ...w, word: wordInput.trim(), meaning: meaningInput.trim() }
                        : w
                )
            );
        } else {
            const newWord = saveWord({
                word: wordInput.trim(),
                meaning: meaningInput.trim(),
            });
            setWords((prev) => [newWord, ...prev]);
        }

        setWordInput("");
        setMeaningInput("");
        setEditingWord(null);
        setIsModalOpen(false);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, count: generatedCount }),
            });

            if (!response.ok) throw new Error("Gagal membuat kosa kata. Coba lagi nanti.");

            const data = await response.json();

            // Save each generated word
            const newWords: Word[] = [];
            for (const item of data) {
                const saved = saveWord({
                    word: item.word,
                    meaning: item.meaning,
                });
                newWords.push(saved);
            }

            setWords((prev) => [...newWords, ...prev]);
            setTopic("");
            setIsAIModalOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmDelete = (id: string) => {
        setWordToDelete(id);
    };

    const handleDelete = () => {
        if (!wordToDelete) return;
        deleteWord(wordToDelete);
        setWords((prev) => prev.filter((w) => w.id !== wordToDelete));
        setWordToDelete(null);
    };

    const openEdit = (word: Word) => {
        setEditingWord(word);
        setWordInput(word.word);
        setMeaningInput(word.meaning);
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingWord(null);
        setWordInput("");
        setMeaningInput("");
        setIsModalOpen(true);
    };

    if (!mounted) return null;

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 w-full animate-in fade-in duration-500 bg-white min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2 border-b border-slate-100 pb-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="p-2 md:p-3 bg-red-50 rounded-2xl text-[#BC002D]">
                        <Languages className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kosa Kata</h1>
                        <p className="text-sm md:text-lg text-slate-500">Bangun kamus pribadimu.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-3 md:py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg active:scale-95 group"
                    >
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                        <span>AI</span>
                    </button>
                    <button
                        onClick={openAdd}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-3 md:py-3.5 bg-[#BC002D] hover:bg-red-700 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Tambah</span>
                    </button>
                </div>
            </div>

            {/* Collection List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <BookText className="w-4 h-4" />
                        <span>KOLEKSI ({words.length})</span>
                    </h2>
                </div>

                {words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 font-sans">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-slate-400 font-medium mb-6 text-lg">Koleksi kamu kosong.</p>
                        <button
                            onClick={openAdd}
                            className="text-[#BC002D] font-bold hover:underline"
                        >
                            Tambah kata pertamamu
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {words.map((w) => (
                            <div
                                key={w.id}
                                className="group relative flex items-center justify-between p-3 sm:p-6 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/50 hover:border-red-200 hover:shadow-md transition-all duration-300"
                            >
                                <div
                                    className="flex-1 min-w-0 pr-1 sm:pr-4 cursor-pointer"
                                    onClick={() => openEdit(w)}
                                >
                                    <p className="font-bold text-sm sm:text-xl text-slate-900 truncate leading-tight mb-0.5">{w.word}</p>
                                    <p className="text-[10px] sm:text-lg text-slate-500 line-clamp-1 leading-tight">{w.meaning}</p>
                                </div>
                                <button
                                    onClick={() => confirmDelete(w.id)}
                                    className="p-1 sm:p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg sm:rounded-2xl transition-all"
                                    aria-label="Delete word"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Word Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingWord ? "Edit Kata" : "Tambah Kata Baru"}</h2>
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="word">
                                    Kata / Frasa
                                </label>
                                <input
                                    id="word"
                                    type="text"
                                    value={wordInput}
                                    onChange={(e) => setWordInput(e.target.value)}
                                    placeholder="contoh: komorebi"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1" htmlFor="meaning">
                                    Arti
                                </label>
                                <input
                                    id="meaning"
                                    type="text"
                                    value={meaningInput}
                                    onChange={(e) => setMeaningInput(e.target.value)}
                                    placeholder="contoh: cahaya matahari di sela pepohonan"
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all flex-1"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!wordInput.trim() || !meaningInput.trim()}
                                    className="flex-1 px-6 py-3.5 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all disabled:opacity-30 disabled:grayscale transform active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>{editingWord ? "Simpan" : "Tambah"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Generation Modal */}
            {isAIModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => !isGenerating && setIsAIModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-red-50 rounded-2xl text-[#BC002D]">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Generator AI</h2>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">
                                    Topik / Kategori
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="contoh: Wisata, Memasak, Bisnis"
                                    disabled={isGenerating}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">
                                    Jumlah Kata ({generatedCount})
                                </label>
                                <input
                                    type="range"
                                    min="3"
                                    max="15"
                                    value={generatedCount}
                                    onChange={(e) => setGeneratedCount(parseInt(e.target.value))}
                                    disabled={isGenerating}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#BC002D]"
                                />
                                <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                                    <span>3</span>
                                    <span>15</span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAIModalOpen(false)}
                                    disabled={isGenerating}
                                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all flex-1"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!topic.trim() || isGenerating}
                                    className="flex-[2] px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold transition-all disabled:opacity-30 disabled:grayscale transform active:scale-95 shadow-xl shadow-slate-900/10 flex items-center justify-center space-x-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Sedang Membuat...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            <span>Buat Daftar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {wordToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setWordToDelete(null)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Hapus Kata?</h2>
                        <p className="text-slate-500 mb-8 px-2 leading-relaxed">Tindakan ini tidak bisa dibatalkan. Apakah kamu yakin ingin menghapus kata ini dari koleksimu?</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setWordToDelete(null)}
                                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
