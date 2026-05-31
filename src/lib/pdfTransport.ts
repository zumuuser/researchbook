import { invoke } from "@tauri-apps/api/core";
import * as pdfjsLib from "pdfjs-dist";

export class TauriPdfTransport extends pdfjsLib.PDFDataRangeTransport {
  private filePath: string;

  constructor(length: number, filePath: string) {
    super(length, new Uint8Array(0), false);
    this.filePath = filePath;
  }

  requestDataRange(begin: number, end: number): void {
    (invoke("read_pdf_chunk", {
      filePath: this.filePath,
      begin,
      end,
    }) as Promise<number[]>)
      .then((chunk) => {
        this.onDataRange(begin, new Uint8Array(chunk));
      })
      .catch(() => {
        // ignore chunk errors
      });
  }
}

export async function loadPdfWithRange(filePath: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const size: number = await invoke("get_file_size", { filePath });
  const transport = new TauriPdfTransport(size, filePath);
  const loadingTask = pdfjsLib.getDocument({ range: transport });
  return loadingTask.promise;
}
