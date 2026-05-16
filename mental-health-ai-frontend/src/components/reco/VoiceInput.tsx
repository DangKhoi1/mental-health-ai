"use client";

import "regenerator-runtime/runtime";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
    onResult: (text: string) => void;
    language?: "vi-VN" | "en-US";
    buttonClassName?: string;
}

export default function VoiceInput({
    onResult,
    language = "vi-VN",
    buttonClassName = "",
}: VoiceInputProps) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    } = useSpeechRecognition();
    const [isOpen, setIsOpen] = useState(false);
    const isMounted = typeof document !== 'undefined';
    const [voiceError, setVoiceError] = useState<string>("");
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    const startListening = async () => {
        if (!browserSupportsSpeechRecognition) {
            toast.error("Trình duyệt hiện tại không hỗ trợ nhập liệu bằng giọng nói.");
            return;
        }

        if (isMicrophoneAvailable === false) {
            setVoiceError("Không thể truy cập micro. Vui lòng cấp quyền micro cho trình duyệt.");
            toast.error("Không thể truy cập micro. Vui lòng cấp quyền rồi thử lại.");
            return;
        }

        resetTranscript();
        setVoiceError("");
        setIsOpen(true);

        try {
            await SpeechRecognition.startListening({
                continuous: true,
                language: language,
            });
        } catch (error) {
            console.error("startListening failed:", error);
            setVoiceError("Không thể bắt đầu ghi âm. Vui lòng thử lại.");
            setIsOpen(false);
            toast.error("Không thể bắt đầu ghi âm. Vui lòng thử lại.");
        }
    };


    const stopListening = useCallback(async () => {
        try {
            await SpeechRecognition.stopListening();
        } catch (error) {
            console.error("stopListening failed:", error);
        }

        setIsOpen(false);

        if (transcript.trim() !== "") {
            onResult(transcript.trim());
        }

        resetTranscript();
    }, [transcript, onResult, resetTranscript]);


    useEffect(() => {
        if (!listening) return;

        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }

        const timeout = setTimeout(() => {
            stopListening();
        }, 2000);

        silenceTimeoutRef.current = timeout;

        return () => {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
        };
    }, [transcript, listening, stopListening]);

    if (!browserSupportsSpeechRecognition) {
        return (
            <div className="relative group">
                <button
                    disabled
                    className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    title="Trình duyệt không hỗ trợ"
                >
                    <MicOff className="w-5 h-5" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Trình duyệt không hỗ trợ nhập liệu bằng giọng nói
                    <br />
                    Vui lòng sử dụng Chrome hoặc Edge
                </div>
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={startListening}
                className={`p-2 rounded-lg bg-primary hover:bg-primary text-white transition-all cursor-pointer ${buttonClassName}`}
                title="Nhấn để nói"
            >
                <Mic className="w-5 h-5" />
            </button>

            {isOpen && isMounted && createPortal(
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-10010"
                    onClick={stopListening}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative">
                                {listening && (
                                    <div className="absolute inset-0 rounded-full bg-red-500 opacity-40 animate-ping"></div>
                                )}

                                <div className="p-6 rounded-full bg-red-500 relative z-10">
                                    {listening ? (
                                        <Mic className="w-12 h-12 text-white" />
                                    ) : (
                                        <MicOff className="w-12 h-12 text-white" />
                                    )}
                                </div>
                            </div>

                            <div className="min-h-15">
                                <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                                    {transcript !== ""
                                        ? transcript
                                        : "Đang nghe... hãy nói điều gì đó"}
                                </p>
                                {voiceError && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                        {voiceError}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {listening ? "Đang ghi âm..." : "Đã dừng"}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {language === "vi-VN" ? "🇻🇳 Tiếng Việt" : "🇺🇸 Tiếng Anh"}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={stopListening}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white font-medium transition-colors cursor-pointer"
                            >
                                Dừng và lưu
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
