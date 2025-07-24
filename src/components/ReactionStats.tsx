import React from "react";

interface ReactionStatsProps {
  likeCountReaction?: number;
  loveCount?: number;
  laughCount?: number;
  angryCount?: number;
  sadCount?: number;
  wowCount?: number;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ReactionStats: React.FC<ReactionStatsProps> = ({
  likeCountReaction = 0,
  loveCount = 0,
  laughCount = 0,
  angryCount = 0,
  sadCount = 0,
  wowCount = 0,
  onClick,
  className = "",
}) => {
  const reactions = [
    { type: 1, count: likeCountReaction, emoji: "👍" },
    { type: 2, count: loveCount, emoji: "❤️" },
    { type: 3, count: laughCount, emoji: "😂" },
    { type: 4, count: angryCount, emoji: "😠" },
    { type: 5, count: sadCount, emoji: "😢" },
    { type: 6, count: wowCount, emoji: "😮" },
  ];

  return (
    <div className={`flex items-center flex-wrap gap-1 sm:gap-2 ${className}`}>
      {reactions.map(({ type, count, emoji }) => (
        <button
          key={type}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(e);
          }}
          className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-full text-xs transition-colors min-w-0 ${
            count > 0
              ? "bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600"
              : "bg-dark-700/30 text-gray-500 cursor-default"
          }`}
        >
          <span className="text-xs sm:text-sm">{emoji}</span>
          <span className="font-medium text-xs sm:text-sm">{count}</span>
        </button>
      ))}
    </div>
  );
};
