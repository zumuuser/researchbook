import { useEffect, useState } from "react";
import { loadPdfWithRange } from "@/lib/pdfTransport";
import type { PdfOutlineItem } from "@/types";

export interface PdfDocumentInfo {
  pdfDoc: any; // pdfjsLib.PDFDocumentProxy
  outline: PdfOutlineItem[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export function usePdfDocument(filePath: string): PdfDocumentInfo {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [outline, setOutline] = useState<PdfOutlineItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setPdfDoc(null);
      setOutline([]);
      setTotalPages(0);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const pdf = await loadPdfWithRange(filePath);

        if (cancelled) {
          pdf.destroy();
          return;
        }

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);

        const rawOutline = await pdf.getOutline();
        if (rawOutline) {
          const parseOutline = async (items: any[]): Promise<PdfOutlineItem[]> => {
            const result: PdfOutlineItem[] = [];
            for (const item of items) {
              let pageNum = 1;
              if (item.dest) {
                try {
                  const dest = await pdf.getDestination(item.dest);
                  if (dest && Array.isArray(dest) && dest[0]) {
                    const pageIndex = await pdf.getPageIndex(dest[0]);
                    pageNum = pageIndex + 1;
                  }
                } catch {
                  // ignore
                }
              }
              result.push({
                title: item.title || "Untitled",
                page: pageNum,
                items: item.items ? await parseOutline(item.items) : undefined,
              });
            }
            return result;
          };
          const items = await parseOutline(rawOutline);
          if (!cancelled) setOutline(items);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.toString?.() || "Failed to load PDF");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      // Intentionally NOT destroying pdfDoc here —
      // usePdfConverter may still be processing pages.
    };
  }, [filePath]);

  return { pdfDoc, outline, totalPages, isLoading, error };
}
