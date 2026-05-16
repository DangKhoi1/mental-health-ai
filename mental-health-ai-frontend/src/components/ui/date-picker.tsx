"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Chọn ngày",
  disablePastDates = false,
  disableFutureDates = false,
}: DatePickerProps) {
  const dateObj = value ? new Date(value) : undefined;
  const today = new Date();
  const currentYear = today.getFullYear();
  const fromYear = 1900;
  const toYear = disableFutureDates ? currentYear : currentYear + 10;
  const monthLabels = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const [viewMonth, setViewMonth] = React.useState<Date>(dateObj || today);
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (dateObj && !Number.isNaN(dateObj.getTime())) {
      setViewMonth(dateObj);
    }
  }, [value]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const disabledDays =
    disablePastDates && disableFutureDates
      ? undefined
      : disablePastDates
        ? { before: startOfToday }
        : disableFutureDates
          ? { after: startOfToday }
          : undefined;

  return (
    <>
      <Button
        type="button"
        variant={"outline"}
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-start text-left font-normal shadow-none",
          !dateObj && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
        <span className="truncate">{dateObj ? format(dateObj, "dd/MM/yyyy", { locale: vi }) : placeholder}</span>
      </Button>

      {mounted && open
        ? createPortal(
          <div className="fixed inset-0 z-[100]">
            <button
              type="button"
              aria-label="Đóng chọn ngày"
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
            />

            <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3 sm:p-4">
              <div className="relative w-full max-w-sm mx-auto rounded-2xl border border-border bg-background shadow-xl">
                <div className="p-3 flex flex-col items-center">
                  <div className="mb-3 grid w-full max-w-xs grid-cols-2 gap-2">
          <Select
            value={String(viewMonth.getMonth())}
            onValueChange={(month) => {
              const next = new Date(viewMonth);
              next.setMonth(Number(month));
              setViewMonth(next);
            }}
          >
            <SelectTrigger className="h-9 rounded-lg bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthLabels.map((label, index) => (
                <SelectItem key={label} value={String(index)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(viewMonth.getFullYear())}
            onValueChange={(year) => {
              const next = new Date(viewMonth);
              next.setFullYear(Number(year));
              setViewMonth(next);
            }}
          >
            <SelectTrigger className="h-9 rounded-lg bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i).map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                  </div>

                  <div className="flex w-full justify-center">
                    <Calendar
                      mode="single"
                      captionLayout="label"
                      className="p-1 [--cell-size:2.25rem] sm:[--cell-size:2rem]"
                      month={viewMonth}
                      onMonthChange={setViewMonth}
                      selected={dateObj}
                      disabled={disabledDays}
                      onSelect={(d) => {
                        const v = d ? format(d, 'yyyy-MM-dd') : '';
                        onChange(v);
                        setOpen(false);
                      }}
                      initialFocus
                    />
                  </div>

                  <div className="mt-2 flex w-full justify-end">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
  )
}
