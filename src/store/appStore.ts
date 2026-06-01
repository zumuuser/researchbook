import { create } from "zustand";
import { Book } from "@/types";

interface AppState {
  currentBook: Book | null;
  currentPage: number;
  totalPages: number;
  isDarkMode: boolean;
  setCurrentBook: (book: Book | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentBook: null,
  currentPage: 1,
  totalPages: 1,
  isDarkMode: false,

  setCurrentBook: (book) =>
    set({ currentBook: book, currentPage: 1, totalPages: book?.total_pages || 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),

  nextPage: () => {
    const { currentPage, totalPages } = get();
    if (currentPage < totalPages) set({ currentPage: currentPage + 1 });
  },

  prevPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  },

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
