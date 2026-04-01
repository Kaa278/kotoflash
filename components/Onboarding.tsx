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

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

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
        title: "Developer Information",
        description: "Aplikasi ini dikembangkan oleh Kaa untuk komunitas pembelajar bahasa Jepang.\n\n📸 @kaa.studio • 🐦 @kaa_dev",
        icon: <BookOpen className="w-12 h-12 text-indigo-500" />,
        color: "bg-indigo-50"
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
            <div className="max-w-md w-full h-[580px] bg-white border border-slate-200/60 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                {/* Progress header */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-[#BC002D] transition-all duration-500 ease-out"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Skip button at top right */}
                <button
                    onClick={finishOnboarding}
                    className="absolute top-8 right-10 py-2 px-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
                >
                    Lewati
                </button>

                {/* Step Content */}
                <div className="mt-20 w-full px-10 flex flex-col items-center">
                    <div className="h-32 flex items-center justify-center mb-10 shrink-0">
                        <div className={`w-32 h-32 rounded-full ${step.color} flex items-center justify-center transition-all duration-500 transform ${isVisible ? 'scale-100' : 'scale-50'}`}>
                            {step.icon}
                        </div>
                    </div>

                    <div className="h-44 flex flex-col justify-start space-y-4 px-4">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            {step.title}
                        </h2>
                        {step.title === "Developer Information" ? (
                            <div className="flex flex-col items-center space-y-3 pt-2">
                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[280px]">
                                    Aplikasi ini dikembangkan dengan ❤️ oleh Kaa untuk pembelajar bahasa Jepang.
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full border border-pink-100 shadow-sm transition-all hover:scale-105">
                                        <InstagramIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold tracking-wider">@errdhikaa</span>
                                    </div>
                                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm transition-all hover:scale-105">
                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold tracking-wider">085176729586</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">
                                {step.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Controls (Fixed at bottom) */}
                <div className="absolute bottom-10 left-0 right-0 px-10 flex flex-col items-center space-y-8">
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
                            className={`py-3.5 md:py-4 rounded-2xl font-bold text-sm md:text-base transition-all flex items-center justify-center space-x-2 border-2 ${currentStep === 0
                                ? 'bg-white border-slate-50 text-slate-200 cursor-not-allowed'
                                : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 active:scale-95'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Kembali</span>
                        </button>

                        <button
                            onClick={handleNext}
                            className="py-3.5 md:py-4 bg-[#BC002D] hover:bg-red-700 text-white rounded-2xl font-bold text-sm md:text-base transition-all shadow-lg active:scale-90 flex items-center justify-center space-x-2"
                        >
                            <span>{currentStep === STEPS.length - 1 ? "Ayo Mulai!" : "Lanjut"}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* No more bottom skip */}
            </div>
        </div>
    );
}
