import React, { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "../lib/utils";

export enum ReactionType {
  Like = 1, // 👍 - Beğendim
  Love = 2, // ❤️ - Sevdim
  Laugh = 3, // 😂 - Güldüm
  Angry = 4, // 😠 - Kızdım
  Sad = 5, // 😢 - Üzüldüm
  Wow = 6, // 😮 - Şaşırdım
}

interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const reactions: Reaction[] = [
  {
    type: ReactionType.Like,
    emoji: "👍",
    label: "Beğendim",
    color: "hover:bg-blue-100",
  },
  {
    type: ReactionType.Love,
    emoji: "❤️",
    label: "Sevdim",
    color: "hover:bg-red-100",
  },
  {
    type: ReactionType.Laugh,
    emoji: "😂",
    label: "Güldüm",
    color: "hover:bg-yellow-100",
  },
  {
    type: ReactionType.Angry,
    emoji: "😠",
    label: "Kızdım",
    color: "hover:bg-orange-100",
  },
  {
    type: ReactionType.Sad,
    emoji: "😢",
    label: "Üzüldüm",
    color: "hover:bg-gray-100",
  },
  {
    type: ReactionType.Wow,
    emoji: "😮",
    label: "Şaşırdım",
    color: "hover:bg-purple-100",
  },
];

interface ReactionPickerProps {
  onReact: (reactionType: ReactionType) => void;
  currentReaction?: ReactionType | null;
  className?: string;
  showPicker?: boolean; // Dropdown picker'ı göster/gizle
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReact,
  currentReaction,
  className,
  showPicker = true,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca picker'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentReaction = () => {
    if (currentReaction) {
      return reactions.find((r) => r.type === currentReaction);
    }
    return null;
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showPicker) {
      // Sadece Like reaksiyonu gönder (basit mod)
      onReact(ReactionType.Like);
      return;
    }

    if (currentReaction) {
      // Mevcut reaksiyonu kaldır (toggle)
      onReact(currentReaction);
    } else {
      // Picker'ı aç
      setIsPickerOpen(!isPickerOpen);
    }
  };

  const handleReactionSelect = (
    reactionType: ReactionType,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onReact(reactionType);
    setIsPickerOpen(false);
  };

  const currentReactionData = getCurrentReaction();
  const isReacted = currentReaction !== null && currentReaction !== undefined;

  return (
    <div className="relative" ref={pickerRef}>
      {/* Ana Buton */}
      <button
        onClick={handleMainButtonClick}
        className={cn(
          "flex items-center space-x-1 text-gray-500 hover:text-pink-500 transition-all duration-200",
          isReacted && "text-pink-500",
          className
        )}
      >
        {isReacted && currentReactionData ? (
          <span className="text-lg hover:scale-110 transition-transform">
            {currentReactionData.emoji}
          </span>
        ) : (
          <Heart
            className="h-5 w-5"
            fill={isReacted ? "currentColor" : "none"}
          />
        )}
      </button>

      {/* Reaksiyon Picker Dropdown */}
      {showPicker && isPickerOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="flex items-center flex-wrap gap-1 bg-white dark:bg-dark-800 rounded-full shadow-lg border border-gray-200 dark:border-dark-600 px-2 py-1 max-w-xs sm:max-w-none">
            {reactions.map((reaction) => (
              <button
                key={reaction.type}
                onClick={(e) => handleReactionSelect(reaction.type, e)}
                className={cn(
                  "p-1.5 sm:p-2 rounded-full transition-all duration-200 transform hover:scale-125",
                  reaction.color,
                  currentReaction === reaction.type &&
                    "bg-gray-100 dark:bg-dark-700"
                )}
                title={reaction.label}
              >
                <span className="text-lg sm:text-xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SimpleReactionButtonProps {
  reactionType: ReactionType;
  count: number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const SimpleReactionButton: React.FC<SimpleReactionButtonProps> = ({
  reactionType,
  count,
  isActive,
  onClick,
  className,
}) => {
  const reaction = reactions.find((r) => r.type === reactionType);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  if (!reaction) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center space-x-1 text-sm transition-all duration-200 hover:scale-105 px-2 py-1 rounded-lg",
        isActive
          ? "text-primary-500 bg-primary-50 dark:bg-primary-900/20"
          : "text-gray-500 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-dark-700",
        className
      )}
    >
      <span className="text-base">{reaction.emoji}</span>
      <span className="font-medium">{count}</span>
    </button>
  );
};

// Reaksiyon tipinden emoji'ye çevirmek için yardımcı fonksiyon
export const getReactionEmoji = (reactionType: ReactionType): string => {
  const reaction = reactions.find((r) => r.type === reactionType);
  return reaction?.emoji || "❤️";
};

// Reaksiyon tipinden label'a çevirmek için yardımcı fonksiyon
export const getReactionLabel = (reactionType: ReactionType): string => {
  const reaction = reactions.find((r) => r.type === reactionType);
  return reaction?.label || "Beğeni";
};
