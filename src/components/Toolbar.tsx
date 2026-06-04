import React, { useState } from "react";
import { useAppStore } from "@/store/appStore";
import {
  Sun,
  Moon,
  Library,
  List,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { PdfOutlineItem } from "@/types";
import * as Dialog from "@radix-ui/react-dialog";

interface ToolbarProps {
  onImportBook?: () => void;
  onCloseBook?: () => void;
  outline: PdfOutlineItem[];
  onJumpToPage: (page: number) => void;
  conversionProgress?: number;
}

const CANVAS_PRESETS = [
  { label: "Light", color: "#ffffff" },
  { label: "Dark", color: "#171717" },
  { label: "Paper", color: "#f5f5dc" },
  { label: "Black", color: "#000000" },
  { label: "Slate", color: "#1e293b" },
  { label: "Warm Dark", color: "#292524" },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  onImportBook,
  onCloseBook,
  outline,
  onJumpToPage,
  conversionProgress,
}) => {
  const {
    currentBook,
    isDarkMode,
    toggleDarkMode,
    spreadView,
    toggleSpreadView,
    themeSettings,
    setThemeSettings,
    resetThemeSettings,
  } = useAppStore();
  const [showOutline, setShowOutline] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-md transition ${
              showSettings
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title="Theme & PDF settings"
          >
            <Settings2 className="w-4 h-4" />
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

      {/* Settings Dialog */}
      <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-xl border dark:border-neutral-800 z-[70] p-6 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-semibold">
                Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                  <span className="sr-only">Close</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-neutral-500"
                  >
                    <path
                      d="M12 4L4 12M4 4L12 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {/* Canvas Background */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Canvas Background</h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {CANVAS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      setThemeSettings({
                        canvasBgColor: preset.color,
                        useCustomCanvasColor: true,
                      })
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition ${
                      themeSettings.useCustomCanvasColor &&
                      themeSettings.canvasBgColor === preset.color
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                        : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                    title={preset.label}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-300 dark:border-neutral-600"
                      style={{ backgroundColor: preset.color }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={themeSettings.canvasBgColor}
                  onChange={(e) =>
                    setThemeSettings({
                      canvasBgColor: e.target.value,
                      useCustomCanvasColor: true,
                    })
                  }
                  className="w-10 h-10 rounded cursor-pointer border border-neutral-200 dark:border-neutral-700 p-0.5"
                />
                <div className="flex-1">
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">
                    Custom color
                  </label>
                  <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                    {themeSettings.canvasBgColor}
                  </code>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={themeSettings.useCustomCanvasColor}
                    onChange={(e) =>
                      setThemeSettings({
                        useCustomCanvasColor: e.target.checked,
                      })
                    }
                    className="rounded border-neutral-300"
                  />
                  Use custom
                </label>
              </div>
            </section>

            <div className="border-t dark:border-neutral-800 my-5" />

            {/* PDF Enhancement */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold mb-3">PDF Enhancement</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-600 dark:text-neutral-400">
                      Contrast
                    </label>
                    <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 rounded">
                      {themeSettings.pdfContrast.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={themeSettings.pdfContrast}
                    onChange={(e) =>
                      setThemeSettings({
                        pdfContrast: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-600 dark:text-neutral-400">
                      Brightness
                    </label>
                    <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 rounded">
                      {themeSettings.pdfBrightness.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={themeSettings.pdfBrightness}
                    onChange={(e) =>
                      setThemeSettings({
                        pdfBrightness: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                Changes apply when you switch pages or reload the current page.
              </p>
            </section>

            <div className="flex justify-end">
              <button
                onClick={resetThemeSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to defaults
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
