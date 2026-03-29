"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Languages,
    Zap,
    BookOpen,
    ChevronRight,
    ChevronLeft,
    X,
    Sparkles,
    Trophy,
    Rocket
} from "lucide-react";

const STEPS = [
    {
        title: "Selamat Datang di Kotoflash",
        description: "Aplikasi flashcard minimalis untuk membantu kamu belajar dan mengingat lebih baik.",
        icon: <Sparkles className="w-12 h-12 text-[#BC002D]" />,
        color: "bg-red-50"
    },
    {
        title: "Manajemen Kosa Kata",
        description: "Tambah kata-kata baru dengan mudah dan susun ke dalam koleksi untuk sesi belajar yang terfokus.",
        icon: <Languages className="w-12 h-12 text-slate-600" />,
        color: "bg-slate-50"
    },
    {
        title: "Review Cerdas",
        description: "Algoritma kami membantu kamu fokus pada kata-kata yang paling perlu perhatian.",
        icon: <Zap className="w-12 h-12 text-amber-500" />,
        color: "bg-amber-50"
    },
    {
        title: "Kuasai Progress Kamu",
        description: "Pantau pencapaianmu dan lihat perbendaharaan katamu tumbuh setiap hari.",
        icon: <Trophy className="w-12 h-12 text-emerald-500" />,
        color: "bg-emerald-50"
    },
    {
        title: "Siap untuk Memulai?",
        description: "Mari kita mulai sesi review pertamamu dan kuasai kata-kata baru!",
        icon: <Rocket className="w-12 h-12 text-blue-500" />,
        color: "bg-blue-50"
    }
];

export default function Onboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem("kotoflash_onboarding_seen");
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const finishOnboarding = () => {
        localStorage.setItem("kotoflash_onboarding_seen", "true");
        setIsVisible(false);
        router.push("/review");
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white border border-slate-200/60 rounded-[2.5rem] shadow-2xl p-8 space-y-8 relative overflow-hidden flex flex-col items-center text-center">
                {/* Progress header */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-[#BC002D] transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Close/Skip button */}
                <button
                    onClick={finishOnboarding}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Step Content */}
                <div className={`p-6 rounded-full ${step.color} transition-all duration-500 transform ${isVisible ? 'scale-100' : 'scale-50'}`}>
                    {step.icon}
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {step.title}
                    </h2>
                    <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">
                        {step.description}
                    </p>
                </div>

                {/* Dots */}
                <div className="flex space-x-2">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-[#BC002D]' : 'w-2 bg-slate-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`py-3.5 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all flex items-center justify-center space-x-2 ${currentStep === 0
                            ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Kembali</span>
                    </button>

                    <button
                        onClick={handleNext}
                        className="py-3.5 md:py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <span>{currentStep === STEPS.length - 1 ? "Ayo Mulai!" : "Lanjut"}</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {currentStep < STEPS.length - 1 && (
                    <button
                        onClick={finishOnboarding}
                        className="text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm uppercase tracking-widest pt-2"
                    >
                        Lewati Panduan
                    </button>
                )}
            </div>
        </div>
    );
}
