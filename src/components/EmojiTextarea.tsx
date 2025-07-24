import React, { useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { EmojiPickerModal } from "./EmojiPickerModal";

interface EmojiTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const EmojiTextarea: React.FC<EmojiTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 5,
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);

  const insertEmoji = (emoji: any) => {
    const symbol = emoji.native || emoji.emoticons?.[0] || "";
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = value.slice(0, start) + symbol + value.slice(end);
    onChange(newText);
    // caret
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 0);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`input-field w-full ${className}`}
      />
      <button
        type="button"
        onClick={() => setPickerOpen((p) => !p)}
        className="absolute bottom-2 right-2 z-[60] text-xl hover:scale-110 transition-transform"
      >
        😊
      </button>

      <EmojiPickerModal
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(emoji) => insertEmoji({ native: emoji })}
      />
    </div>
  );
};
