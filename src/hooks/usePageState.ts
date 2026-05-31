import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PageState } from "@/types";

export function usePageState() {
  const savePageState = useCallback(
    async (
      bookId: number,
      pageNumber: number,
      canvasState: string,
      highlights: string
    ) => {
      await invoke("save_page_state", {
        bookId,
        pageNumber,
        canvasState,
        highlights,
      });
    },
    []
  );

  const loadPageState = useCallback(
    async (bookId: number, pageNumber: number): Promise<PageState> => {
      return await invoke("load_page_state", { bookId, pageNumber });
    },
    []
  );

  return { savePageState, loadPageState };
}
