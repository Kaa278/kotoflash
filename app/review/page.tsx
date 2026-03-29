"use client";

import ReviewContent from "@/components/ReviewContent";
import Onboarding from "@/components/Onboarding";

export default function ReviewPage() {
    return (
        <div className="flex-1 flex flex-col relative overflow-hidden">
            <ReviewContent />
            <Onboarding />
        </div>
    );
}
