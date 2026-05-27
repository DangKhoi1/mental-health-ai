import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores';

interface ChatMessageProps {
    content: string;
    role: "USER" | "BOT";
}

function hasMarkdownSyntax(text: string): boolean {
    const value = text || "";
    return /(^|\n)\s*([-*+]\s+|\d+\.\s+|#{1,6}\s+|>\s+|```)|\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*/m.test(value);
}

function splitPlainParagraphs(text: string): string[] {
    return (text || "")
        .replace(/\n{3,}/g, "\n\n")
        .split(/\n\n+/)
        .map((part) => part.trim())
        .filter(Boolean);
}

// Custom link component: internal paths close chatbot + navigate, external use <a>
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
    const router = useRouter();
    const closeChat = useChatStore((state) => state.closeChat);

    if (!href) return <span>{children}</span>;

    // External link ,  open in new tab
    if (href.startsWith('http://') || href.startsWith('https://')) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
                {children}
            </a>
        );
    }

    // Resource link pattern: /dashboard/resources/{resourceId} or /resources/{resourceId}
    const resourceMatch = href.match(/^\/(?:dashboard\/)?resources\/([^/]+)$/);
    if (resourceMatch) {
        const handleResourceClick = () => {
            closeChat();
            router.push(`/dashboard/resources/${resourceMatch[1]}`);
        };

        return (
            <span
                onClick={handleResourceClick}
                className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
                {children}
            </span>
        );
    }

    // Internal link ,  close chatbot and navigate
    const handleClick = () => {
        closeChat();
        router.push(href);
    };

    return (
        <span
            onClick={handleClick}
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
            {children}
        </span>
    );
}

export function ChatMessage({ content, role }: ChatMessageProps) {
    const isBot = role === "BOT";
    const isMarkdown = isBot && hasMarkdownSyntax(content);
    const plainParagraphs = isBot && !isMarkdown ? splitPlainParagraphs(content) : [];

    return (
        <div
            className={cn(
                "flex w-full items-start gap-3",
                isBot ? "flex-row" : "flex-row-reverse"
            )}
        >
            <div
                className={cn(
                    "flex size-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                    isBot ? "bg-white text-primary border-primary/20" : "bg-primary/5 text-primary"
                )}
            >
                {isBot ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
                className={cn(
                    "max-w-[90%] px-5 py-4 text-[15px] leading-relaxed shadow-sm overflow-hidden [&_p]:max-w-none [&_li]:max-w-none",
                    isBot
                        ? "bg-white border border-border/50 text-foreground rounded-2xl rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                )}
            >
                {isBot ? (
                    isMarkdown ? (
                        <div className="prose dark:prose-invert max-w-none wrap-break-word text-left prose-p:my-2 prose-p:leading-7 prose-p:max-w-none prose-headings:my-2 prose-pre:bg-muted prose-pre:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-strong:font-semibold prose-ul:my-2 prose-ul:pl-5 prose-ol:my-2 prose-ol:pl-5 prose-li:my-0.5 [&_p]:max-w-none [&_li]:max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    a: ({ href, children }) => (
                                        <MarkdownLink href={href}>{children}</MarkdownLink>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="space-y-3 text-left text-[15px] leading-7 text-foreground">
                            {plainParagraphs.length > 0 ? (
                                plainParagraphs.map((paragraph, index) => (
                                    <p key={index} className="max-w-none whitespace-pre-line wrap-break-word">
                                        {paragraph}
                                    </p>
                                ))
                            ) : (
                                <p className="max-w-none whitespace-pre-line wrap-break-word">{content}</p>
                            )}
                        </div>
                    )
                ) : (
                    <span className="whitespace-pre-wrap">{content}</span>
                )}
            </div>
        </div>
    );
}
