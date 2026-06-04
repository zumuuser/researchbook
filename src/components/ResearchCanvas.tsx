import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Excalidraw, restoreElements } from "@excalidraw/excalidraw";
import { useAppStore } from "@/store/appStore";

const PDF_IMAGE_PREFIX = "pdf-bg-";
const PDF_FILE_PREFIX = "pdf-page-";

function getPdfImageId(pageNumber?: number): string {
  return `${PDF_IMAGE_PREFIX}${pageNumber ?? 0}`;
}

function getPdfFileId(pageNumber?: number): string {
  return `${PDF_FILE_PREFIX}${pageNumber ?? 0}-bg`;
}

function isPdfImageElement(el: any): boolean {
  return typeof el.id === "string" && el.id.startsWith(PDF_IMAGE_PREFIX);
}

function isPdfFileId(key: string): boolean {
  return key.startsWith(PDF_FILE_PREFIX);
}

function createPdfImageElement(
  pageNumber: number,
  width: number,
  height: number
): any {
  return {
    id: getPdfImageId(pageNumber),
    type: "image",
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    fileId: getPdfFileId(pageNumber),
    status: "saved",
    seed: 1,
    version: 2,
    versionNonce: Date.now(),
    isDeleted: false,
    fillStyle: "hachure",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: true,
    strokeColor: "#000000",
    backgroundColor: "transparent",
    crop: null,
    index: null,
    scale: [1, 1],
  };
}

function createPdfFile(pageNumber: number, dataURL: string): any {
  const mimeType = dataURL.startsWith("data:image/webp")
    ? "image/webp"
    : "image/png";
  return {
    mimeType,
    id: getPdfFileId(pageNumber),
    dataURL,
    created: Date.now(),
  };
}

function parseSnapshot(snapshot: any): { elements: any[]; files: any } {
  if (!snapshot) return { elements: [], files: {} };
  try {
    const data = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
    if (data && Array.isArray(data.elements)) {
      return {
        elements: data.elements.filter((el: any) => !isPdfImageElement(el)),
        files: data.files || {},
      };
    }
  } catch {
    // ignore invalid snapshots
  }
  return { elements: [], files: {} };
}

interface ResearchCanvasProps {
  pageNumber?: number;
  pdfImageUrl?: string;
  pdfWidth?: number;
  pdfHeight?: number;
  initialSnapshot?: any;
  onChange?: (snapshot: any) => void;
  isDarkMode?: boolean;
}

function getDefaultCanvasBg(isDarkMode: boolean): string {
  return isDarkMode ? "#171717" : "#ffffff";
}

export const ResearchCanvas: React.FC<ResearchCanvasProps> = ({
  pageNumber,
  pdfImageUrl,
  pdfWidth,
  pdfHeight,
  initialSnapshot,
  onChange,
  isDarkMode,
}) => {
  const [api, setApi] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const currentPageRef = useRef(pageNumber);
  const { spreadView, themeSettings } = useAppStore();

  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  // Compute canvas background color from theme settings
  const canvasBgColor = useMemo(() => {
    if (themeSettings.useCustomCanvasColor) {
      return themeSettings.canvasBgColor;
    }
    return getDefaultCanvasBg(!!isDarkMode);
  }, [themeSettings.useCustomCanvasColor, themeSettings.canvasBgColor, isDarkMode]);

  // Build initial data for first mount only — Excalidraw reads this once
  const initialData = useMemo(() => {
    const { elements: savedElements, files: savedFiles } = parseSnapshot(
      initialSnapshot
    );
    const elements = [...savedElements];
    const files: any = { ...savedFiles };

    if (pdfImageUrl && pdfWidth && pdfHeight && pageNumber) {
      elements.unshift(createPdfImageElement(pageNumber, pdfWidth, pdfHeight));
      files[getPdfFileId(pageNumber)] = createPdfFile(pageNumber, pdfImageUrl);
    }

    return {
      elements,
      files,
      appState: {
        theme: (isDarkMode ? "dark" : "light") as "dark" | "light",
        viewBackgroundColor: canvasBgColor,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update scene whenever page, snapshot, PDF image, or theme changes
  useEffect(() => {
    if (!api || !pageNumber) return;

    const { elements: savedElements } = parseSnapshot(initialSnapshot);

    let elements = [...savedElements];

    if (pdfImageUrl && pdfWidth && pdfHeight) {
      elements.unshift(createPdfImageElement(pageNumber, pdfWidth, pdfHeight));
    }

    if (pdfImageUrl) {
      api.addFiles([createPdfFile(pageNumber, pdfImageUrl)]);
    }

    api.updateScene({
      elements: restoreElements(elements, null),
      appState: {
        theme: (isDarkMode ? "dark" : "light") as "dark" | "light",
        viewBackgroundColor: canvasBgColor,
      },
      commitToHistory: false,
    });

    const timeout = setTimeout(() => {
      api.scrollToContent?.();
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    api,
    pageNumber,
    initialSnapshot,
    pdfImageUrl,
    pdfWidth,
    pdfHeight,
    isDarkMode,
    canvasBgColor,
  ]);

  // Shift+1 ("!") → center and fit PDF to viewport
  useEffect(() => {
    if (!api || !pageNumber) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "!" && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const pdfElement = api
          .getSceneElements()
          .find((el: any) => el.id === getPdfImageId(pageNumber));
        if (pdfElement) {
          api.scrollToContent([pdfElement], {
            fitToViewport: true,
            animate: false,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [api, pageNumber]);

  // Hide Excalidraw branding links (help dialog + hamburger menu)
  useEffect(() => {
    const hideExcalidrawBranding = () => {
      // Hide help dialog external links
      document.querySelectorAll(".HelpDialog__header a").forEach((el) => {
        const href = el.getAttribute("href");
        if (
          href &&
          (href.includes("plus.excalidraw") ||
            href.includes("github.com/excalidraw") ||
            href.includes("youtube.com/@excalidraw"))
        ) {
          (el as HTMLElement).style.display = "none";
        }
      });

      // Hide "Excalidraw links" group in main menu
      document.querySelectorAll(".dropdown-menu-group-title").forEach((el) => {
        if (el.textContent?.includes("Excalidraw")) {
          (el as HTMLElement).style.display = "none";
          // Hide subsequent sibling items until next separator or group title
          let sibling = el.nextElementSibling;
          while (
            sibling &&
            !sibling.classList.contains("dropdown-menu-item-separator") &&
            !sibling.classList.contains("dropdown-menu-group-title")
          ) {
            (sibling as HTMLElement).style.display = "none";
            sibling = sibling.nextElementSibling;
          }
          // Also hide the separator right after the group
          if (sibling?.classList.contains("dropdown-menu-item-separator")) {
            (sibling as HTMLElement).style.display = "none";
          }
        }
      });
    };

    const observer = new MutationObserver(hideExcalidrawBranding);
    observer.observe(document.body, { childList: true, subtree: true });
    hideExcalidrawBranding();

    return () => observer.disconnect();
  }, []);

  // Debounced change handler — only emits if page hasn't changed mid-debounce
  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!onChange) return;

      clearTimeout(debounceRef.current);
      const capturedPage = pageNumber;

      debounceRef.current = setTimeout(() => {
        if (currentPageRef.current !== capturedPage) return;

        const userElements = elements.filter(
          (el: any) => !isPdfImageElement(el)
        );
        const userFiles: any = {};
        Object.entries(files || {}).forEach(([key, value]: [string, any]) => {
          if (!isPdfFileId(key)) userFiles[key] = value;
        });

        onChange({ elements: userElements, appState, files: userFiles });
      }, 500);
    },
    [onChange, pageNumber]
  );

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-950 overflow-hidden">
      <Excalidraw
        excalidrawAPI={setApi}
        initialData={initialData}
        onChange={handleChange}
        theme={isDarkMode ? "dark" : "light"}
        zenModeEnabled={!spreadView}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
};
