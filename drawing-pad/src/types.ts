export type DrawingTool = 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow';

export type CanvasBgType = 'white' | 'cream' | 'dark' | 'grid' | 'dots' | 'ruled';

export type UITheme = 'retro' | 'light' | 'dark' | 'blueprint' | 'cyberpunk';

export interface BrushSettings {
  tool: DrawingTool;
  color: string;
  size: number;
  opacity: number; // 0 to 1
  fillShapes: boolean;
}

export interface CanvasHistoryState {
  canvasState: HTMLCanvasElement; // Offscreen canvas capturing the drawing
}

export interface SavedDraft {
  id: string;
  name: string;
  previewUrl: string; // Base64 data url for preview thumbnail
  bgType: CanvasBgType;
  bgColor: string;
  createdAt: number;
  width: number;
  height: number;
  canvasDataUrl: string; // Full high-res drawing data url
}

export interface Point {
  x: number;
  y: number;
}
