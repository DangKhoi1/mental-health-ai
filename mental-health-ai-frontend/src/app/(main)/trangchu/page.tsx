'use client';

import { useEffect } from 'react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/homepage/HeroSection";
import IntroSection from "@/components/homepage/IntroSection";
import ExperienceSection from "@/components/homepage/ExperienceSection";
import InspirationSection from "@/components/homepage/InspirationSection";
import CalmSliderSection from "@/components/homepage/CalmSliderSection";
import FAQSection from "@/components/homepage/FAQSection";
import GentleCTASection from "@/components/homepage/GentleCTASection";
import WorldClock from "@/components/homepage/WorldClock";
import QuickAssessmentSection from "@/components/homepage/QuickAssessmentSection";
import WelcomeSection from "@/components/homepage/WelcomeSection";
import { useMusicStore } from "@/stores/musicStore";

export default function LandingPage() {
    const { setCurrentTrack, setIsPlaying, setIsOpen } = useMusicStore();

    useEffect(() => {
        // Small delay to allow MusicPlayer to initialize first
        const timeout = setTimeout(() => {
            const pianoTrack = {
                id: 3,
                title: 'Piano Nhẹ Nhàng',
                url: '/atlasaudio-soft-509813.mp3',
            };
            setCurrentTrack(pianoTrack);
            setIsPlaying(true);
            setIsOpen(true);
        }, 100);

        return () => clearTimeout(timeout);
    }, [setCurrentTrack, setIsPlaying, setIsOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-linear-to-br from-sky-50/40 via-[#f0f4ea] to-blue-50/30 overflow-x-hidden">
            <Header />
            <WelcomeSection />
            <HeroSection />
            <IntroSection />
            <ExperienceSection />
            <CalmSliderSection />
            <QuickAssessmentSection />
            <InspirationSection />
            <GentleCTASection />
            <FAQSection />
            <WorldClock />
            <Footer />
        </div>
    );
}
