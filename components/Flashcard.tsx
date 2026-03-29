"use client";

import { useState, useEffect } from "react";
import { Word } from "@/lib/storage";
import { Sparkles, Languages } from "lucide-react";

interface FlashcardProps {
    word: Word;
}

export default function Flashcard({ word }: FlashcardProps) {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        setFlipped(false);
    }, [word]);

    return (
        <div
            onClick={() => setFlipped(!flipped)}
            className="relative w-full max-w-xl mx-auto aspect-[1.618/1] cursor-pointer group perspective-2000"
        >
            <div
                className={`w-full h-full transition-all duration-700 ease-out transform-style-3d ${flipped ? "rotate-y-180" : ""
                    }`}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front Side */}
                <div
                    className="absolute inset-0 w-full h-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/50 flex flex-col items-center justify-center p-10 backface-hidden z-20 transition-all overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    {/* Wavy Background - Front */}
                    <div className="absolute inset-0 z-0 flex flex-col pointer-events-none rounded-[2.5rem] overflow-hidden">
                        <div className="flex-[4] w-full bg-white"></div>
                        <div className="flex-1 w-full bg-slate-50 relative">
                            <svg className="absolute w-full h-[160px] top-0 left-0 -mt-[159px] text-slate-50" preserveAspectRatio="none" viewBox="0 0 1440 320" fill="currentColor">
                                <path d="M0,64 C240,16 480,224 720,160 C960,96 1200,32 1440,128 L1440,320 L0,320 Z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="absolute top-8 left-8 text-slate-300 z-10 pointer-events-none opacity-50">
                        <Languages className="w-10 h-10" />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 text-center select-none z-10 px-4 md:px-8 leading-tight">
                        {word.word}
                    </h2>
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 w-full h-full bg-[#BC002D] rounded-[2.5rem] shadow-2xl shadow-red-500/30 border border-red-500/80 flex flex-col items-center justify-center p-10 backface-hidden transition-all overflow-hidden"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                    }}
                >
                    {/* Wavy Background - Back */}
                    <div className="absolute inset-0 z-0 flex flex-col pointer-events-none rounded-[2.5rem] overflow-hidden opacity-50">
                        <div className="flex-[4] w-full bg-[#BC002D]"></div>
                        <div className="flex-1 w-full bg-[#a00026] relative">
                            <svg className="absolute w-full h-[160px] top-0 left-0 -mt-[159px] text-[#a00026]" preserveAspectRatio="none" viewBox="0 0 1440 320" fill="currentColor">
                                <path d="M0,64 C240,16 480,224 720,160 C960,96 1200,32 1440,128 L1440,320 L0,320 Z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="absolute top-8 left-8 text-white/20 z-10 pointer-events-none">
                        <Languages className="w-10 h-10" />
                    </div>

                    <p className="text-xl md:text-3xl font-bold text-white text-center select-none leading-relaxed px-4 md:px-8 z-10 relative drop-shadow-sm">
                        {word.meaning}
                    </p>
                </div>
            </div>
        </div>
    );
}
