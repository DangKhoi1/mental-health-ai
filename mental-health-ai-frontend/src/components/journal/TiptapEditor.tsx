'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import {
    Bold, Italic, Underline as UnderlineIcon,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Quote, Undo, Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const actionBaseClass =
        'flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all duration-150 hover:border-border/70 hover:bg-background/80 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30';
    const actionActiveClass = 'border-amber-500/25 bg-amber-500/10 text-amber-500 shadow-sm';

    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border/70 bg-card/90 px-3 py-2 backdrop-blur-xl">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(actionBaseClass, editor.isActive('bold') && actionActiveClass)}
                title="In đậm (Bold)"
            >
                <Bold size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(actionBaseClass, editor.isActive('italic') && actionActiveClass)}
                title="In nghiêng (Italic)"
            >
                <Italic size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(actionBaseClass, editor.isActive('underline') && actionActiveClass)}
                title="Gạch chân (Underline)"
            >
                <UnderlineIcon size={16} />
            </button>

            <div className="h-6 w-px bg-border/70" />

            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={cn(actionBaseClass, editor.isActive({ textAlign: 'left' }) && actionActiveClass)}
                title="Căn trái"
            >
                <AlignLeft size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={cn(actionBaseClass, editor.isActive({ textAlign: 'center' }) && actionActiveClass)}
                title="Căn giữa"
            >
                <AlignCenter size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={cn(actionBaseClass, editor.isActive({ textAlign: 'right' }) && actionActiveClass)}
                title="Căn phải"
            >
                <AlignRight size={16} />
            </button>

            <div className="h-6 w-px bg-border/70" />

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(actionBaseClass, editor.isActive('bulletList') && actionActiveClass)}
                title="Danh sách gạch đầu dòng"
            >
                <List size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(actionBaseClass, editor.isActive('orderedList') && actionActiveClass)}
                title="Danh sách số"
            >
                <ListOrdered size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(actionBaseClass, editor.isActive('blockquote') && actionActiveClass)}
                title="Trích dẫn"
            >
                <Quote size={16} />
            </button>

            <div className="ml-auto h-6 w-px bg-border/70" />

            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className={actionBaseClass}
                title="Hoàn tác (Undo)"
            >
                <Undo size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className={actionBaseClass}
                title="Làm mới (Redo)"
            >
                <Redo size={16} />
            </button>
        </div>
    );
};

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: false,
                orderedList: false,
                listItem: false,
                blockquote: false,
            }),
            BulletList,
            OrderedList,
            ListItem,
            Blockquote,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Bắt đầu viết...',
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate dark:prose-invert max-w-none min-h-[280px] max-h-[420px] overflow-y-auto px-5 py-4 text-[1.02rem] leading-8 text-foreground/95 focus:outline-none sm:px-6 sm:py-5 [&_p]:my-2 [&_p]:max-w-none [&_li]:max-w-none [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
            },
        },
    });

    // Update editor content if it changes from parent (e.g. from VoiceInput)
    useEffect(() => {
        if (editor && content !== editor.getHTML() && !editor.isFocused) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="w-full overflow-hidden rounded-3xl border border-border/70 bg-linear-to-b from-background to-secondary/10 shadow-[0_10px_35px_rgba(15,23,42,0.08)] transition-all duration-300 focus-within:border-amber-500/30 focus-within:shadow-[0_14px_40px_rgba(99,102,241,0.16)] focus-within:ring-2 focus-within:ring-amber-500/15">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            <style>
                {`
                .tiptap .is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: hsl(var(--muted-foreground));
                    opacity: 0.7;
                    pointer-events: none;
                    height: 0;
                }
                `}
            </style>
        </div>
    );
}
