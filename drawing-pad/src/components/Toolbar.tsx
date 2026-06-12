import React, { useState } from 'react';
import { 
  BrushSettings, 
  CanvasBgType, 
  DrawingTool, 
  SavedDraft,
  UITheme
} from '../types';
import { 
  PenTool, 
  Paintbrush, 
  Eraser, 
  Circle, 
  Square, 
  TrendingUp, 
  LayoutGrid, 
  Notebook, 
  Maximize2, 
  FileEdit, 
  FolderOpen, 
  Clock, 
  Trash,
  Plus,
  ArrowUpRight,
  Sun,
  Moon,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarProps {
  uiTheme: UITheme;
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  backgroundType: CanvasBgType;
  setBackgroundType: (bgType: CanvasBgType) => void;
  drafts: SavedDraft[];
  onLoadDraft: (draft: SavedDraft) => void;
  onDeleteDraft: (id: string) => void;
  onClearDrafts: () => void;
}

const presetColors = [
  '#000000', // Black
  '#475569', // Gray/Slate
  '#DC2626', // Red
  '#EA580C', // Orange
  '#EAB308', // Yellow
  '#16A34A', // Green
  '#0D9488', // Teal
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#FFFFFF', // White
];

export default function Toolbar({
  uiTheme,
  brushSettings,
  setBrushSettings,
  backgroundType,
  setBackgroundType,
  drafts,
  onLoadDraft,
  onDeleteDraft,
  onClearDrafts
}: ToolbarProps) {
  const [customColor, setCustomColor] = useState('#2563EB');
  const [activeTab, setActiveTab] = useState<'brush' | 'canvas' | 'drafts'>('brush');

  const themeClasses = {
    retro: {
      panel: 'bg-[#FAF8F5] border-[#141414]',
      header: 'border-[#141414] bg-white text-[#141414]',
      logo: 'border-[#141414] bg-[#E4E3E0] text-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]',
      tabsBar: 'border-[#141414] bg-white',
      tabsBtnActive: 'bg-[#141414] text-white',
      tabsBtnInactive: 'text-[#141414] hover:bg-[#E4E3E0]',
      scrollBg: 'bg-[#FAF8F5]',
      label: 'text-[#141414]',
      cardActive: 'border-[#141414] bg-[#E4E3E0] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-bold',
      cardInactive: 'border-[#141414] bg-white hover:bg-neutral-50',
      colorSwatchBtnActive: 'shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] scale-105 z-10',
      customColorBlock: 'bg-white border-2 border-[#141414]',
      customColorPickBtn: 'bg-[#E4E3E0] border border-[#141414] hover:bg-white text-[#141414]',
      inputHex: 'bg-white border border-[#141414] text-[#141414]',
      headerBox: 'border border-[#141414] bg-white',
      badgeClass: 'border border-[#141414] bg-white text-[#141414]',
      sliderTrack: 'bg-white border border-[#141414] accent-[#141414]',
      previewOuter: 'bg-white p-2.5 border-2 border-[#141414]',
      previewInner: 'bg-[#E4E3E0] border border-[#141414]',
      fillShapesCard: 'bg-white border-2 border-[#141414]',
      toggleOuter: 'border-2 border-[#141414]',
      toggleInnerActive: 'bg-[#141414]',
      toggleDotActive: 'translate-x-5 bg-white',
      toggleDotInactive: 'translate-x-0 bg-[#141414]',
    },
    light: {
      panel: 'bg-[#FAFAFA] border-[#D4D4D8]',
      header: 'border-[#D4D4D8] bg-white text-[#18181B]',
      logo: 'border-[#18181B] bg-neutral-100 text-[#18181B] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]',
      tabsBar: 'border-[#D4D4D8] bg-white',
      tabsBtnActive: 'bg-[#18181B] text-white',
      tabsBtnInactive: 'text-[#18181B] hover:bg-neutral-100',
      scrollBg: 'bg-[#FAFAFA]',
      label: 'text-[#18181B]',
      cardActive: 'border-[#18181B] bg-neutral-100 shadow-[1px_1px_0px_0px_rgba(24,24,27,1)] font-bold',
      cardInactive: 'border-[#E4E4E7] bg-white hover:bg-neutral-50',
      colorSwatchBtnActive: 'shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] scale-105 z-10',
      customColorBlock: 'bg-white border border-[#D4D4D8]',
      customColorPickBtn: 'bg-neutral-100 border border-[#D4D4D8] hover:bg-white text-[#18181B]',
      inputHex: 'bg-white border border-[#D4D4D8] text-[#18181B] [color-scheme:light]',
      headerBox: 'border border-[#D4D4D8] bg-white',
      badgeClass: 'border border-[#D4D4D8] bg-white text-[#18181B]',
      sliderTrack: 'bg-zinc-100 border border-[#D4D4D8] accent-[#18181B]',
      previewOuter: 'bg-white p-2 border border-[#D4D4D8]',
      previewInner: 'bg-neutral-50 border border-[#E9E9EB]',
      fillShapesCard: 'bg-white border border-[#D4D4D8]',
      toggleOuter: 'border border-[#D4D4D8]',
      toggleInnerActive: 'bg-[#18181B]',
      toggleDotActive: 'translate-x-5 bg-white',
      toggleDotInactive: 'translate-x-0 bg-[#18181B]',
    },
    dark: {
      panel: 'bg-[#18181B] border-[#27272A]',
      header: 'border-[#27272A] bg-[#09090B] text-[#F4F4F5]',
      logo: 'border-[#52525B] bg-[#27272A] text-[#F4F4F5] shadow-xs',
      tabsBar: 'border-[#27272A] bg-[#09090B]',
      tabsBtnActive: 'bg-white text-[#09090B]',
      tabsBtnInactive: 'text-[#A1A1AA] hover:bg-[#27272A] hover:text-white',
      scrollBg: 'bg-[#18181B]',
      label: 'text-[#A1A1AA]',
      cardActive: 'border-white bg-[#27272A] text-white font-bold',
      cardInactive: 'border-[#3f3f46] bg-[#09090B] text-[#D4D4D8] hover:bg-[#1C1C1F]',
      colorSwatchBtnActive: 'ring-2 ring-white scale-105 z-10',
      customColorBlock: 'bg-[#09090B] border border-[#27272A]',
      customColorPickBtn: 'bg-[#27272A] border border-[#52525B] hover:bg-[#3F3F46] text-[#F4F4F5]',
      inputHex: 'bg-[#09090B] border border-[#27272A] text-white [color-scheme:dark]',
      headerBox: 'border border-[#27272A] bg-[#09090B]',
      badgeClass: 'border border-[#27272A] bg-[#27272A] text-white',
      sliderTrack: 'bg-[#09090B] border border-[#27272A] accent-white',
      previewOuter: 'bg-[#09090B] p-2 border border-[#27272A]',
      previewInner: 'bg-[#27272A]',
      fillShapesCard: 'bg-[#09090B] border border-[#27272A]',
      toggleOuter: 'border border-[#3F3F46]',
      toggleInnerActive: 'bg-white',
      toggleDotActive: 'translate-x-5 bg-[#09090B]',
      toggleDotInactive: 'translate-x-0 bg-white',
    },
    blueprint: {
      panel: 'bg-[#1C2541] border-[#1E3A8A]',
      header: 'border-[#1E3A8A] bg-[#0B132B] text-[#5BC0BE]',
      logo: 'border-[#00B4D8] bg-[#1C2541] text-[#00B4D8] shadow-[0_0_10px_rgba(0,180,216,0.3)]',
      tabsBar: 'border-[#1E3A8A] bg-[#0B132B]',
      tabsBtnActive: 'bg-[#00B4D8] text-[#0B132B]',
      tabsBtnInactive: 'text-[#5BC0BE] hover:bg-[#1C2541]',
      scrollBg: 'bg-[#1C2541]',
      label: 'text-[#5BC0BE]',
      cardActive: 'border-[#00B4D8] bg-[#3A506B]/50 text-white font-bold shadow-[0_0_10px_rgba(0,180,216,0.2)]',
      cardInactive: 'border-[#1E3A8A] bg-[#0B132B] text-[#E0F2FE] hover:bg-[#151D35]',
      colorSwatchBtnActive: 'ring-2 ring-[#00B4D8] scale-105 z-10 shadow-[0_0_8px_#00B4D8]',
      customColorBlock: 'bg-[#0B132B] border border-[#1E3A8A]',
      customColorPickBtn: 'bg-[#1C2541] border border-[#00B4D8] text-[#00B4D8] hover:bg-[#3A506B]',
      inputHex: 'bg-[#0B132B] border border-[#1E3A8A] text-[#00B4D8] [color-scheme:dark]',
      headerBox: 'border border-[#1E3A8A] bg-[#0B132B]',
      badgeClass: 'border border-[#1E3A8A] bg-[#1C2541] text-[#00B4D8]',
      sliderTrack: 'bg-[#0B132B] border border-[#1E3A8A] accent-[#00B4D8]',
      previewOuter: 'bg-[#0B132B] p-2 border border-[#1E3A8A]',
      previewInner: 'bg-[#1C2541]',
      fillShapesCard: 'bg-[#0B132B] border border-[#1E3A8A]',
      toggleOuter: 'border border-[#00B4D8]',
      toggleInnerActive: 'bg-[#00B4D8]',
      toggleDotActive: 'translate-x-5 bg-white',
      toggleDotInactive: 'translate-x-0 bg-[#00B4D8]',
    },
    cyberpunk: {
      panel: 'bg-[#161824] border-[#FACC15]',
      header: 'border-[#FACC15] bg-[#0D0E15] text-[#FACC15]',
      logo: 'border-[#FACC15] bg-black text-[#FACC15] shadow-[0_0_8px_rgba(250,204,21,0.5)]',
      tabsBar: 'border-[#FACC15] bg-[#0D0E15]',
      tabsBtnActive: 'bg-[#FACC15] text-black',
      tabsBtnInactive: 'text-[#FACC15] opacity-60 hover:opacity-100 hover:bg-[#1E2132]',
      scrollBg: 'bg-[#161824]',
      label: 'text-[#FACC15]',
      cardActive: 'border-[#FACC15] bg-[#1E2132] text-[#FACC15] font-bold shadow-[2px_2px_0px_0px_#FACC15]',
      cardInactive: 'border-[#FACC15] bg-black text-[#FACC15] opacity-80 hover:opacity-100 hover:bg-[#11131C]',
      colorSwatchBtnActive: 'border-2 border-white scale-105 z-10 shadow-[0_0_10px_#FACC15]',
      customColorBlock: 'bg-black border border-[#FACC15]',
      customColorPickBtn: 'bg-[#161824] border border-[#FACC15] text-[#FACC15] hover:bg-black',
      inputHex: 'bg-black border border-[#FACC15] text-[#FACC15] [color-scheme:dark]',
      headerBox: 'border border-[#FACC15] bg-black',
      badgeClass: 'border border-[#FACC15] bg-[#161824] text-[#FACC15]',
      sliderTrack: 'bg-black border border-[#FACC15] accent-[#FACC15]',
      previewOuter: 'bg-black p-2 border border-[#FACC15]',
      previewInner: 'bg-[#161824]',
      fillShapesCard: 'bg-black border border-[#FACC15]',
      toggleOuter: 'border-2 border-[#FACC15]',
      toggleInnerActive: 'bg-[#FACC15]',
      toggleDotActive: 'translate-x-5 bg-black',
      toggleDotInactive: 'translate-x-0 bg-[#FACC15]',
    }
  };

  const style = themeClasses[uiTheme] || themeClasses.retro;

  const tools: { id: DrawingTool; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'pen', label: 'Marker Pen', icon: <PenTool size={16} />, desc: 'Smooth crisp strokes with full opacity' },
    { id: 'pencil', label: 'Sketch Pencil', icon: <FileEdit size={16} />, desc: 'Fine, textured semi-transparent lines' },
    { id: 'highlighter', label: 'Highlighter', icon: <Paintbrush size={16} />, desc: 'Thick, translucent focus overlays' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser size={16} />, desc: 'Clean paths and restore transparencies' },
    { id: 'line', label: 'Straight Line', icon: <TrendingUp size={16} />, desc: 'Perfect straight joins' },
    { id: 'rectangle', label: 'Rectangle', icon: <Square size={16} />, desc: 'Sharp boxes, optionally filled' },
    { id: 'circle', label: 'Circle', icon: <Circle size={16} />, desc: 'Smooth circles based on center locks' },
    { id: 'arrow', label: 'Arrow Pointer', icon: <ArrowUpRight size={16} />, desc: 'Indicator lines with arrowhead tips' },
  ];

  const bgStyles: { id: CanvasBgType; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'white', label: 'Plain White', icon: <Sun size={16} className="text-amber-500" />, desc: 'Standard high-contrast studio canvas' },
    { id: 'cream', label: 'Warm Cream', icon: <Notebook size={16} className="text-yellow-600" />, desc: 'Subtle eye-comfort workspace tone' },
    { id: 'dark', label: 'Studio Dark', icon: <Moon size={16} className="text-indigo-400" />, desc: 'Charcoal backing, excellent for neon lights' },
    { id: 'grid', label: 'Blueprint Grid', icon: <LayoutGrid size={16} className="text-blue-500" />, desc: 'Standard architectural math lining' },
    { id: 'dots', label: 'Precision Dots', icon: <Circle size={16} className="text-teal-500 scale-75" />, desc: 'Dot grid guidelines for sketch notes' },
    { id: 'ruled', label: 'Ruled Notebook', icon: <Notebook size={16} className="text-indigo-500" />, desc: 'Lined paper for handwriting exercises' },
  ];

  const handleToolSelect = (toolId: DrawingTool) => {
    setBrushSettings(prev => {
      // Intelligently adapt sizes/opacity when swapping patterns in real-time
      let nextSize = prev.size;
      let nextOpacity = prev.opacity;

      if (toolId === 'highlighter') {
        nextSize = Math.max(prev.size, 32); // Default highlighter thick
        nextOpacity = 0.5;
      } else if (toolId === 'eraser') {
        nextSize = Math.max(prev.size, 24); // Erasers feel better thicker
      } else if (toolId === 'pencil') {
        nextSize = Math.min(prev.size, 4);  // Pencil is thin
        nextOpacity = 0.8;
      }

      return {
        ...prev,
        tool: toolId,
        size: nextSize,
        opacity: nextOpacity
      };
    });
  };

  const selectColor = (color: string) => {
    setBrushSettings(prev => ({ ...prev, color }));
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    selectColor(val);
  };

  return (
    <div id="workspace_control_panel" className={`w-full lg:w-96 ${style.panel} border-b lg:border-b-0 lg:border-r flex flex-col h-full min-h-0 select-none transition-colors duration-300`}>
      
      {/* Sidebar Header branding */}
      <div id="sidebar_logo_area" className={`p-6 border-b ${style.header} flex items-center gap-3 transition-colors duration-300`}>
        <div className={`w-10 h-10 border-2 ${style.logo} flex items-center justify-center transition-all`}>
          <Paintbrush size={18} />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider font-mono">Drawing Pad</h1>
          <p className="text-[10px] opacity-70 font-mono">PRECISION SKETCHPAD</p>
        </div>
      </div>
 
      {/* Tabs navigation */}
      <div id="tab_navigation_bar" className={`flex border-b ${style.tabsBar} font-mono transition-colors duration-300`}>
        <button
          id="btn_tab_brush"
          onClick={() => setActiveTab('brush')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${activeTab === 'brush' ? style.tabsBtnActive : style.tabsBtnInactive}`}
        >
          Brush Set
        </button>
        <button
          id="btn_tab_canvas"
          onClick={() => setActiveTab('canvas')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold border-l border-r ${style.tabsBar} transition-all cursor-pointer ${activeTab === 'canvas' ? style.tabsBtnActive : style.tabsBtnInactive}`}
        >
          Paper Style
        </button>
        <button
          id="btn_tab_drafts"
          onClick={() => setActiveTab('drafts')}
          className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold relative transition-all cursor-pointer ${activeTab === 'drafts' ? style.tabsBtnActive : style.tabsBtnInactive}`}
        >
          Drafts
          {drafts.length > 0 && (
            <span className="absolute right-2 top-2.5 bg-red-600 text-white font-mono text-[8px] px-1 py-0.5 rounded-none border border-white">
              {drafts.length}
            </span>
          )}
        </button>
      </div>
 
      {/* Content panes list scrolling container */}
      <div id="sidebar_scrolling_content" className={`flex-1 overflow-y-auto p-5 space-y-6 ${style.scrollBg} transition-colors duration-300`}>
        
        <AnimatePresence mode="wait">
          
          {/* BRUSH TOOL PROPERTIES TAB */}
          {activeTab === 'brush' && (
            <motion.div
              id="pane_brush_tools"
              key="brush-pane"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="space-y-6"
            >
              {/* Tool options grid */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono block opacity-80">SELECT TOOL</span>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map((t) => (
                    <button
                      id={`tool_select_${t.id}`}
                      key={t.id}
                      onClick={() => handleToolSelect(t.id)}
                      className={`flex flex-col items-start p-3 h-20 rounded-none text-left border-2 transition-all relative overflow-hidden group cursor-pointer ${
                        brushSettings.tool === t.id 
                          ? style.cardActive 
                          : style.cardInactive
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {t.icon}
                        <span className="text-[11px] font-bold uppercase tracking-tight font-mono">{t.label}</span>
                      </div>
                      <span className="text-[9px] opacity-70 leading-normal line-clamp-2 font-mono">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
 
              {/* Color swatch selector */}
              {brushSettings.tool !== 'eraser' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">BRUSH COLOR</span>
                    <span className="text-[11px] font-mono font-bold opacity-90">{brushSettings.color.toUpperCase()}</span>
                  </div>
 
                  {/* Curated Grid */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {presetColors.map((color, index) => (
                      <button
                        id={`swatch_color_${index}`}
                        key={color}
                        onClick={() => selectColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-full h-8 rounded-none border-2 border-slate-900/10 relative transition-transform cursor-pointer ${
                          brushSettings.color.toLowerCase() === color.toLowerCase()
                            ? style.colorSwatchBtnActive
                            : 'hover:scale-105'
                        }`}
                        title={color}
                      >
                        {color === '#FFFFFF' && (
                          <div className="absolute inset-0 bg-neutral-100 pointer-events-none opacity-30" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom color widget */}
                  <div className={`flex items-center gap-2 p-2 ${style.customColorBlock}`}>
                    <label className={`shrink-0 flex items-center gap-1.5 cursor-pointer ${style.customColorPickBtn} px-2.5 py-1 border transition-colors`}>
                      <input 
                        id="picker_custom_color"
                        type="color" 
                        value={customColor} 
                        onChange={handleCustomColorChange}
                        className="w-4 h-4 border-0 cursor-pointer p-0" 
                      />
                      <span className="text-[10px] uppercase font-bold font-mono">Pick Color</span>
                    </label>
                    <input 
                      id="input_hex_value"
                      type="text" 
                      maxLength={7}
                      value={brushSettings.color}
                      onChange={(e) => {
                        if (e.target.value.length === 7 && e.target.value.startsWith('#')) {
                          selectColor(e.target.value);
                         }
                      }}
                      className={`flex-1 ${style.inputHex} px-2 py-1 text-[11px] font-mono text-center focus:outline-none`}
                    />
                  </div>
                </div>
              )}

              {/* Size metrics controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">BRUSH THICKNESS</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 border ${style.badgeClass} font-mono`}>{brushSettings.size}px</span>
                </div>
                
                <div className="space-y-1.5 font-mono">
                  <input
                    id="slider_brush_size"
                    type="range"
                    min="1"
                    max="100"
                    value={brushSettings.size}
                    onChange={(e) => setBrushSettings(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                    className={`w-full h-1 rounded-none appearance-none cursor-pointer ${style.sliderTrack}`}
                  />
                  <div className="flex items-center justify-between text-[8px] opacity-70">
                    <span>1PX (FINE)</span>
                    <span>50PX</span>
                    <span>100PX (THICK)</span>
                  </div>
                </div>

                {/* Circle tip dynamic mock preview */}
                <div className={`flex items-center gap-4 p-2.5 ${style.previewOuter}`}>
                  <span className="text-[10px] font-bold font-mono uppercase">PREVIEW:</span>
                  <div className={`flex-1 flex items-center justify-center h-12 border ${style.previewInner} relative overflow-hidden`}>
                    <div 
                      id="graphic_brush_preview_tip"
                      style={{
                        width: `${brushSettings.size}px`,
                        height: `${brushSettings.size}px`,
                        backgroundColor: brushSettings.tool === 'eraser' ? 'transparent' : brushSettings.color,
                        borderColor: uiTheme === 'cyberpunk' ? '#FACC15' : uiTheme === 'blueprint' ? '#00B4D8' : '#141414',
                        borderStyle: brushSettings.tool === 'eraser' ? 'dashed' : 'solid',
                        borderWidth: brushSettings.tool === 'eraser' ? '2px' : '0px',
                        opacity: brushSettings.tool === 'pencil' ? 0.6 : brushSettings.tool === 'highlighter' ? 0.40 : brushSettings.opacity
                      }}
                      className="rounded-full shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Opacity slider */}
              {brushSettings.tool !== 'eraser' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">VISUAL OPACITY</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 border ${style.badgeClass} font-mono`}>{Math.round(brushSettings.opacity * 100)}%</span>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <input
                      id="slider_brush_opacity"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={brushSettings.opacity}
                      onChange={(e) => setBrushSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className={`w-full h-1 rounded-none appearance-none cursor-pointer ${style.sliderTrack}`}
                    />
                    <div className="flex items-center justify-between text-[8px] opacity-70">
                      <span>10% (SHEER)</span>
                      <span>50%</span>
                      <span>100% (SOLID)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fill capability for shapes */}
              {['rectangle', 'circle'].includes(brushSettings.tool) && (
                <div className={`flex items-center justify-between p-3.5 ${style.fillShapesCard}`}>
                  <div>
                    <h4 className="text-xs font-bold uppercase font-mono">Fill Shapes</h4>
                    <p className="text-[9px] opacity-70 leading-normal font-mono">Paints the interior layout grid</p>
                  </div>
                  <button
                    id="btn_toggle_fill_shapes"
                    onClick={() => setBrushSettings(prev => ({ ...prev, fillShapes: !prev.fillShapes }))}
                    className={`w-11 h-6 rounded-none p-0.5 border-2 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      brushSettings.fillShapes ? style.toggleInnerActive : 'bg-transparent'
                    } ${style.toggleOuter}`}
                  >
                    <div className={`w-4 h-4 rounded-none border transform transition-all duration-200 ${
                      brushSettings.fillShapes ? style.toggleDotActive : style.toggleDotInactive
                    }`} />
                  </button>
                </div>
              )}

            </motion.div>
          )}


          {/* CANVAS STYLING PAPER OPTIONS TAB */}
          {activeTab === 'canvas' && (
            <motion.div
              id="pane_paper_styles"
              key="canvas-pane"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="space-y-4"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono block opacity-80">CANVAS BACKGROUND</span>
              <div className="space-y-2">
                {bgStyles.map((b) => (
                  <button
                    id={`bg_select_card_${b.id}`}
                    key={b.id}
                    onClick={() => setBackgroundType(b.id)}
                    className={`w-full flex items-center gap-4 p-3 border-2 text-left transition-all cursor-pointer ${
                      backgroundType === b.id 
                        ? style.cardActive 
                        : style.cardInactive
                    }`}
                  >
                    <div className="p-2 border border-slate-900/15 bg-white text-black">
                      {b.icon}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase font-mono">{b.label}</h4>
                      <p className="text-[9px] opacity-70 leading-tight font-mono">{b.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}


          {/* DRAFTS LIST STORAGE MANAGER */}
          {activeTab === 'drafts' && (
            <motion.div
              id="pane_local_drafts"
              key="drafts-pane"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#141414] uppercase tracking-wider font-mono block opacity-80">CAPTURED DRAFTS ({drafts.length})</span>
                {drafts.length > 0 && (
                  <button 
                    id="btn_nuke_drafts"
                    onClick={() => {
                      if (window.confirm("Delete all captured drafts?")) {
                        onClearDrafts();
                      }
                    }}
                    className="text-[10px] text-red-600 font-bold hover:underline font-mono uppercase cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {drafts.length === 0 ? (
                <div className={`text-center py-10 bg-transparent border-2 border-dashed ${['dark', 'cyberpunk', 'blueprint'].includes(uiTheme) ? 'border-neutral-700' : 'border-neutral-300'} p-5 font-mono`}>
                  <FolderOpen size={24} className="mx-auto mb-2 opacity-80" />
                  <h4 className="text-xs font-bold uppercase mb-1">No drafts stored</h4>
                  <p className="text-[9px] opacity-70 leading-normal max-w-[200px] mx-auto">
                    Click the "Capture Draft" button on the top actions bar to save progress to local state.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {drafts.map((draft) => (
                    <div 
                      id={`draft_item_card_${draft.id}`}
                      key={draft.id} 
                      className={`p-2.5 border-2 flex items-center gap-3 text-left font-mono ${style.cardActive}`}
                    >
                      {/* Base64 Preview image */}
                      <div className="w-12 h-12 border border-neutral-300 bg-white overflow-hidden shrink-0">
                        <img 
                          src={draft.previewUrl} 
                          referrerPolicy="no-referrer"
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold truncate leading-snug">{draft.name}</h4>
                        <div className="flex items-center gap-1 text-[8px] opacity-60">
                          <Clock size={8} />
                          <span>{new Date(draft.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span>{draft.width}x{draft.height}</span>
                        </div>
                      </div>

                      {/* Controls overlay */}
                      <div className="flex items-center gap-1">
                        <button
                          id={`btn_load_draft_${draft.id}`}
                          onClick={() => onLoadDraft(draft)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-all ${
                            uiTheme === 'cyberpunk' ? 'bg-[#FACC15] text-black hover:bg-[#E2B70B]' :
                            uiTheme === 'blueprint' ? 'bg-[#00B4D8] text-black hover:bg-[#00A2C2]' :
                            uiTheme === 'dark' ? 'bg-white text-black hover:bg-zinc-200' :
                            'bg-[#141414] text-white hover:bg-opacity-80'
                          }`}
                          title="Restore this draft onto the canvas surface"
                        >
                          Load
                        </button>
                        <button
                          id={`btn_del_draft_${draft.id}`}
                          onClick={() => onDeleteDraft(draft.id)}
                          className={`p-1 transition-colors cursor-pointer border border-transparent rounded hover:bg-red-500/10 ${uiTheme === 'cyberpunk' ? 'text-red-500' : 'text-inherit'}`}
                          title="Delete draft file permanently"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sidebar Footer detailing instructions */}
      <div id="sidebar_instructions_footer" className={`p-5 border-t ${style.header} text-[9px] leading-relaxed font-mono space-y-1 transition-colors duration-300`}>
        <p>💡 <strong>PRO-TIP:</strong> Set active tool to Straight Line or Arrow to highlight architectural bounds or tracer blueprints with precision scaling alignment.</p>
      </div>
    </div>
  );
}
