"use client"

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Globe } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

const cities = [
    {
        name: "Hà Nội",
        timezone: "Asia/Ho_Chi_Minh",
        label: "VN",
    },
    {
        name: "New York",
        timezone: "America/New_York",
        label: "USA",
    },
    {
        name: "London",
        timezone: "Europe/London",
        label: "UK",
    },
    {
        name: "Tokyo",
        timezone: "Asia/Tokyo",
        label: "JP",
    },
    {
        name: "Sydney",
        timezone: "Australia/Sydney",
        label: "AUS",
    },
];

export default function WorldClock() {
    const [time, setTime] = useState<dayjs.Dayjs | null>(() => dayjs());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => {
            setTime(dayjs());
        }, 1000);
        return () => clearInterval(interval);
    }, [mounted]);

    if (!mounted || !time) return null;

    return (
        <section className="py-16 pb-32 px-4 sm:px-6 lg:px-8 bg-sky-50/30 border-y border-sky-100/50">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground border border-border shadow-sm">
                            <Globe className="h-3.5 w-3.5" />
                            <span>Kết nối toàn cầu</span>
                        </div>
                        <h2 className="text-3xl font-medium text-foreground tracking-tight">Nhịp sống thế giới</h2>
                    </div>
                    <p className="text-muted-foreground max-w-md md:max-w-none text-sm md:text-base whitespace-normal md:whitespace-nowrap">
                        Dù bạn ở đâu, hãy luôn nhớ dành thời gian để chăm sóc bản thân.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {cities.map((city) => (
                        <Card key={city.name} className="group overflow-hidden border-border/50 bg-background/50 hover:bg-background hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-300">
                            <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="h-10 w-10 rounded-full bg-sky-50/50 flex items-center justify-center text-sky-600 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-medium text-foreground">{city.name}</h3>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{city.label}</p>
                                </div>
                                <div className="text-xl font-semibold text-foreground tabular-nums tracking-tight">
                                    {time.tz(city.timezone).format("HH:mm")}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}