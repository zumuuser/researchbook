import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageTurnerProps {
  onPageChange?: (page: number) => void;
}

export const PageTurner: React.FC<PageTurnerProps> = ({ onPageChange }) => {
  const { currentPage, totalPages } = useAppStore();
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const goTo = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  const handlePrev = () => goTo(currentPage - 1);
  const handleNext = () => goTo(currentPage + 1);

  const handleJump = () => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page)) {
      goTo(page);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleJump();
  };

  return (
    <footer className="h-12 flex items-center justify-center gap-3 border-t bg-white dark:bg-neutral-950 dark:border-neutral-800 z-50">
      <button
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Page</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleJump}
          onKeyDown={handleKeyDown}
          className="w-12 text-center border rounded px-1 py-0.5 bg-transparent dark:border-neutral-700"
        />
        <span className="text-neutral-500">/ {totalPages}</span>
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </footer>
  );
};
