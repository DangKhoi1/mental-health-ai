
'use client';

import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

dayjs.extend(utc);
dayjs.extend(timezone);

const CITIES = [
    { name: "Hà Nội", timezone: "Asia/Ho_Chi_Minh", label: "VN" },
    { name: "New York", timezone: "America/New_York", label: "USA" },
    { name: "London", timezone: "Europe/London", label: "UK" },
    { name: "Tokyo", timezone: "Asia/Tokyo", label: "JP" },
    { name: "Sydney", timezone: "Australia/Sydney", label: "AUS" },
];

export default function FloatingWorldClock() {
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState<dayjs.Dayjs | null>(() => dayjs());
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedCity, setSelectedCity] = useState(CITIES[0]); // Default to Hanoi (VN)

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => setTime(dayjs()), 1000);
        return () => clearInterval(interval);
    }, [mounted]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!mounted || !time) return null;

    return (
        <div
            ref={containerRef}
            className="fixed top-[72px] right-4 lg:relative lg:top-auto lg:right-auto z-50 flex flex-col items-end gap-2"
        >
            {/* Float Button - Pill Shape showing Time */}
            <Button
                variant="outline"
                className="h-10 rounded-full shadow-md hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm border-border hover:bg-background flex items-center gap-2 px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Clock className="size-4 text-primary" />
                <span className="font-medium tabular-nums text-foreground">
                    {time.tz(selectedCity.timezone).format("HH:mm")}
                </span>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                    {selectedCity.label}
                </span>
            </Button>

            {/* Clock Panel */}
            {isOpen && (
                <Card className="absolute top-full right-0 w-80 shadow-2xl border-border animate-in fade-in slide-in-from-top-2 duration-200 mt-2 z-[100]">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30 rounded-t-lg">
                        <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                            <Globe className="size-3.5 text-primary" />
                            <span>Giờ thế giới</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-full hover:bg-background/80"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="size-3" />
                        </Button>
                    </div>
                    <CardContent className="p-2 max-h-[400px] overflow-y-auto">
                        <div className="space-y-1">
                            {CITIES.map((city) => (
                                <div
                                    key={city.name}
                                    className={`flex items-center justify-between p-2.5 rounded-md transition-colors cursor-pointer ${selectedCity.name === city.name ? 'bg-secondary/50' : 'hover:bg-muted/50'}`}
                                    onClick={() => {
                                        setSelectedCity(city);
                                        // Optional: close on select? setIsOpen(false); 
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${selectedCity.name === city.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                            {city.label}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${selectedCity.name === city.name ? 'text-primary' : 'text-foreground'}`}>{city.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{dayjs().tz(city.timezone).format("ddd, D MMM")}</span>
                                        </div>
                                    </div>
                                    <span className="text-base font-semibold text-foreground tabular-nums">
                                        {time.tz(city.timezone).format("HH:mm")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
