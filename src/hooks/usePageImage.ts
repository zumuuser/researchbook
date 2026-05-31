import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

const RENDER_SCALE = 1.5;

export interface PageImageResult {
  url: string | null;
  width: number;
  height: number;
  isLoading: boolean;
  error: string | null;
}

export function usePageImage(
  bookId: number,
  pageNumber: number,
  filePath: string,
  pdfDoc: any
): PageImageResult {
  const [state, setState] = useState<PageImageResult>({
    url: null,
    width: 0,
    height: 0,
    isLoading: true,
    error: null,
  });
  const pdfDocRef = useRef(pdfDoc);

  useEffect(() => {
    pdfDocRef.current = pdfDoc;
  }, [pdfDoc]);

  useEffect(() => {
    if (!filePath || bookId <= 0 || pageNumber < 1 || !pdfDocRef.current) {
      setState({ url: null, width: 0, height: 0, isLoading: !pdfDocRef.current, error: null });
      return;
    }

    let cancelled = false;
    setState({ url: null, width: 0, height: 0, isLoading: true, error: null });

    const load = async () => {
      try {
        // 1. Try cached WebP first
        const path: string | null = await invoke("get_page_image_path_command", {
          bookId,
          pageNumber,
        });

        if (path && !cancelled) {
          const bytes: number[] = await invoke("read_page_image", {
            bookId,
            pageNumber,
          });
          const blob = new Blob([new Uint8Array(bytes)], { type: "image/webp" });
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(blob);
          });

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load cached image"));
            img.src = dataUrl;
          });

          if (!cancelled) {
            setState({
              url: dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        // 2. Fallback: live render from PDF
        if (!cancelled) await renderLive();
      } catch (e: any) {
        if (!cancelled) {
          setState((s) => ({ ...s, isLoading: false, error: e.message }));
        }
      }
    };

    const renderLive = async () => {
      try {
        const doc = pdfDocRef.current;
        if (!doc) return;

        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");

        if (!cancelled) {
          setState({
            url: dataUrl,
            width: viewport.width,
            height: viewport.height,
            isLoading: false,
            error: null,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState((s) => ({ ...s, isLoading: false, error: e.message }));
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bookId, pageNumber, filePath, pdfDoc]);

  return state;
}
