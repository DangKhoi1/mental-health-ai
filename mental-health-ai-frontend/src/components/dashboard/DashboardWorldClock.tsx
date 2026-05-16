
'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

const CITIES = [
    { name: "Hà Nội", timezone: "Asia/Ho_Chi_Minh", label: "VN" },
    { name: "New York", timezone: "America/New_York", label: "USA" },
    { name: "London", timezone: "Europe/London", label: "UK" },
    { name: "Tokyo", timezone: "Asia/Tokyo", label: "JP" },
    { name: "Sydney", timezone: "Australia/Sydney", label: "AUS" },
];

export default function DashboardWorldClock() {
    const [time, setTime] = useState<dayjs.Dayjs | null>(() => dayjs());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const interval = setInterval(() => setTime(dayjs()), 1000);
        return () => clearInterval(interval);
    }, [mounted]);

    if (!mounted || !time) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Giờ thế giới</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {CITIES.map((city) => (
                    <Card key={city.name} className="hover:shadow-md transition-shadow bg-card/50">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                <Clock className="h-3 w-3" />
                                {city.label}
                            </div>
                            <div className="text-2xl font-semibold text-foreground tabular-nums">
                                {time.tz(city.timezone).format("HH:mm")}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground">{city.name}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
