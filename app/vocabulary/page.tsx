"use client";

import { useState, useEffect, useRef } from "react";
import { getWords, saveWord, deleteWord, Word, updateWord } from "@/lib/storage";
import { Trash2, Plus, Languages, BookText, AlertCircle, Sparkles, Loader2, Wand2, X, Check, Save, Send, MessageSquare, Bot, User, Search, CheckSquare, Square, MinusSquare, ListChecks, CheckCheck, ArrowUpDown, SortAsc, SortDesc, Clock, Calendar } from "lucide-react";

export default function VocabularyPage() {
    const [words, setWords] = useState<Word[]>([]);
    const [wordInput, setWordInput] = useState("");
    const [meaningInput, setMeaningInput] = useState("");
    const [mounted, setMounted] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; hasAction?: boolean }[]>([]);
    const [generatedWords, setGeneratedWords] = useState<Word[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    const [wordToDelete, setWordToDelete] = useState<string | null>(null);
    const [editingWord, setEditingWord] = useState<Word | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setWords(getWords());
        setMounted(true);
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages.length, isGenerating, isAIModalOpen]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wordInput.trim() || !meaningInput.trim()) return;

        if (editingWord) {
            updateWord(editingWord.word, {
                word: wordInput.trim(),
                meaning: meaningInput.trim(),
            });
            setWords((prev) =>
                prev.map((w) =>
                    w.word === editingWord.word
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

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isGenerating) return;

        const userPrompt = chatInput.trim();
        setChatInput("");

        // Handle slash commands
        if (userPrompt === "/clear") {
            setChatMessages([]);
            return;
        }

        setChatMessages(prev => [...prev, { role: "user", content: userPrompt }]);
        setIsGenerating(true);
        setError(null);

        try {
            const isNative = typeof window !== "undefined" &&
                ((window as any).Capacitor?.isNativePlatform || window.location.protocol === 'capacitor:');

            const apiUrl = isNative
                ? "https://kotoflash.vercel.app/api/generate"
                : "/api/generate";

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userPrompt }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Gagal membuat kosa kata. Coba lagi nanti.");
            }

            const data = await response.json();
            const rawData: Word[] = data.words;

            // Filter out already existing words
            const filteredData = rawData.filter(newWord =>
                !words.some(existing => existing.word.toLowerCase() === newWord.word.toLowerCase())
            );

            // Update chat with AI message and action flag
            setChatMessages(prev => [...prev, {
                role: "assistant",
                content: filteredData.length === 0 && rawData.length > 0
                    ? "Sepertinya kosa kata yang Anda minta sudah ada di daftar Anda! Silakan cek kembali ya."
                    : data.message,
                hasAction: filteredData.length > 0
            }]);

            setGeneratedWords(filteredData);
            setIsGenerating(false);

        } catch (err: any) {
            setError(err.message);
            setChatMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan saat menghubungi AI." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdateGenerated = (word: string, field: "word" | "meaning", value: string) => {
        setGeneratedWords(prev => prev.map(w =>
            w.word === word ? { ...w, [field]: value } : w
        ));
    };

    const handleDeleteGenerated = (word: string) => {
        setGeneratedWords(prev => prev.filter(w => w.word !== word));
    };

    const handleSaveAllGenerated = () => {
        for (const item of generatedWords) {
            saveWord({
                word: item.word,
                meaning: item.meaning,
            });
        }

        // Refresh state from storage to ensure perfect synchronization
        setWords(getWords());
        setGeneratedWords([]);
        setIsReviewModalOpen(false);
    };

    const toggleSelect = (word: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(word)) {
                next.delete(word);
            } else {
                next.add(word);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredWords.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredWords.map(w => w.word)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        const wordsToDelete = Array.from(selectedIds);
        wordsToDelete.forEach(word => deleteWord(word));

        setWords(prev => prev.filter(w => !selectedIds.has(w.word)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setShowBulkDeleteConfirm(false);
    };

    const filteredWords = words.filter(w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedWords = [...filteredWords].sort((a, b) => {
        if (sortBy === "newest") return 1; // Array is prepended in handleAdd, so essentially already sorted by newest if we keep it that way
        if (sortBy === "oldest") return -1;
        if (sortBy === "a-z") return a.word.localeCompare(b.word);
        if (sortBy === "z-a") return b.word.localeCompare(a.word);
        return 0;
    });

    // In Next.js/React, the above sort logic for "newest" might be simplified.
    // Actually, "newest" in our app means "last added is first in array".
    // If we want to change sort order, we can just reverse the filteredWords.
    const finalSortedWords = sortBy === "oldest" ? [...sortedWords].reverse() : sortedWords;

    const confirmDelete = (word: string) => {
        setWordToDelete(word);
    };

    const handleDelete = () => {
        if (!wordToDelete) return;
        deleteWord(wordToDelete);
        setWords((prev) => prev.filter((w) => w.word !== wordToDelete));
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

            {/* Search and Bulk Actions */}
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari kosa kata..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                    </div>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-2xl p-1">
                        {[
                            { id: "newest", icon: Clock, label: "Baru" },
                            { id: "a-z", icon: SortAsc, label: "A-Z" }
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSortBy(option.id as any)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === option.id
                                    ? "bg-white text-[#BC002D] shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <option.icon className="w-3.5 h-3.5" />
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            if (isSelectionMode) {
                                setSelectedIds(new Set());
                            }
                            setIsSelectionMode(!isSelectionMode);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-2 font-bold ${isSelectionMode
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-[#BC002D]"
                            }`}
                    >
                        {isSelectionMode ? <X className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
                        <span className="hidden sm:inline">{isSelectionMode ? "Batal" : "Pilih"}</span>
                    </button>
                </div>

                {isSelectionMode && (
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center space-x-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all"
                            >
                                {selectedIds.size === filteredWords.length ? (
                                    <CheckSquare className="w-5 h-5 text-red-400" />
                                ) : selectedIds.size > 0 ? (
                                    <MinusSquare className="w-5 h-5 text-red-400" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                                <span className="text-sm font-bold">Semua</span>
                            </button>
                            <div className="h-4 w-px bg-white/20" />
                            <span className="text-sm font-bold text-slate-300">{selectedIds.size} dipilih</span>
                        </div>
                        <button
                            onClick={() => setShowBulkDeleteConfirm(true)}
                            disabled={selectedIds.size === 0}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:grayscale transition-all text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Collection List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                        <BookText className="w-4 h-4" />
                        <span>KOLEKSI ({words.length})</span>
                    </h2>
                    {words.length > 0 && searchQuery && (
                        <p className="text-xs font-bold text-slate-400">Ditemukan {filteredWords.length} kata</p>
                    )}
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
                        {finalSortedWords.map((w, idx) => (
                            <div
                                key={`${w.word}-${idx}`}
                                onClick={() => isSelectionMode ? toggleSelect(w.word) : openEdit(w)}
                                className={`group relative flex items-center justify-between p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border transition-all duration-300 cursor-pointer ${selectedIds.has(w.word)
                                    ? "bg-red-50/50 border-red-200 shadow-md"
                                    : "bg-white border-slate-200/50 hover:border-red-200 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex items-center flex-1 min-w-0 pr-1 sm:pr-4">
                                    {isSelectionMode && (
                                        <div className={`mr-3 sm:mr-4 transition-all ${selectedIds.has(w.word) ? "text-[#BC002D]" : "text-slate-300 group-hover:text-slate-400"
                                            }`}>
                                            {selectedIds.has(w.word) ? (
                                                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                                            ) : (
                                                <Square className="w-5 h-5 sm:w-6 sm:h-6" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm sm:text-xl text-slate-900 truncate leading-tight mb-0.5">{w.word}</p>
                                        <p className="text-[10px] sm:text-lg text-slate-500 line-clamp-1 leading-tight">{w.meaning}</p>
                                    </div>
                                </div>
                                {!isSelectionMode && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDelete(w.word);
                                        }}
                                        className="p-1 sm:p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg sm:rounded-2xl transition-all"
                                        aria-label="Delete word"
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </button>
                                )}
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
                                    Kata / Kanji
                                </label>
                                <input
                                    id="word"
                                    type="text"
                                    value={wordInput}
                                    onChange={(e) => setWordInput(e.target.value)}
                                    placeholder="contoh: 食べる atau 木漏れ日"
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

            {/* AI Review Modal */}
            {isReviewModalOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                            setIsReviewModalOpen(false);
                            setIsAIModalOpen(true);
                        }}
                    />
                    <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-red-50 rounded-2xl text-[#BC002D]">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Hasil Generator AI</h2>
                                    <p className="text-sm text-slate-500">Tinjau dan edit sebelum menyimpan ke koleksi.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsReviewModalOpen(false);
                                    setIsAIModalOpen(true);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {generatedWords.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400">Tidak ada kata untuk ditampilkan.</p>
                                </div>
                            ) : (
                                generatedWords.map((word, idx) => (
                                    <div key={`${word.word}-${idx}`} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-red-100 hover:bg-red-50/30">
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">KATA / KANJI</label>
                                                <input
                                                    type="text"
                                                    value={word.word}
                                                    onChange={(e) => handleUpdateGenerated(word.word, "word", e.target.value)}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-[#BC002D] outline-none transition-all text-sm font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ARTI (INDONESIA)</label>
                                                <input
                                                    type="text"
                                                    value={word.meaning}
                                                    onChange={(e) => handleUpdateGenerated(word.word, "meaning", e.target.value)}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-[#BC002D] outline-none transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <button
                                                onClick={() => handleDeleteGenerated(word.word)}
                                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
                                                title="Hapus kata ini"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                            <button
                                onClick={() => {
                                    setIsReviewModalOpen(false);
                                    setIsAIModalOpen(true);
                                }}
                                className="flex-1 px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveAllGenerated}
                                disabled={generatedWords.length === 0}
                                className="flex-[2] px-6 py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold transition-all disabled:opacity-30 disabled:grayscale shadow-xl shadow-red-500/10 flex items-center justify-center space-x-2 active:scale-95"
                            >
                                <Check className="w-5 h-5" />
                                <span>Simpan Semua ({generatedWords.length})</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* AI Chat Modal */}
            {isAIModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => !isGenerating && setIsAIModalOpen(false)}
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[600px] max-h-[85vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-red-50 rounded-2xl text-[#BC002D]">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Kathlyn — Kotoflash AI</h2>
                                    <div className="flex items-center space-x-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Online</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAIModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-8">
                                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-red-500">
                                        <Bot className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Halo! Saya Kathlyn, asisten belajar Anda.</p>
                                        <p className="text-sm text-slate-500 mt-1">Katakan apa saja untuk mulai membuat kosa kata bahasa Jepang.</p>
                                    </div>
                                </div>
                            ) : (
                                chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === "user" ? "bg-[#BC002D] text-white" : "bg-white text-[#BC002D] border border-slate-100"}`}>
                                                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                            </div>
                                            <div className="space-y-2">
                                                <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"}`}>
                                                    {msg.content}
                                                </div>
                                                {msg.hasAction && (
                                                    <button
                                                        onClick={() => {
                                                            setIsAIModalOpen(false);
                                                            setIsReviewModalOpen(true);
                                                        }}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-[#BC002D] hover:bg-red-100 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm animate-in zoom-in duration-300"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        <span>Review Kosa Kata</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isGenerating && (
                                <div className="flex justify-start animate-in fade-in duration-300">
                                    <div className="flex items-start space-x-2">
                                        <div className="w-8 h-8 rounded-xl bg-white text-[#BC002D] border border-slate-100 flex items-center justify-center shadow-sm">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                                            <div className="flex space-x-1">
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kathlyn sedang menyiapkan materi...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center space-x-2 mx-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <form onSubmit={handleChat} className="relative flex items-center">
                                <textarea
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleChat(e as any);
                                        }
                                    }}
                                    placeholder="Tanya apa saja..."
                                    className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500/10 focus:border-[#BC002D] outline-none transition-all placeholder:text-slate-400 font-medium resize-none overflow-y-auto max-h-32"
                                    disabled={isGenerating}
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isGenerating}
                                    className="absolute right-2 p-3 bg-[#BC002D] hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-30 disabled:grayscale transform active:scale-90 shadow-lg shadow-red-500/20"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">Powered by Kathlyn</p>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Delete Confirmation Modal */}
            {
                wordToDelete && (
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
                            <p className="text-slate-500 mb-8 px-2 leading-relaxed text-sm">Tindakan ini tidak bisa dibatalkan. Apakah kamu yakin ingin menghapus kata ini dari koleksimu?</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setWordToDelete(null)}
                                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bulk Delete Confirmation Modal */}
            {
                showBulkDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowBulkDeleteConfirm(false)}
                        />
                        <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Hapus {selectedIds.size} Kata?</h3>
                            <p className="text-slate-500 mb-8 px-2 leading-relaxed text-sm">Semua kosa kata yang dipilih akan dihapus permanen dari koleksi Anda.</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                    className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all active:scale-95 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
