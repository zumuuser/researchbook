export interface Book {
  id: number;
  title: string;
  file_path: string;
  total_pages: number;
  created_at: number;
}

export interface PageState {
  id: number;
  book_id: number;
  page_number: number;
  canvas_state: string;
  highlights: string;
  updated_at: number;
}

export interface Highlight {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface PdfOutlineItem {
  title: string;
  page: number;
  items?: PdfOutlineItem[];
}
