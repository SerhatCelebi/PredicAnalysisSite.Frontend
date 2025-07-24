import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 rounded-lg",
        className
      )}
    />
  );
};
