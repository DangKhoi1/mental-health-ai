"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Button } from "@/components/ui/Button"
import { Calendar } from "./calendar"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Chọn ngày",
  label,
  disablePastDates = false,
  disableFutureDates = false,
}: DatePickerProps) {
  const dateObj = value ? new Date(value) : undefined;
  const today = new Date();
  const currentYear = today.getFullYear();
  const fromYear = 1900;
  const toYear = disableFutureDates ? currentYear : currentYear + 10;
  
  const monthLabels = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i);

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

  const selectClass = "h-9 px-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 w-full";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full px-4 py-3 text-sm bg-muted border rounded-xl flex items-center justify-start focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all font-normal shadow-none border-border",
          !dateObj && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 size-4 opacity-50" />
        <span className="truncate">{dateObj ? format(dateObj, "dd/MM/yyyy", { locale: vi }) : placeholder}</span>
      </button>

      {mounted && open
        ? createPortal(
          <div className="fixed inset-0 z-[200]">
            <button
              type="button"
              aria-label="Đóng chọn ngày"
              className="absolute inset-0 bg-black/40 w-full h-full border-none outline-none cursor-default"
              onClick={() => setOpen(false)}
            />

            <div className="absolute inset-x-0 bottom-0 sm:inset-0 pointer-events-none sm:flex sm:items-center sm:justify-center p-3 sm:p-4">
              <div className="relative w-full max-w-[340px] pointer-events-auto mx-auto rounded-2xl border border-border bg-background shadow-xl">
                <div className="p-3 flex flex-col items-center">
                  <div className="mb-3 grid w-[calc(100%-1rem)] max-w-[320px] grid-cols-2 gap-2">
                    {/* Native selects avoid nested Radix portal z-index issues */}
                    <select
                      className={selectClass}
                      value={viewMonth.getMonth()}
                      onChange={(e) => {
                        const next = new Date(viewMonth);
                        next.setMonth(Number(e.target.value));
                        setViewMonth(next);
                      }}
                    >
                      {monthLabels.map((label, idx) => (
                        <option key={label} value={idx}>{label}</option>
                      ))}
                    </select>
                    <select
                      className={selectClass}
                      value={viewMonth.getFullYear()}
                      onChange={(e) => {
                        const next = new Date(viewMonth);
                        next.setFullYear(Number(e.target.value));
                        setViewMonth(next);
                      }}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex w-full justify-center">
                    <Calendar
                      mode="single"
                      captionLayout="label"
                      className="p-1 [--cell-size:2rem] sm:[--cell-size:1.8rem]"
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

                  <div className="mt-2 flex w-full justify-end px-2">
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
    </div>
  )
}
