/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrushSettings, CanvasBgType, SavedDraft, UITheme } from './types';
import DrawingCanvas from './components/DrawingCanvas';
import Toolbar from './components/Toolbar';
import { motion } from 'motion/react';
import { Paintbrush } from 'lucide-react';

export default function App() {
  // 0. UI Theme state
  const [uiTheme, setUiTheme] = useState<UITheme>('retro');

  // Load theme preference on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('drawing_pad_ui_theme');
      if (storedTheme) {
        setUiTheme(storedTheme as UITheme);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleThemeChange = (theme: UITheme) => {
    setUiTheme(theme);
    try {
      localStorage.setItem('drawing_pad_ui_theme', theme);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Core brush settings
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    tool: 'pen',
    color: '#141414', // Default minimalist clean black color
    size: 8,
    opacity: 1.0,
    fillShapes: false,
  });

  // 2. Paper background style state
  const [backgroundType, setBackgroundType] = useState<CanvasBgType>('grid');
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');

  // 3. Draft list persistent state
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loadedDraft, setLoadedDraft] = useState<SavedDraft | null>(null);

  // 4. Initial load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('drawing_pad_drafts_archive');
      if (stored) {
        setDrafts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse saved drafts archive from localStorage:', e);
    }
  }, []);

  // Save drafts list to localStorage when updating state
  const persistDrafts = (updatedDrafts: SavedDraft[]) => {
    setDrafts(updatedDrafts);
    try {
      localStorage.setItem('drawing_pad_drafts_archive', JSON.stringify(updatedDrafts));
    } catch (e) {
      console.error('Failed to persist drafts archive to localStorage:', e);
    }
  };

  // Draft triggers
  const handleSaveDraft = (canvasDataUrl: string) => {
    // Generate thumbnail smaller to minimize localStorage usage
    const tempImg = new Image();
    tempImg.referrerPolicy = "no-referrer";
    tempImg.onload = () => {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 120;
      thumbCanvas.height = 90;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(tempImg, 0, 0, 120, 90);
      }
      
      const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
      
      const timestamp = Date.now();
      const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const newDraft: SavedDraft = {
        id: `draft-${timestamp}`,
        name: `Artwork #${drafts.length + 1} (${timeStr})`,
        previewUrl: thumbUrl,
        bgType: backgroundType,
        bgColor: customBgColor,
        createdAt: timestamp,
        width: window.innerWidth > 1000 ? 1000 : 800,
        height: window.innerHeight > 800 ? 600 : 450,
        canvasDataUrl: canvasDataUrl
      };

      const nextDrafts = [newDraft, ...drafts];
      persistDrafts(nextDrafts);
    };
    tempImg.src = canvasDataUrl;
  };

  const handleDeleteDraft = (id: string) => {
    const nextDrafts = drafts.filter(d => d.id !== id);
    persistDrafts(nextDrafts);
  };

  const handleClearDrafts = () => {
    persistDrafts([]);
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setBackgroundType(draft.bgType);
    setCustomBgColor(draft.bgColor);
    setLoadedDraft(draft);
  };

  const themeStyles = {
    retro: {
      outerBg: 'bg-[#E4E3E0]',
      outerBorder: 'border-[#141414]',
      text: 'text-[#141414]',
      navBg: 'bg-white',
      navBorder: 'border-[#141414]',
      logoBg: 'bg-[#141414]',
      logoInner: 'bg-white',
      badgePulse: 'bg-red-500'
    },
    light: {
      outerBg: 'bg-[#F4F4F5]',
      outerBorder: 'border-[#B4B4B8]',
      text: 'text-[#18181B]',
      navBg: 'bg-white',
      navBorder: 'border-[#D4D4D8]',
      logoBg: 'bg-[#18181B]',
      logoInner: 'bg-white',
      badgePulse: 'bg-emerald-500'
    },
    dark: {
      outerBg: 'bg-[#09090B]',
      outerBorder: 'border-[#27272A]',
      text: 'text-[#E4E4E5]',
      navBg: 'bg-[#18181B]',
      navBorder: 'border-[#27272A]',
      logoBg: 'bg-[#E4E4E7]',
      logoInner: 'bg-[#18181B]',
      badgePulse: 'bg-yellow-500'
    },
    blueprint: {
      outerBg: 'bg-[#0B132B]',
      outerBorder: 'border-[#1E3A8A]',
      text: 'text-[#06B6D4]',
      navBg: 'bg-[#1C2541]',
      navBorder: 'border-[#1E3A8A]',
      logoBg: 'bg-[#00B4D8]',
      logoInner: 'bg-[#0B132B]',
      badgePulse: 'bg-cyan-400'
    },
    cyberpunk: {
      outerBg: 'bg-[#0D0E15]',
      outerBorder: 'border-[#FACC15]',
      text: 'text-[#FACC15]',
      navBg: 'bg-[#161824]',
      navBorder: 'border-[#FACC15]',
      logoBg: 'bg-[#FACC15]',
      logoInner: 'bg-[#0D0E15]',
      badgePulse: 'bg-[#EF4444]'
    }
  };

  const style = themeStyles[uiTheme] || themeStyles.retro;

  return (
    <div id="drawing_app_container" className={`h-screen w-screen flex flex-col ${style.outerBg} ${style.text} font-sans overflow-hidden border-8 ${style.outerBorder} transition-all duration-300`}>
      
      <nav id="studio_top_navigation" className={`h-14 flex items-center justify-between px-6 border-b ${style.navBorder} ${style.navBg} select-none shrink-0 transition-all duration-300`}>
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 ${style.logoBg} flex items-center justify-center transition-colors`}>
            <div className={`w-4 h-4 ${style.logoInner} transform rotate-45 transition-colors`}></div>
          </div>
          <span className="font-mono text-sm tracking-widest font-bold uppercase">STUDIO_PAD v2.04</span>
        </div>

        <div className="flex items-center space-x-6">
          {/* Quick UI Theme Selection row */}
          <div className={`flex items-center space-x-1 p-1 font-mono text-[10px] border ${style.navBorder} bg-neutral-400/5`}>
            <span className="hidden sm:inline uppercase tracking-wider font-bold opacity-60 mr-1.5 pl-1.5">WORKSPACE:</span>
            {(['retro', 'light', 'dark', 'blueprint', 'cyberpunk'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`px-2 py-0.5 uppercase tracking-wider cursor-pointer font-bold transition-all border ${
                  uiTheme === t
                    ? t === 'cyberpunk'
                      ? 'bg-[#FACC15] text-black border-[#FACC15]'
                      : t === 'blueprint'
                      ? 'bg-[#00B4D8] text-white border-[#00B4D8]'
                      : t === 'dark'
                      ? 'bg-zinc-100 text-[#09090B] border-zinc-100'
                      : t === 'light'
                      ? 'bg-[#18181B] text-white border-[#18181B]'
                      : 'bg-[#141414] text-white border-[#141414]'
                    : 'text-inherit opacity-60 hover:opacity-100 hover:bg-neutral-500/10 border-transparent'
                }`}
              >
                {t === 'retro' ? 'Retro' : t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : t === 'blueprint' ? 'Draft' : 'Cyber'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${style.badgePulse} animate-pulse`}></div>
            <span className="font-mono text-[10px] uppercase opacity-70 font-bold hidden sm:inline">Active Session</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Sidebar selection section */}
        <Toolbar
          uiTheme={uiTheme}
          brushSettings={brushSettings}
          setBrushSettings={setBrushSettings}
          backgroundType={backgroundType}
          setBackgroundType={setBackgroundType}
          drafts={drafts}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          onClearDrafts={handleClearDrafts}
        />

        {/* Main painting panel */}
        <DrawingCanvas
          uiTheme={uiTheme}
          brushSettings={brushSettings}
          setBrushSettings={setBrushSettings}
          backgroundType={backgroundType}
          customBgColor={customBgColor}
          onSaveDraft={handleSaveDraft}
          loadedDraft={loadedDraft}
          setLoadedDraft={setLoadedDraft}
        />
      </div>

    </div>
  );
}
