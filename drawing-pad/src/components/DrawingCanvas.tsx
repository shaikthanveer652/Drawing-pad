import React, { useRef, useState, useEffect } from 'react';
import { 
  BrushSettings, 
  CanvasBgType, 
  Point, 
  SavedDraft,
  UITheme
} from '../types';
import { 
  Undo2, 
  Redo2, 
  Trash2, 
  ImageIcon, 
  Sparkles,
  Eye,
  EyeOff,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DrawingCanvasProps {
  uiTheme: UITheme;
  brushSettings: BrushSettings;
  backgroundType: CanvasBgType;
  customBgColor: string;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  onSaveDraft: (canvasDataUrl: string) => void;
  loadedDraft: SavedDraft | null;
  setLoadedDraft: (draft: SavedDraft | null) => void;
}

export default function DrawingCanvas({
  uiTheme,
  brushSettings,
  backgroundType,
  customBgColor,
  setBrushSettings,
  onSaveDraft,
  loadedDraft,
  setLoadedDraft
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<HTMLCanvasElement[]>([]);
  const [redoStack, setRedoStack] = useState<HTMLCanvasElement[]>([]);

  // Tracer background image states
  const [tracerImage, setTracerImage] = useState<HTMLImageElement | null>(null);
  const [tracerOpacity, setTracerOpacity] = useState<number>(0.5);
  const [showTracer, setShowTracer] = useState<boolean>(true);
  const [tracerFit, setTracerFit] = useState<'fit' | 'fill' | 'original'>('fit');
  const [tracerScale, setTracerScale] = useState<number>(1);
  const [tracerOffset, setTracerOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDraggingTracer, setIsDraggingTracer] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [isTracerMoveMode, setIsTracerMoveMode] = useState(false);

  // Screen metrics
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [canvasPreset, setCanvasPreset] = useState<'window' | 'square' | 'a4_landscape' | 'fhd'>('window');

  // Backup for active trace rendering
  const [tempSnapshot, setTempSnapshot] = useState<HTMLCanvasElement | null>(null);

  // Coordinate display
  const [statusMessage, setStatusMessage] = useState<string>('Ready to draw');

  // 1. Initialize canvas sizing and maintain proportions on resize or preset change
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const widthPreset = getPresetWidth();
      const heightPreset = getPresetHeight();
      
      // Save current drawing prior to resize
      const backup = saveToTempCanvas(canvasRef.current);

      setCanvasDimensions({ width: widthPreset, height: heightPreset });
      
      // Re-initialize with crisp settings
      setTimeout(() => {
        if (!canvasRef.current || !backup) return;
        restoreFromTempCanvas(canvasRef.current, backup);
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasPreset]);

  // Adjust canvas parameters on DPI changes or scaling
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    // Check if current resolution matches DPR scaled sizes
    const targetPhysicalWidth = canvasDimensions.width * dpr;
    const targetPhysicalHeight = canvasDimensions.height * dpr;

    if (canvas.width !== targetPhysicalWidth || canvas.height !== targetPhysicalHeight) {
      const backup = saveToTempCanvas(canvas);
      
      canvas.width = targetPhysicalWidth;
      canvas.height = targetPhysicalHeight;
      canvas.style.width = `${canvasDimensions.width}px`;
      canvas.style.height = `${canvasDimensions.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      if (backup) {
        setTimeout(() => {
          restoreFromTempCanvas(canvas, backup);
        }, 10);
      }
    }
  }, [canvasDimensions]);

  // Handle Draft Loading
  useEffect(() => {
    if (loadedDraft && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        // Clear history on loading a draft to state a fresh baseline
        saveHistoryState();
        
        ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
        ctx.drawImage(img, 0, 0, canvasDimensions.width, canvasDimensions.height);
        
        setStatusMessage(`Loaded draft: ${loadedDraft.name}`);
        setLoadedDraft(null); // Reset after consumption
      };
      img.src = loadedDraft.canvasDataUrl;
    }
  }, [loadedDraft]);

  const getPresetWidth = (): number => {
    if (!containerRef.current) return 800;
    const parentWidth = containerRef.current.clientWidth - 16; // soft padding padding
    switch (canvasPreset) {
      case 'square': return Math.min(parentWidth, 650);
      case 'a4_landscape': return Math.min(parentWidth, 842);
      case 'fhd': return Math.min(parentWidth, 1000);
      case 'window':
      default: return parentWidth;
    }
  };

  const getPresetHeight = (): number => {
    if (!containerRef.current) return 600;
    const parentHeight = containerRef.current.clientHeight - 16;
    switch (canvasPreset) {
      case 'square': return Math.min(parentHeight, 650);
      case 'a4_landscape': return Math.min(parentHeight, 595);
      case 'fhd': return Math.min(parentHeight, 562);
      case 'window':
      default: return Math.max(parentHeight, 450);
    }
  };

  // Helper: Backup canvas content to a virtual canvas
  const saveToTempCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
    const temp = document.createElement('canvas');
    temp.width = sourceCanvas.width;
    temp.height = sourceCanvas.height;
    const tempCtx = temp.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(sourceCanvas, 0, 0);
    }
    return temp;
  };

  // Helper: Restore canvas from temperature virtual canvas
  const restoreFromTempCanvas = (destCanvas: HTMLCanvasElement, sourceCanvas: HTMLCanvasElement) => {
    const ctx = destCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, destCanvas.width / (window.devicePixelRatio || 1), destCanvas.height / (window.devicePixelRatio || 1));
    ctx.drawImage(
      sourceCanvas, 
      0, 0, sourceCanvas.width, sourceCanvas.height,
      0, 0, destCanvas.width / (window.devicePixelRatio || 1), destCanvas.height / (window.devicePixelRatio || 1)
    );
  };

  const getDeviceCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Mouse coords
    if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    
    // Touch coords
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      return {
        x: e.changedTouches[0].clientX - rect.left,
        y: e.changedTouches[0].clientY - rect.top
      };
    }
    
    return { x: 0, y: 0 };
  };

  // Save drawing state into stack for Undo actions
  const saveHistoryState = () => {
    if (!canvasRef.current) return;
    const snap = saveToTempCanvas(canvasRef.current);
    
    setUndoStack(prev => {
      const next = [...prev, snap];
      if (next.length > 30) next.shift(); // Bound memory allocations
      return next;
    });
    setRedoStack([]); // Clear redo after fresh draw operation
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !canvasRef.current) return;
    const lastState = undoStack[undoStack.length - 1];
    
    // Current is saved to Redo stack before restoring state
    const currentState = saveToTempCanvas(canvasRef.current);
    setRedoStack(prev => [...prev, currentState]);
    
    // Restore
    restoreFromTempCanvas(canvasRef.current, lastState);
    setUndoStack(prev => prev.slice(0, -1));
    setStatusMessage('Undo completed');
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !canvasRef.current) return;
    const nextState = redoStack[redoStack.length - 1];
    
    // Current is saved back to Undo
    const currentState = saveToTempCanvas(canvasRef.current);
    setUndoStack(prev => [...prev, currentState]);
    
    // Restore
    restoreFromTempCanvas(canvasRef.current, nextState);
    setRedoStack(prev => prev.slice(0, -1));
    setStatusMessage('Redo completed');
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    if (window.confirm("Are you sure you want to clear your drawing? This cannot be undone.")) {
      saveHistoryState();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      }
      setStatusMessage('Canvas cleared');
    }
  };

  // Touch and Mouse Start
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();
    if (!canvasRef.current) return;

    const coords = getDeviceCoordinates(e);

    // If tracing move mode is enabled, we move image, not draw
    if (isTracerMoveMode && tracerImage) {
      setIsDraggingTracer(true);
      setDragStart({
        x: coords.x - tracerOffset.x,
        y: coords.y - tracerOffset.y
      });
      return;
    }

    saveHistoryState();
    setIsDrawing(true);
    setStartPoint(coords);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture temporary snapshot for shapes
    const snap = saveToTempCanvas(canvas);
    setTempSnapshot(snap);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    // Apply active brush config
    applyBrushStyles(ctx);

    // For instantaneous freehand dot on click/tap
    if (brushSettings.tool === 'pen' || brushSettings.tool === 'pencil' || brushSettings.tool === 'highlighter' || brushSettings.tool === 'eraser') {
      if (brushSettings.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    
    setMousePos(coords);
    setStatusMessage(`Drawing with ${brushSettings.tool} at (${Math.round(coords.x)}, ${Math.round(coords.y)})`);
  };

  // Touch and Mouse Move
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getDeviceCoordinates(e);
    setMousePos(coords);

    if (isDraggingTracer && tracerImage) {
      setTracerOffset({
        x: coords.x - dragStart.x,
        y: coords.y - dragStart.y
      });
      return;
    }

    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pathTools = ['pen', 'pencil', 'highlighter', 'eraser'];

    if (pathTools.includes(brushSettings.tool)) {
      // Freehand drawing mode
      applyBrushStyles(ctx);
      if (brushSettings.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      // Shape tools mode: redraw snapshot baseline first to avoid drag streaks
      if (tempSnapshot) {
        restoreFromTempCanvas(canvas, tempSnapshot);
      }
      
      applyBrushStyles(ctx);
      ctx.globalCompositeOperation = 'source-over';

      if (brushSettings.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } 
      else if (brushSettings.tool === 'rectangle') {
        const x = Math.min(startPoint.x, coords.x);
        const y = Math.min(startPoint.y, coords.y);
        const w = Math.abs(startPoint.x - coords.x);
        const h = Math.abs(startPoint.y - coords.y);
        
        if (brushSettings.fillShapes) {
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();
      } 
      else if (brushSettings.tool === 'circle') {
        // Radius is distance formula
        const radius = Math.sqrt(
          Math.pow(coords.x - startPoint.x, 2) + Math.pow(coords.y - startPoint.y, 2)
        );
        
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        if (brushSettings.fillShapes) {
          ctx.fill();
        }
        ctx.stroke();
      } 
      else if (brushSettings.tool === 'arrow') {
        ctx.fillStyle = brushSettings.color;
        drawArrow(ctx, startPoint.x, startPoint.y, coords.x, coords.y, brushSettings.size);
      }
    }

    setStatusMessage(`Position: (${Math.round(coords.x)}px, ${Math.round(coords.y)}px)`);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    setIsDraggingTracer(false);
    setTempSnapshot(null);
  };

  // Setup current canvas context fields based on user brush preferences
  const applyBrushStyles = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = brushSettings.color;
    ctx.lineWidth = brushSettings.size;
    
    // Specialized brush profiles
    if (brushSettings.tool === 'pencil') {
      ctx.globalAlpha = 0.5 * brushSettings.opacity;
      ctx.lineWidth = Math.max(1.5, brushSettings.size * 0.4); // Pencils are fine/sharp
    } else if (brushSettings.tool === 'highlighter') {
      ctx.globalAlpha = 0.3 * brushSettings.opacity;
    } else {
      ctx.globalAlpha = brushSettings.opacity;
    }

    if (brushSettings.fillShapes) {
      // Standard translucent fill style for shapes
      ctx.fillStyle = brushSettings.color;
    }
  };

  // Draw Arrow arrow algorithm
  const drawArrow = (
    ctx: CanvasRenderingContext2D, 
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    size: number
  ) => {
    // Arrow stem
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrow tip calculations
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = Math.max(size * 3, 12);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // Image Tracer loader (File selection callback)
  const handleTracerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        setTracerImage(img);
        setShowTracer(true);
        setTracerOffset({ x: 0, y: 0 });
        setTracerScale(1);
        setStatusMessage('Tracer image imported! Draw on top.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Generate complete final bundle (canvas + grid background style) and trigger download
  const handleExport = (format: 'png' | 'jpeg', includeGrid: boolean) => {
    if (!canvasRef.current) return;
    
    // 1. Create matching offscreen canvas to paint layers (for clean solid export background)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);

    // 2. Clear background as white/dark color matching user canvas view state
    ctx.fillStyle = getBgHexValue();
    ctx.fillRect(0, 0, canvasDimensions.width, canvasDimensions.height);

    // 3. Draw grid system if includeGrid selected
    if (includeGrid) {
      drawExportGrids(ctx);
    }

    // 4. Draw optional Tracer image if enabled
    if (showTracer && tracerImage) {
      drawTracerOntoExport(ctx);
    }

    // 5. Draw user canvas drawings
    ctx.drawImage(canvasRef.current, 0, 0, canvasDimensions.width, canvasDimensions.height);

    // 6. Convert and download
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.92;
    const dataUrl = exportCanvas.toDataURL(mime, quality);
    
    const link = document.createElement('a');
    link.download = `drawing-pad-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
    
    setStatusMessage(`Exported drawing as ${format.toUpperCase()}`);
  };

  // Helper values for solid backgrounds
  const getBgClass = () => {
    switch (backgroundType) {
      case 'cream': return 'bg-[#FAF8F5]';
      case 'dark': return 'bg-[#18181B]';
      case 'white':
      default: return 'bg-white';
    }
  };

  const getBgHexValue = () => {
    switch (backgroundType) {
      case 'cream': return '#FAF8F5';
      case 'dark': return '#18181B';
      case 'white':
      default: return '#FFFFFF';
    }
  };

  // Render tracer image on export context
  const drawTracerOntoExport = (ctx: CanvasRenderingContext2D) => {
    if (!tracerImage) return;

    let targetWidth = tracerImage.width;
    let targetHeight = tracerImage.height;

    const canvasAspectRatio = canvasDimensions.width / canvasDimensions.height;
    const imgAspectRatio = tracerImage.width / tracerImage.height;

    let x = 0;
    let y = 0;

    if (tracerFit === 'fit') {
      if (imgAspectRatio > canvasAspectRatio) {
        targetWidth = canvasDimensions.width * tracerScale;
        targetHeight = (canvasDimensions.width / imgAspectRatio) * tracerScale;
      } else {
        targetHeight = canvasDimensions.height * tracerScale;
        targetWidth = (canvasDimensions.height * imgAspectRatio) * tracerScale;
      }
      x = (canvasDimensions.width - targetWidth) / 2 + tracerOffset.x;
      y = (canvasDimensions.height - targetHeight) / 2 + tracerOffset.y;
    } else if (tracerFit === 'fill') {
      if (imgAspectRatio > canvasAspectRatio) {
        targetHeight = canvasDimensions.height * tracerScale;
        targetWidth = (canvasDimensions.height * imgAspectRatio) * tracerScale;
      } else {
        targetWidth = canvasDimensions.width * tracerScale;
        targetHeight = (canvasDimensions.width / imgAspectRatio) * tracerScale;
      }
      x = (canvasDimensions.width - targetWidth) / 2 + tracerOffset.x;
      y = (canvasDimensions.height - targetHeight) / 2 + tracerOffset.y;
    } else { // original
      targetWidth = tracerImage.width * tracerScale;
      targetHeight = tracerImage.height * tracerScale;
      x = tracerOffset.x;
      y = tracerOffset.y;
    }

    ctx.save();
    ctx.globalAlpha = tracerOpacity;
    ctx.drawImage(tracerImage, x, y, targetWidth, targetHeight);
    ctx.restore();
  };

  // Generate grids into offline canvas for export matches
  const drawExportGrids = (ctx: CanvasRenderingContext2D) => {
    const strokeColor = backgroundType === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;

    const width = canvasDimensions.width;
    const height = canvasDimensions.height;

    if (backgroundType === 'grid') {
      const step = 20;
      // Verticals
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontals
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } 
    else if (backgroundType === 'dots') {
      const step = 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let x = 10; x < width; x += step) {
        for (let y = 10; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } 
    else if (backgroundType === 'ruled') {
      const step = 28;
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  // Compute CSS grid overlays properties
  const getGridStyle = (): React.CSSProperties => {
    const color = backgroundType === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const dotColor = backgroundType === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

    switch (backgroundType) {
      case 'grid':
        return {
          backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundColor: getBgHexValue()
        };
      case 'dots':
        return {
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundColor: getBgHexValue()
        };
      case 'ruled':
        return {
          backgroundImage: `linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
          backgroundSize: '100% 28px',
          backgroundColor: getBgHexValue()
        };
      case 'white':
      case 'cream':
      case 'dark':
      default:
        return {
          backgroundColor: getBgHexValue()
        };
    }
  };

  // Compute stylus canvas virtual overlay styles
  const getStylusCursorStyle = (): React.CSSProperties => {
    if (!isMouseInCanvas) return { display: 'none' };
    
    // Center circle cursor on active stylus tracker x/y
    return {
      left: `${mousePos.x}px`,
      top: `${mousePos.y}px`,
      width: `${brushSettings.size}px`,
      height: `${brushSettings.size}px`,
      borderColor: brushSettings.tool === 'eraser' ? '#EF4444' : brushSettings.color,
      borderStyle: brushSettings.tool === 'highlighter' ? 'dashed' : 'solid',
      backgroundColor: brushSettings.tool === 'eraser' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none'
    };
  };

  const themeClasses = {
    retro: {
      actionBg: 'bg-white text-[#141414] border-[#141414]',
      actionBorder: 'border-[#141414]',
      actionBtnActive: 'bg-[#141414] text-white',
      actionBtnInactive: 'text-[#141414] hover:bg-[#E4E3E0]',
      viewportBg: 'bg-[#E4E3E0]',
      viewportBorder: 'border-4 border-[#141414]',
      footerBg: 'bg-white border-[#141414] text-[#141414]',
      tracerBarBg: 'bg-white border-[#141414] text-[#141414]',
      tracerModeActive: 'bg-[#141414] text-white border-[#141414]',
      tracerModeInactive: 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]',
      boxBg: 'bg-white border-[#141414]'
    },
    light: {
      actionBg: 'bg-[#FAFAFA] text-[#18181B] border-[#D4D4D8]',
      actionBorder: 'border-[#D4D4D8]',
      actionBtnActive: 'bg-[#18181B] text-white',
      actionBtnInactive: 'text-[#18181B] hover:bg-neutral-100',
      viewportBg: 'bg-[#F4F4F5]',
      viewportBorder: 'border border-[#B4B4B8]',
      footerBg: 'bg-white border-[#D4D4D8] text-[#18181B]',
      tracerBarBg: 'bg-white border-[#D4D4D8] text-[#18181B]',
      tracerModeActive: 'bg-[#18181B] text-white border-[#18181B]',
      tracerModeInactive: 'bg-white text-[#18181B] border-[#D4D4D8] hover:bg-neutral-100',
      boxBg: 'bg-white border-[#D4D4D8]'
    },
    dark: {
      actionBg: 'bg-[#09090B] text-[#F4F4F5] border-[#27272A]',
      actionBorder: 'border-[#27272A]',
      actionBtnActive: 'bg-white text-black',
      actionBtnInactive: 'text-[#F4F4F5] hover:bg-[#27272A]',
      viewportBg: 'bg-[#09090B]',
      viewportBorder: 'border border-[#3f3f46]',
      footerBg: 'bg-[#18181B] border-[#27272A] text-[#F4F4F5]',
      tracerBarBg: 'bg-[#18181B] border-[#27272A] text-[#F4F4F5]',
      tracerModeActive: 'bg-white text-[#09090B] border-white',
      tracerModeInactive: 'bg-[#18181B] text-[#F4F4F5] border-[#27272A] hover:bg-[#27272A]',
      boxBg: 'bg-[#09090B] border-[#27272A]'
    },
    blueprint: {
      actionBg: 'bg-[#0B132B] text-[#5BC0BE] border-[#1E3A8A]',
      actionBorder: 'border-[#1E3A8A]',
      actionBtnActive: 'bg-[#00B4D8] text-[#0B132B]',
      actionBtnInactive: 'text-[#5BC0BE] hover:bg-[#1C2541]',
      viewportBg: 'bg-[#0B132B]',
      viewportBorder: 'border border-[#1E3A8A] shadow-[0_0_15px_rgba(0,180,216,0.15)]',
      footerBg: 'bg-[#1C2541] border-[#1E3A8A] text-[#00B4D8]',
      tracerBarBg: 'bg-[#1C2541] border-[#1E3A8A] text-[#5BC0BE]',
      tracerModeActive: 'bg-[#00B4D8] text-[#0B132B] border-[#00B4D8]',
      tracerModeInactive: 'bg-[#1C2541] text-[#00B4D8] border-[#1E3A8A] hover:bg-[#3A506B]',
      boxBg: 'bg-[#0B132B] border-[#1E3A8A]'
    },
    cyberpunk: {
      actionBg: 'bg-[#06070B] text-[#FACC15] border-[#FACC15]',
      actionBorder: 'border-[#FACC15]',
      actionBtnActive: 'bg-[#FACC15] text-black',
      actionBtnInactive: 'text-[#FACC15] opacity-80 hover:opacity-100 hover:bg-[#1E2132]',
      viewportBg: 'bg-[#0D0E15]',
      viewportBorder: 'border-2 border-[#FACC15] shadow-[0_0_20px_rgba(250,204,21,0.25)]',
      footerBg: 'bg-[#161824] border-[#FACC15] text-[#FACC15]',
      tracerBarBg: 'bg-[#161824] border-[#FACC15] text-[#FACC15]',
      tracerModeActive: 'bg-[#FACC15] text-black border-[#FACC15]',
      tracerModeInactive: 'bg-black text-[#FACC15] border-[#FACC15] hover:bg-[#11131C]',
      boxBg: 'bg-black border-[#FACC15]'
    }
  };

  const style = themeClasses[uiTheme] || themeClasses.retro;

  return (
    <div id="drawing_workspace_wrapper" className={`flex flex-col flex-1 h-full min-h-0 ${style.viewportBg} transition-colors duration-300`}>
      {/* Top action header */}
      <div id="canvas_top_actions" className={`flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b ${style.actionBorder} ${style.actionBg} transition-colors duration-300`}>
        <div className={`flex items-center gap-1.5 p-1 rounded-none border ${style.actionBorder} bg-neutral-400/5`}>
          <button
            id="btn_undo"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1 px-2.5 font-mono text-[11px] uppercase transition-all cursor-pointer font-bold disabled:opacity-30 text-inherit hover:bg-neutral-500/10"
            title="Undo stroke (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            id="btn_redo"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1 px-2.5 font-mono text-[11px] uppercase transition-all cursor-pointer font-bold disabled:opacity-30 text-inherit hover:bg-neutral-500/10"
            title="Redo stroke (Ctrl+Y)"
          >
            Redo
          </button>
          <div className={`w-px h-5 ${style.actionBorder} mx-1 border-l`} />
          <button
            id="btn_clear_all"
            onClick={handleClear}
            className="p-1 px-2.5 font-mono text-[11px] uppercase hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer font-bold"
            title="Clear the entire page canvas"
          >
            Reset
          </button>
        </div>

        {/* Canvas presets options selector */}
        <div className="flex items-center gap-2">
          <div className={`flex p-1 rounded-none border ${style.actionBorder} bg-neutral-400/5 text-xs font-mono`}>
            {(['window', 'square', 'a4_landscape', 'fhd'] as const).map((preset) => (
              <button
                key={preset}
                id={`set_preset_${preset}`}
                onClick={() => setCanvasPreset(preset)}
                className={`px-2 py-0.5 uppercase tracking-wider text-[10px] transition-colors cursor-pointer font-bold ${canvasPreset === preset ? style.actionBtnActive : style.actionBtnInactive}`}
              >
                {preset === 'window' ? 'Fit Screen' : preset === 'a4_landscape' ? 'A4' : preset === 'fhd' ? 'FHD' : 'Square'}
              </button>
            ))}
          </div>

          <button
            id="btn_save_draft"
            onClick={() => {
              if (canvasRef.current) {
                onSaveDraft(canvasRef.current.toDataURL());
              }
            }}
            className={`px-4 py-1.5 text-xs font-mono uppercase transition-colors cursor-pointer font-bold border ${
              uiTheme === 'cyberpunk' ? 'bg-[#FACC15] text-black border-[#FACC15]' :
              uiTheme === 'blueprint' ? 'bg-[#00B4D8] text-black border-[#00B4D8]' :
              uiTheme === 'dark' ? 'bg-white text-[#09090B]' :
              'bg-[#141414] text-white border-[#141414]'
            }`}
          >
            Capture Draft
          </button>
        </div>

        {/* Export triggers */}
        <div className={`flex items-center gap-1 p-1 rounded-none border ${style.actionBorder} bg-neutral-400/5`}>
          <button
            id="export_png_pure"
            onClick={() => handleExport('png', false)}
            className="px-3 py-1 font-mono text-[11px] hover:bg-neutral-500/10 transition-all cursor-pointer font-bold"
            title="Download sharp PNG of drawing elements"
          >
            PNG
          </button>
          <button
            id="export_png_grid"
            onClick={() => handleExport('png', true)}
            className="px-3 py-1 font-mono text-[11px] hover:bg-neutral-500/10 transition-all cursor-pointer font-bold"
            title="Download PNG along with the paper grid pattern"
          >
            PNG + GRID
          </button>
          <button
            id="export_jpg"
            onClick={() => handleExport('jpeg', false)}
            className="px-3 py-1 font-mono text-[11px] hover:bg-neutral-500/10 transition-all cursor-pointer font-bold"
            title="Download fast JPG"
          >
            JPG
          </button>
        </div>
      </div>

      {/* Tracer controls strip */}
      <div id="tracer_settings_bar" className={`px-6 py-2 border-b flex flex-wrap items-center gap-4 text-xs font-mono transition-colors duration-300 ${style.tracerBarBg}`}>
        <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 border hover:bg-neutral-500/10 transition-colors ${style.actionBorder}`}>
          <ImageIcon size={14} />
          <span className="uppercase text-[11px] tracking-wider font-bold">Tracer Template</span>
          <input 
            id="tracer_image_file"
            type="file" 
            accept="image/*" 
            onChange={handleTracerUpload} 
            className="hidden" 
          />
        </label>

        {tracerImage && (
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <button
                id="btn_toggle_tracer"
                onClick={() => setShowTracer(prev => !prev)}
                className={`p-1 border cursor-pointer transition-colors ${!showTracer ? 'bg-red-500 text-white border-red-500' : `${style.actionBtnInactive} ${style.actionBorder}`}`}
                title={showTracer ? "Hide overlay template" : "Show overlay template"}
              >
                {showTracer ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[180px]">
              <span className="shrink-0 text-[11px] uppercase font-bold font-mono">Opacity: {Math.round(tracerOpacity * 100)}%</span>
              <input 
                id="range_tracer_opacity"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={tracerOpacity}
                onChange={(e) => setTracerOpacity(parseFloat(e.target.value))}
                className="w-full h-1 rounded-none cursor-pointer accent-current"
              />
            </div>

            <button
              id="set_tracer_move"
              onClick={() => setIsTracerMoveMode(prev => !prev)}
              className={`flex items-center gap-1 px-3 py-1.5 text-[11px] uppercase border cursor-pointer font-bold transition-all ${isTracerMoveMode ? style.tracerModeActive : style.tracerModeInactive}`}
              title="Move or scale the underlying tracing guide image"
            >
              <Move size={12} />
              <span>{isTracerMoveMode ? 'Move mode' : 'Draw mode'}</span>
            </button>

            {isTracerMoveMode && (
              <div className={`flex items-center gap-3 px-3 py-1 border ${style.actionBorder} bg-neutral-400/5`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold">Zoom:</span>
                  <input
                    id="input_tracer_scale"
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={tracerScale}
                    onChange={(e) => setTracerScale(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-current"
                  />
                </div>
                <button
                  id="reset_tracer_alignment"
                  onClick={() => {
                    setTracerOffset({ x: 0, y: 0 });
                    setTracerScale(1);
                  }}
                  className="text-[10px] uppercase font-bold underline cursor-pointer hover:opacity-85"
                >
                  Reset
                </button>
              </div>
            )}
            
            <button
              id="clear_tracer_image"
              onClick={() => {
                setTracerImage(null);
                setIsTracerMoveMode(false);
              }}
              className="text-red-500 font-bold hover:underline text-[11px] uppercase ml-auto cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Main painting viewport stage area */}
      <div 
        id="painting_stage_viewport" 
        ref={containerRef}
        className={`flex-1 p-6 overflow-auto flex items-center justify-center min-h-0 relative select-none ${style.viewportBg} transition-colors duration-300`}
      >
        <div
          id="canvas_placement_casing"
          className={`relative max-w-full transition-all duration-300 ${style.viewportBorder} ${
            uiTheme === 'retro' ? 'shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]' : 'shadow-2xl'
          }`}
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
          }}
        >
          {/* Custom Stylus Canvas Grid CSS Layer */}
          <div 
            id="canvas_grid_mask_decor"
            className="absolute inset-0 z-0 transition-colors duration-300" 
            style={getGridStyle()}
          />

          {/* Tracer Guide Canvas Render Layer */}
          {showTracer && tracerImage && (
            <div 
              id="tracer_image_overlay_render"
              className="absolute inset-0 z-1 pointer-events-none select-none transition-opacity duration-200"
              style={{ opacity: tracerOpacity }}
            >
              <img
                src={tracerImage.src}
                referrerPolicy="no-referrer"
                alt="Tracer template"
                className="absolute origin-center object-none pointer-events-none"
                style={{
                  transform: `translate(${tracerOffset.x}px, ${tracerOffset.y}px) scale(${tracerScale})`,
                  top: tracerFit === 'fit' ? '0' : 'auto',
                  left: tracerFit === 'fit' ? '0' : 'auto',
                  width: '100%',
                  height: '100%',
                  objectFit: tracerFit === 'fit' ? 'contain' : tracerFit === 'fill' ? 'cover' : 'none'
                }}
              />
            </div>
          )}

          {/* Core Interactive HTML5 Canvas */}
          <canvas
            id="drawing_canvas_pane"
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={() => {
              endDrawing();
              setIsMouseInCanvas(false);
            }}
            onMouseEnter={() => setIsMouseInCanvas(true)}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="absolute inset-0 z-2 bg-transparent cursor-crosshair touch-none"
          />

          {/* Brush Pointer Custom Circle Overlay */}
          <div 
            id="canvas_stylus_cursor" 
            className="absolute z-10 border opacity-90 rounded-full bg-transparent transform -translate-x-1/2 -translate-y-1/2"
            style={getStylusCursorStyle()}
          />
        </div>
      </div>

      {/* Responsive canvas status bar metrics footer component */}
      <div id="canvas_status_footer" className={`h-12 border-t flex items-center px-6 justify-between select-none font-mono transition-colors duration-300 ${style.footerBg}`}>
        <div className="flex space-x-8">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase opacity-50">Brush Size</span>
            <span className="font-mono text-[11px] font-bold">{brushSettings.size}px</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase opacity-50">Opacity</span>
            <span className="font-mono text-[11px] font-bold">{Math.round(brushSettings.opacity * 100)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase opacity-50">Active Tool</span>
            <span className="font-mono text-[11px] font-bold uppercase">{brushSettings.tool}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase opacity-50">Status</span>
            <span className="font-mono text-[11px] truncate max-w-[200px] font-bold">{statusMessage}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[10px] uppercase opacity-60">X: {Math.round(mousePos.x)} Y: {Math.round(mousePos.y)}</span>
        </div>
      </div>
    </div>
  );
}
