import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { useAppStore } from "@/store/appStore";
import { usePageState } from "@/hooks/usePageState";
import { useBookLibrary } from "@/hooks/useBookLibrary";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { usePdfConverter } from "@/hooks/usePdfConverter";
import { usePageImage } from "@/hooks/usePageImage";
import { Toolbar } from "@/components/Toolbar";
import { ResearchCanvas } from "@/components/ResearchCanvas";
import { PageTurner } from "@/components/PageTurner";
import { LibraryView } from "@/components/LibraryView";
import { Book } from "@/types";

export default function App() {
  const {
    currentBook,
    currentPage,
    setCurrentBook,
    setCurrentPage,
    setTotalPages,
    isDarkMode,
  } = useAppStore();
  const { savePageState, loadPageState } = usePageState();
  const { importBook, updateBookPages, listBooks, deleteBook } = useBookLibrary();

  // Library state
  const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Snapshot loaded from DB (only changes on page navigation)
  const [loadedSnapshot, setLoadedSnapshot] = useState<string>("{}");
  // Live snapshot from canvas (updated via ref, not React state, to avoid re-renders)
  const canvasSnapshotRef = useRef<string>("{}");
  // Page transition flag to mask the old-page flash
  const [isPageChanging, setIsPageChanging] = useState(false);

  // PDF document loading
  const { pdfDoc, outline, totalPages, isLoading: isPdfLoading } = usePdfDocument(
    currentBook?.file_path || ""
  );

  // Background WebP conversion
  const { isConverting, convertProgress, ensurePagesConverted } =
    usePdfConverter(pdfDoc, currentBook?.id || 0, totalPages);

  // Current page image (WebP or live fallback)
  const { url: pageImageUrl, width: pageWidth, height: pageHeight } = usePageImage(
    currentBook?.id || 0,
    currentPage,
    currentBook?.file_path || "",
    pdfDoc
  );

  // Load library on mount and when returning to library
  useEffect(() => {
    if (currentBook) return;
    let cancelled = false;
    setLibraryLoading(true);
    listBooks().then((books) => {
      if (!cancelled) {
        setLibraryBooks(books);
        setLibraryLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentBook, listBooks]);

  // Update total pages in DB when PDF loads
  useEffect(() => {
    if (currentBook && totalPages > 0 && totalPages !== currentBook.total_pages) {
      updateBookPages(currentBook.id, totalPages);
      setTotalPages(totalPages);
    }
  }, [currentBook, totalPages, updateBookPages, setTotalPages]);

  // Convert first 3 pages immediately when PDF is ready
  useEffect(() => {
    if (pdfDoc && totalPages > 0) {
      ensurePagesConverted([1, 2, 3].filter((p) => p <= totalPages));
    }
  }, [pdfDoc, totalPages, ensurePagesConverted]);

  // Pre-convert upcoming pages when current page changes
  useEffect(() => {
    if (totalPages > 0) {
      const ahead = [currentPage + 1, currentPage + 2].filter((p) => p <= totalPages);
      const behind = [currentPage - 1].filter((p) => p >= 1);
      ensurePagesConverted([...ahead, ...behind]);
    }
  }, [currentPage, totalPages, ensurePagesConverted]);

  // Clear page-changing state when new page image is ready
  useEffect(() => {
    if (pageImageUrl && isPageChanging) {
      setIsPageChanging(false);
    }
  }, [pageImageUrl, isPageChanging]);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Load page state from DB when page changes
  useEffect(() => {
    if (!currentBook) return;
    let cancelled = false;
    const load = async () => {
      const state = await loadPageState(currentBook.id, currentPage);
      const snap = state.canvas_state || "{}";
      if (!cancelled) {
        setLoadedSnapshot(snap);
        canvasSnapshotRef.current = snap;
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentBook, currentPage, loadPageState]);

  // Save current page before switching
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!currentBook) return;
      // Force immediate render of loading overlay before any async work
      flushSync(() => setIsPageChanging(true));
      await savePageState(
        currentBook.id,
        currentPage,
        canvasSnapshotRef.current,
        "[]"
      );
      // Reset snapshot so canvas doesn't briefly show old page annotations
      setLoadedSnapshot("{}");
      setCurrentPage(newPage);
    },
    [currentBook, currentPage, savePageState, setCurrentPage]
  );

  const handleOpenBook = useCallback(
    async (book: Book) => {
      // Prepend to library list if new
      setLibraryBooks((prev) => {
        if (prev.find((b) => b.id === book.id)) return prev;
        return [book, ...prev];
      });
      setCurrentBook(book);
      setCurrentPage(1);
      setLoadedSnapshot("{}");
      canvasSnapshotRef.current = "{}";
      setIsPageChanging(false);
    },
    [setCurrentBook, setCurrentPage]
  );

  const handleCloseBook = useCallback(() => {
    if (currentBook) {
      savePageState(
        currentBook.id,
        currentPage,
        canvasSnapshotRef.current,
        "[]"
      );
    }
    setCurrentBook(null);
    setCurrentPage(1);
    setLoadedSnapshot("{}");
    canvasSnapshotRef.current = "{}";
  }, [currentBook, currentPage, savePageState, setCurrentBook, setCurrentPage]);

  const handleImportBook = useCallback(async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: false,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (selected && typeof selected === "string") {
      const book = await importBook(selected);
      await handleOpenBook(book);
      const books = await listBooks();
      setLibraryBooks(books);
    }
  }, [importBook, handleOpenBook, listBooks]);

  const handleDeleteBook = useCallback(
    async (bookId: number) => {
      await deleteBook(bookId);
      setLibraryBooks((prev) => prev.filter((b) => b.id !== bookId));
    },
    [deleteBook]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { currentPage, totalPages } = useAppStore.getState();
      if (
        (e.key === "PageDown" || e.key === "ArrowRight") &&
        currentPage < totalPages
      ) {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (
        (e.key === "PageUp" || e.key === "ArrowLeft") &&
        currentPage > 1
      ) {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePageChange]);

  // Write live snapshot to ref (does NOT trigger React re-render)
  const handleCanvasChange = useCallback((snapshot: any) => {
    canvasSnapshotRef.current = JSON.stringify(snapshot);
  }, []);

  const handleJumpToPage = useCallback(
    (page: number) => {
      if (!currentBook) return;
      handlePageChange(page);
    },
    [currentBook, handlePageChange]
  );

  // Welcome / Library screen
  if (!currentBook) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <Toolbar
          onImportBook={handleImportBook}
          onCloseBook={undefined}
          outline={[]}
          onJumpToPage={() => {}}
        />
        {libraryLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <LibraryView
            books={libraryBooks}
            onOpenBook={handleOpenBook}
            onDeleteBook={handleDeleteBook}
            onImportBook={handleImportBook}
          />
        )}
      </div>
    );
  }

  const showLoader = isPdfLoading || isPageChanging || !pageImageUrl;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden">
      <Toolbar
        onImportBook={handleImportBook}
        onCloseBook={handleCloseBook}
        outline={outline}
        onJumpToPage={handleJumpToPage}
        conversionProgress={isConverting ? convertProgress : undefined}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative">
          {showLoader && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-neutral-950">
              <div className="text-center space-y-2">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-neutral-500">
                  {isPdfLoading
                    ? "Loading PDF..."
                    : isPageChanging
                    ? "Changing page..."
                    : "Rendering page..."}
                </p>
                {isConverting && !isPageChanging && (
                  <p className="text-xs text-neutral-400">
                    Converting pages to WebP ({convertProgress}%)
                  </p>
                )}
              </div>
            </div>
          )}

          <ResearchCanvas
            pageNumber={currentPage}
            pdfImageUrl={pageImageUrl || undefined}
            pdfWidth={pageWidth || undefined}
            pdfHeight={pageHeight || undefined}
            initialSnapshot={loadedSnapshot}
            onChange={handleCanvasChange}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      <PageTurner onPageChange={handlePageChange} />
    </div>
  );
}
