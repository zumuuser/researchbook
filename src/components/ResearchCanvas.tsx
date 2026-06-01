import { useEffect, useRef, useCallback } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";

const PDF_IMAGE_ID = "pdf-background";
const PDF_FILE_ID = "pdf-background-file";

function createPdfImageElement(width: number, height: number): any {
  return {
    id: PDF_IMAGE_ID,
    type: "image",
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    fileId: PDF_FILE_ID,
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
  };
}

function createPdfFile(dataURL: string): any {
  return {
    mimeType: "image/webp",
    id: PDF_FILE_ID,
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
        elements: data.elements.filter((el: any) => el.id !== PDF_IMAGE_ID),
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

const CanvasInner: React.FC<ResearchCanvasProps> = ({
  pageNumber,
  pdfImageUrl,
  pdfWidth,
  pdfHeight,
  initialSnapshot,
  onChange,
  isDarkMode,
}) => {
  const apiRef = useRef<any>(null);
  const lastSceneKey = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const currentPageRef = useRef(pageNumber);

  useEffect(() => {
    currentPageRef.current = pageNumber;
  }, [pageNumber]);

  // Update scene whenever page, snapshot, or PDF image changes
  useEffect(() => {
    if (!apiRef.current) return;

    const sceneKey = `${pageNumber}-${initialSnapshot}-${pdfImageUrl}`;
    if (sceneKey === lastSceneKey.current) return;
    lastSceneKey.current = sceneKey;

    const { elements: savedElements, files: savedFiles } = parseSnapshot(initialSnapshot);

    let elements = [...savedElements];
    const files: any = { ...savedFiles };

    if (pdfImageUrl && pdfWidth && pdfHeight) {
      const imageEl = createPdfImageElement(pdfWidth, pdfHeight);
      elements = [imageEl, ...elements];
      files[PDF_FILE_ID] = createPdfFile(pdfImageUrl);
    }

    apiRef.current.updateScene({
      elements,
      files,
      appState: {
        scrollX: window.innerWidth / 2,
        scrollY: window.innerHeight / 2,
        zoom: { value: 1 },
      },
      commitToHistory: false,
    });

    const timeout = setTimeout(() => {
      apiRef.current?.scrollToContent();
    }, 100);

    return () => clearTimeout(timeout);
  }, [pageNumber, initialSnapshot, pdfImageUrl, pdfWidth, pdfHeight]);

  // Debounced change handler — only saves if page hasn't changed since debounce started
  const handleChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (!onChange) return;

      clearTimeout(debounceRef.current);
      const capturedPage = pageNumber;

      debounceRef.current = setTimeout(() => {
        if (currentPageRef.current !== capturedPage) return;

        const userElements = elements.filter((el: any) => el.id !== PDF_IMAGE_ID);
        const userFiles: any = {};
        Object.entries(files || {}).forEach(([key, value]: [string, any]) => {
          if (key !== PDF_FILE_ID) userFiles[key] = value;
        });

        onChange({ elements: userElements, appState, files: userFiles });
      }, 500);
    },
    [onChange, pageNumber]
  );

  const handleApiReady = useCallback((api: any) => {
    apiRef.current = api;
  }, []);

  return (
    <Excalidraw
      excalidrawAPI={handleApiReady}
      onChange={handleChange}
      theme={isDarkMode ? "dark" : "light"}
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
  );
};

export const ResearchCanvas: React.FC<ResearchCanvasProps> = (props) => {
  return (
    <div className="w-full h-full bg-white dark:bg-neutral-950 overflow-hidden">
      <CanvasInner {...props} />
    </div>
  );
};
