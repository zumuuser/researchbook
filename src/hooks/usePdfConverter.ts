import { useEffect, useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

const RENDER_SCALE = 1.5;

export interface PdfConverterState {
  convertedPages: Set<number>;
  isConverting: boolean;
  convertProgress: number;
  ensurePagesConverted: (pages: number[]) => void;
}

export function usePdfConverter(
  pdfDoc: pdfjsLib.PDFDocumentProxy | null,
  bookId: number,
  totalPages: number
): PdfConverterState {
  const [convertedPages, setConvertedPages] = useState<Set<number>>(new Set());
  const [isConverting, setIsConverting] = useState(false);
  const queueRef = useRef<number[]>([]);
  const processingRef = useRef(false);
  const [trigger, setTrigger] = useState(0);
  const convertedRef = useRef<Set<number>>(new Set());

  // Keep ref in sync with state for queue filtering
  useEffect(() => {
    convertedRef.current = convertedPages;
  }, [convertedPages]);

  // Load already-converted pages from disk
  useEffect(() => {
    if (bookId <= 0) return;
    let cancelled = false;

    const load = async () => {
      try {
        const existing: number[] = await invoke("list_converted_pages", { bookId });
        if (!cancelled) {
          const set = new Set(existing);
          setConvertedPages(set);
          convertedRef.current = set;
        }
      } catch {
        // silently ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // Process conversion queue
  useEffect(() => {
    if (!pdfDoc || queueRef.current.length === 0 || processingRef.current) return;

    let cancelled = false;

    const process = async () => {
      processingRef.current = true;
      setIsConverting(true);

      const queue = [...queueRef.current];
      queueRef.current = [];

      for (const pageNumber of queue) {
        if (cancelled) break;
        if (convertedRef.current.has(pageNumber)) continue;

        try {
          const page = await pdfDoc.getPage(pageNumber);
          const viewport = page.getViewport({ scale: RENDER_SCALE });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;

          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/webp", 0.8);
          });

          if (!blob) continue;

          const arrayBuffer = await blob.arrayBuffer();
          const bytes = Array.from(new Uint8Array(arrayBuffer));

          await invoke("write_page_image", {
            bookId,
            pageNumber,
            imageData: bytes,
          });

          if (!cancelled) {
            setConvertedPages((prev) => {
              const next = new Set(prev);
              next.add(pageNumber);
              return next;
            });
            convertedRef.current.add(pageNumber);
          }
        } catch {
          // ignore failed conversions
        }

        // Yield event loop to keep UI responsive
        await new Promise((r) => setTimeout(r, 10));
      }

      if (!cancelled) {
        setIsConverting(false);
        processingRef.current = false;
      }
    };

    process();
    return () => {
      cancelled = true;
      processingRef.current = false;
    };
  }, [pdfDoc, trigger, bookId]);

  const ensurePagesConverted = useCallback(
    (pages: number[]) => {
      const needed = pages.filter(
        (p) => p >= 1 && p <= totalPages && !convertedRef.current.has(p)
      );
      if (needed.length > 0) {
        queueRef.current.push(...needed);
        setTrigger((t) => t + 1);
      }
    },
    [totalPages]
  );

  const progress =
    totalPages > 0
      ? Math.round((convertedPages.size / totalPages) * 100)
      : 0;

  return { convertedPages, isConverting, convertProgress: progress, ensurePagesConverted };
}
