import { useEffect, useRef } from "react";
import { Tldraw, TLEditorSnapshot, useEditor, loadSnapshot } from "@tldraw/tldraw";
import { useAppStore } from "@/store/appStore";
import "@tldraw/tldraw/tldraw.css";

const PDF_SHAPE_ID = "shape:pdf-page" as any;
const PDF_ASSET_ID = "asset:pdf-page" as any;

function isValidSnapshot(s: any): s is TLEditorSnapshot {
  return s && typeof s === "object" && typeof s.schemaVersion === "number";
}

interface ResearchCanvasProps {
  pageNumber?: number;
  pdfImageUrl?: string;
  pdfWidth?: number;
  pdfHeight?: number;
  initialSnapshot?: TLEditorSnapshot | string;
  onChange?: (snapshot: TLEditorSnapshot) => void;
  isDarkMode?: boolean;
}

const CanvasInner: React.FC<{
  pageNumber?: number;
  pdfImageUrl?: string;
  pdfWidth?: number;
  pdfHeight?: number;
  initialSnapshot?: TLEditorSnapshot | string;
  onChange?: (snapshot: TLEditorSnapshot) => void;
  isDarkMode?: boolean;
}> = ({ pageNumber, pdfImageUrl, pdfWidth, pdfHeight, initialSnapshot, onChange, isDarkMode }) => {
  const editor = useEditor();
  const lastPageRef = useRef(pageNumber);

  // Inject PDF image shape when URL changes
  useEffect(() => {
    if (!pdfImageUrl || !pdfWidth || !pdfHeight) return;
    if (!editor) return;

    // Remove old PDF shape/asset if exists
    try {
      const shape = editor.getShape(PDF_SHAPE_ID);
      if (shape) editor.deleteShape(PDF_SHAPE_ID);
    } catch {
      // ignore
    }
    try {
      const asset = editor.getAsset(PDF_ASSET_ID);
      if (asset) editor.deleteAssets([PDF_ASSET_ID]);
    } catch {
      // ignore
    }

    // Create image asset
    editor.createAssets([
      {
        id: PDF_ASSET_ID,
        type: "image",
        typeName: "asset",
        props: {
          name: "pdf-page",
          src: pdfImageUrl,
          w: pdfWidth,
          h: pdfHeight,
          mimeType: "image/webp",
          isAnimated: false,
        },
        meta: {},
      } as any,
    ]);

    // Create image shape centered at origin
    editor.createShape({
      id: PDF_SHAPE_ID,
      type: "image",
      x: -pdfWidth / 2,
      y: -pdfHeight / 2,
      isLocked: true,
      props: {
        w: pdfWidth,
        h: pdfHeight,
        assetId: PDF_ASSET_ID,
      },
    } as any);

    // Center camera on the PDF with padding
    const padding = 64;
    editor.zoomToBounds(
      { x: -pdfWidth / 2, y: -pdfHeight / 2, w: pdfWidth, h: pdfHeight },
      { inset: padding, animation: { duration: 300 } }
    );
  }, [editor, pdfImageUrl, pdfWidth, pdfHeight]);

  // When page changes, clear any stale user shapes so previous page annotations don't leak through
  useEffect(() => {
    if (!editor) return;
    if (lastPageRef.current === pageNumber) return;
    lastPageRef.current = pageNumber;

    const allShapes = editor.getCurrentPageShapes();
    const userShapes = allShapes.filter((s: any) => s.id !== PDF_SHAPE_ID);
    if (userShapes.length > 0) {
      editor.deleteShapes(userShapes);
    }
  }, [editor, pageNumber]);

  // Load per-page snapshot whenever it arrives from the DB
  useEffect(() => {
    if (!editor || !initialSnapshot) return;
    try {
      const snap =
        typeof initialSnapshot === "string"
          ? JSON.parse(initialSnapshot)
          : initialSnapshot;
      if (isValidSnapshot(snap)) {
        loadSnapshot(editor.store, snap);
      }
    } catch {
      // ignore invalid snapshots
    }
  }, [editor, initialSnapshot]);

  // Sync dark mode with tldraw editor
  useEffect(() => {
    if (!editor) return;
    editor.user.updateUserPreferences({
      colorScheme: isDarkMode ? "dark" : "light",
    });
  }, [editor, isDarkMode]);

  // Ensure tldraw UI is never hidden in focus mode
  useEffect(() => {
    if (!editor) return;
    editor.updateInstanceState({ isFocusMode: false });
  }, [editor]);

  // Auto-save on every edit (debounced 500ms)
  useEffect(() => {
    if (!onChange || !editor) return;
    let timeout: ReturnType<typeof setTimeout>;

    const unsubscribe = editor.store.listen(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const snapshot = editor.getSnapshot();
        onChange(snapshot);
      }, 500);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [editor, onChange]);

  // Save on unmount (page change / book close)
  useEffect(() => {
    return () => {
      if (onChange && editor) {
        const snapshot = editor.getSnapshot();
        onChange(snapshot);
      }
    };
  }, [editor, onChange]);

  return null;
};

export const ResearchCanvas: React.FC<ResearchCanvasProps> = ({
  pageNumber,
  pdfImageUrl,
  pdfWidth,
  pdfHeight,
  initialSnapshot,
  onChange,
  isDarkMode,
}) => {
  const { spreadView } = useAppStore();
  const parsedSnapshot = (() => {
    if (!initialSnapshot) return undefined;
    if (typeof initialSnapshot === "string") {
      try {
        const parsed = JSON.parse(initialSnapshot);
        return isValidSnapshot(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return isValidSnapshot(initialSnapshot) ? initialSnapshot : undefined;
  })();

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-950 overflow-hidden">
      <Tldraw hideUi={!spreadView} {...(parsedSnapshot ? { snapshot: parsedSnapshot } : {})}>
        <CanvasInner
          pageNumber={pageNumber}
          pdfImageUrl={pdfImageUrl}
          pdfWidth={pdfWidth}
          pdfHeight={pdfHeight}
          initialSnapshot={initialSnapshot}
          onChange={onChange}
          isDarkMode={isDarkMode}
        />
      </Tldraw>
    </div>
  );
};
