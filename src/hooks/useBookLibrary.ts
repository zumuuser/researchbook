import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Book } from "@/types";

export function useBookLibrary() {
  const importBook = useCallback(async (filePath: string): Promise<Book> => {
    return await invoke("import_book", { filePath });
  }, []);

  const listBooks = useCallback(async (): Promise<Book[]> => {
    return await invoke("list_books");
  }, []);

  const deleteBook = useCallback(async (bookId: number) => {
    await invoke("delete_book", { bookId });
  }, []);

  const updateBookPages = useCallback(async (bookId: number, totalPages: number) => {
    await invoke("update_book_pages", { bookId, totalPages });
  }, []);

  return { importBook, listBooks, deleteBook, updateBookPages };
}
