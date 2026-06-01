import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Sun, Moon, Library, List, ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { PdfOutlineItem } from "@/types";

interface ToolbarProps {
  onImportBook?: () => void;
  onCloseBook?: () => void;
  outline: PdfOutlineItem[];
  onJumpToPage: (page: number) => void;
  conversionProgress?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onImportBook,
  onCloseBook,
  outline,
  onJumpToPage,
  conversionProgress,
}) => {
  const { currentBook, isDarkMode, toggleDarkMode, spreadView, toggleSpreadView } = useAppStore();
  const [showOutline, setShowOutline] = useState(false);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b bg-white dark:bg-neutral-950 dark:border-neutral-800 z-50 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.svg" alt="ResearchBook" className="w-6 h-6 shrink-0" />
          <h1 className="font-semibold text-sm tracking-tight truncate">
            ResearchBook
          </h1>
          {currentBook && onCloseBook && (
            <button
              onClick={onCloseBook}
              className="ml-2 flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition shrink-0"
              title="Back to library"
            >
              <ArrowLeft className="w-3 h-3" />
              Library
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onImportBook}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition shrink-0"
          >
            <Library className="w-4 h-4" />
            {currentBook ? "Open Another" : "Import PDF"}
          </button>

          {currentBook && (
            <span className="text-xs text-neutral-500 ml-2 truncate max-w-[240px] hidden sm:inline">
              {currentBook.title}
              {typeof conversionProgress === "number" && (
                <span className="ml-2 text-amber-600">
                  ({conversionProgress}%)
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {currentBook && outline.length > 0 && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-md transition ${
                showOutline
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title="Chapters / Outline"
            >
              <List className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={toggleSpreadView}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title={spreadView ? "Hide canvas tools" : "Show canvas tools"}
          >
            {spreadView ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Outline Sidebar */}
      {showOutline && outline.length > 0 && (
        <div className="absolute top-14 right-0 w-72 max-h-[80vh] overflow-y-auto bg-white dark:bg-neutral-900 border-l border-b dark:border-neutral-800 shadow-lg z-50 rounded-bl-lg">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Outline
            </h3>
            <OutlineTree
              items={outline}
              onJump={onJumpToPage}
              onClose={() => setShowOutline(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

const OutlineTree: React.FC<{
  items: PdfOutlineItem[];
  onJump: (page: number) => void;
  onClose: () => void;
  depth?: number;
}> = ({ items, onJump, onClose, depth = 0 }) => {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "ml-3 mt-0.5 space-y-0.5"}>
      {items.map((item, idx) => (
        <li key={idx}>
          <button
            onClick={() => {
              onJump(item.page);
              onClose();
            }}
            className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            <span className="truncate block">{item.title}</span>
            <span className="text-xs text-neutral-400 ml-1">p.{item.page}</span>
          </button>
          {item.items && item.items.length > 0 && (
            <OutlineTree
              items={item.items}
              onJump={onJump}
              onClose={onClose}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
