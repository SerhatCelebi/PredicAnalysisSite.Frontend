import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface EmojiPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Tam opak koyu arka plan */}
      <div className="fixed inset-0 bg-black bg-opacity-90" />

      {/* Picker Container */}
      <div
        className="pointer-events-auto shadow-2xl rounded-xl bg-dark-800 border border-dark-600 z-10"
        ref={panelRef}
      >
        <EmojiPicker
          width={350}
          height={400}
          skinTonesDisabled
          searchDisabled
          onEmojiClick={(data: EmojiClickData) => {
            onSelect(data.emoji);
            onClose();
          }}
        />
      </div>
    </div>,
    document.body
  );
};
