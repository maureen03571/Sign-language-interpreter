import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import StickFigure from './components/StickFigure';
import { translateToSignLanguage, AnimationFrame, JointPositions } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_JOINTS: JointPositions = {
  head: { x: 50, y: 15 },
  neck: { x: 50, y: 25 },
  lShoulder: { x: 40, y: 30 },
  lElbow: { x: 35, y: 45 },
  lWrist: { x: 35, y: 60 },
  rShoulder: { x: 60, y: 30 },
  rElbow: { x: 65, y: 45 },
  rWrist: { x: 65, y: 60 },
  spine: { x: 50, y: 65 },
  lEye: { x: 46, y: 13 },
  rEye: { x: 54, y: 13 },
  mouth: { x: 50, y: 19, width: 8, height: 2 },
  lFingers: [
    { x: 32, y: 65 },
    { x: 35, y: 68 },
    { x: 38, y: 65 },
  ],
  rFingers: [
    { x: 62, y: 65 },
    { x: 65, y: 68 },
    { x: 68, y: 65 },
  ],
};

export default function App() {
  const [text, setText] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing content...",
    "Fetching lyrics and context...",
    "Generating sign language gestures...",
    "Calculating stick figure joint positions...",
    "Refining finger articulation...",
    "Almost ready to show you the translation!"
  ];

  useEffect(() => {
    let interval: number | null = null;
    if (isTranslating) {
      interval = window.setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTranslating]);

  const [frames, setFrames] = useState<AnimationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  const handleAddLink = () => {
    if (newLink && !links.includes(newLink)) {
      setLinks([...links, newLink]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (link: string) => {
    setLinks(links.filter(l => l !== link));
  };

  const handleTranslate = async () => {
    const finalLinks = [...links];
    if (newLink && !finalLinks.includes(newLink)) {
      finalLinks.push(newLink);
      setLinks(finalLinks);
      setNewLink('');
    }

    if (!text && finalLinks.length === 0) return;
    
    setIsTranslating(true);
    setError(null);
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    
    try {
      const result = await translateToSignLanguage(text, finalLinks);
      console.log("Translation Result:", result);
      
      if (result && 'error' in result) {
        setError(result.error as string);
      } else if (result && result.frames) {
        setFrames(result.frames);
        setSummary(result.summary || '');
        setIsPlaying(true);
      } else {
        setError("Could not generate translation. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during translation.");
      console.error("Translation Exception:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      const animate = (time: number) => {
        if (time - lastFrameTime.current > 500) { // Reduced from 800 to 500 for better flow
          setCurrentFrameIndex(prev => (prev + 1) % frames.length);
          lastFrameTime.current = time;
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, frames]);

  const currentJoints = frames.length > 0 ? frames[currentFrameIndex].joints : INITIAL_JOINTS;
  const currentLabel = frames.length > 0 ? frames[currentFrameIndex].label : "Ready";

  return (
    <div className="min-h-screen bg-[#F8F5FF] text-[#1A1625] font-sans selection:bg-[#4A3B8C] selection:text-[#F8F5FF]">
      {/* Header */}
      <header className="border-b border-[#4A3B8C]/20 p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#4A3B8C] p-2 rounded-sm">
            <Languages className="text-[#F8F5FF] w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif text-[#4A3B8C]">SignAI</h1>
        </div>
        <div className="text-xs uppercase tracking-widest opacity-50 font-mono text-[#4A3B8C]">
          AI Translation Engine v1.0
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-88px)]">
        {/* Left Panel: Inputs */}
        <section className="p-8 border-r border-[#4A3B8C]/10 flex flex-col gap-8 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50 font-mono text-[#4A3B8C]">
              <ChevronRight size={14} />
              Input Content
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a sentence, phrase, or word to translate..."
              className="w-full h-40 bg-white border border-[#4A3B8C]/20 p-4 focus:outline-none focus:ring-2 focus:ring-[#9D8DF1]/30 rounded-lg resize-none text-lg shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50 font-mono text-[#4A3B8C]">
              <LinkIcon size={14} />
              Context Links (Podcasts, Songs, Articles)
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com/podcast"
                className="flex-1 bg-white border border-[#4A3B8C]/20 p-3 focus:outline-none focus:ring-2 focus:ring-[#9D8DF1]/30 rounded-lg shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
              />
              <button
                onClick={handleAddLink}
                className="bg-[#4A3B8C] text-[#F8F5FF] px-4 rounded-lg hover:bg-[#5B49AD] transition-all flex items-center justify-center shadow-md"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#4A3B8C] opacity-50">Added Links ({links.length})</span>
              {links.length > 0 && (
                <button 
                  onClick={() => setLinks([])}
                  className="text-xs text-red-400 hover:text-red-600 font-bold uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {links.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar"
                >
                  {links.map((link) => (
                    <motion.li 
                      key={link}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-3 bg-white border border-[#4A3B8C]/10 rounded-lg text-sm shadow-sm group"
                    >
                      <span className="truncate max-w-[85%] text-[#4A3B8C]">{link}</span>
                      <button 
                        onClick={() => handleRemoveLink(link)} 
                        className="text-[#4A3B8C]/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating || (!text && links.length === 0)}
            className={cn(
              "w-full py-4 text-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 rounded-xl shadow-lg",
              isTranslating || (!text && links.length === 0)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#4A3B8C] text-[#F8F5FF] hover:bg-[#5B49AD] hover:shadow-[#9D8DF1]/20 active:scale-[0.98]"
            )}
          >
            {isTranslating ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              "Translate to Sign"
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {summary && (
            <div className="mt-auto p-6 border border-[#4A3B8C]/10 bg-white/80 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50 font-mono text-[#4A3B8C]">
                <Info size={14} />
                AI Summary
              </div>
              <p className="italic font-serif leading-relaxed text-[#4A3B8C]">{summary}</p>
            </div>
          )}

          <div className="p-4 bg-[#4A3B8C]/5 rounded-xl space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B8C] opacity-40">Pro Tips</h4>
            <ul className="text-[11px] text-[#4A3B8C]/60 space-y-1 list-disc pl-4">
              <li>Add YouTube links for song translations</li>
              <li>Use descriptive text for better signs</li>
              <li>Watch the fingers for hand shapes</li>
            </ul>
          </div>
        </section>

        {/* Right Panel: Stick Figure Visualization */}
        <section className="p-8 bg-white flex flex-col items-center justify-center relative overflow-hidden">
          {/* Grid lines for aesthetic */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#4A3B8C 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <AnimatePresence>
            {isTranslating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
              >
                <div className="relative">
                  <Loader2 size={48} className="text-[#4A3B8C] animate-spin" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-[#4A3B8C]/10 rounded-full -z-10"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[#4A3B8C] font-bold uppercase tracking-widest">AI is translating</p>
                  <motion.p 
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-[#4A3B8C]/60 mt-1 min-h-[1.25rem]"
                  >
                    {loadingMessages[loadingMessageIndex]}
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative z-10 w-full flex flex-col items-center gap-8">
            <div className="w-full max-w-md aspect-square border border-[#4A3B8C]/10 p-8 bg-[#FBF9FF] rounded-3xl shadow-2xl relative overflow-hidden">
              <StickFigure joints={currentJoints} />
              
              {/* Frame Label Overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="bg-[#4A3B8C] text-[#F8F5FF] px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-tighter shadow-md">
                  {currentLabel}
                </div>
                <div className="text-[10px] font-mono opacity-30 text-right text-[#4A3B8C]">
                  FRAME {currentFrameIndex + 1} / {frames.length || 1}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  setCurrentFrameIndex(0);
                  setIsPlaying(false);
                }}
                className="p-4 rounded-full border border-[#4A3B8C]/20 text-[#4A3B8C] hover:bg-[#F3E8FF] transition-colors shadow-sm"
                title="Reset"
              >
                <RotateCcw size={20} />
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={frames.length === 0}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl",
                  frames.length === 0 
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed" 
                    : "bg-[#4A3B8C] text-[#F8F5FF] hover:bg-[#5B49AD] hover:scale-110 active:scale-95 shadow-[#9D8DF1]/30"
                )}
              >
                {isPlaying ? <Pause size={36} /> : <Play size={36} fill="currentColor" />}
              </button>

              <div className="w-12" /> {/* Spacer */}
            </div>

            {/* Progress Bar */}
            {frames.length > 0 && (
              <div className="w-full max-w-md h-1.5 bg-[#F3E8FF] rounded-full relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-[#9D8DF1]"
                  animate={{ width: `${((currentFrameIndex + 1) / frames.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="absolute bottom-8 right-8 text-[10px] font-mono uppercase tracking-[0.2em] opacity-20 [writing-mode:vertical-rl] rotate-180 text-[#4A3B8C]">
            Sign Visualization Module
          </div>
        </section>
      </main>
    </div>
  );
}
