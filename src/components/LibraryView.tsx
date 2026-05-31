import React, { useState, useRef, useEffect, useMemo } from "react";
import { FileText, Clock, MoreVertical, Eye, Trash2, Download, Search } from "lucide-react";
import { Book as BookType } from "@/types";

interface LibraryViewProps {
  books: BookType[];
  onOpenBook: (book: BookType) => void;
  onDeleteBook: (bookId: number) => void;
  onExportBook?: (bookId: number) => void;
  onImportBook: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  onOpenBook,
  onDeleteBook,
  onExportBook,
  onImportBook,
}) => {
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBooks = useMemo(() => {
    if (!query.trim()) return books;
    const q = query.toLowerCase();
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, query]);

  const formatDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header row: title + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Your Library</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {filteredBooks.length} of {books.length} {books.length === 1 ? "book" : "books"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search PDFs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400">
                No books yet
              </h3>
              <p className="text-sm text-neutral-500 mt-2">
                Import a PDF to start reading and taking spatial notes.
              </p>
              <button
                onClick={onImportBook}
                className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition"
              >
                Import your first PDF
              </button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No books match "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group relative border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition bg-white dark:bg-neutral-900"
                >
                  {/* Main clickable area */}
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => onOpenBook(book)}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1 pr-6">
                      <h3 className="font-medium text-sm truncate">
                        {book.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                        <span>{book.total_pages} pages</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(book.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  <div className="absolute top-3 right-3" ref={openMenuId === book.id ? menuRef : undefined}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === book.id ? null : book.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === book.id && (
                      <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onOpenBook(book);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-left"
                        >
                          <Eye className="w-4 h-4 text-neutral-500" />
                          View
                        </button>
                        {onExportBook && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              onExportBook(book.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-left"
                          >
                            <Download className="w-4 h-4 text-neutral-500" />
                            Export
                          </button>
                        )}
                        <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            setConfirmDelete(book.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Book
            </h3>
            <p className="text-sm text-neutral-500 mt-2">
              This will permanently delete the book and all associated notes.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBook(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
