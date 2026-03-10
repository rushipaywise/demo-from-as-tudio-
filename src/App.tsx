import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  MessageSquare, 
  Play, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft,
  Brain, 
  Trophy,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  BookOpen,
  Zap,
  ChevronDown,
  AlertTriangle,
  Map as MapIcon
} from 'lucide-react';
import Markdown from 'react-markdown';
import Editor from '@monaco-editor/react';
import { PROBLEMS, Problem } from './constants';
import { getDSAGuidance, AIResponse } from './services/geminiService';
import { DSAVisualizer } from './components/DSAVisualizer';
import { cn } from './lib/utils';

type Stage = 'understanding' | 'reasoning' | 'coding' | 'review';

export default function App() {
  const [selectedProblem, setSelectedProblem] = useState<Problem>(PROBLEMS[0]);
  const [code, setCode] = useState(selectedProblem.starterCode);
  const [stage, setStage] = useState<Stage>('understanding');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hey! I'm your DSA Buddy. Let's master some algorithms together. I'll guide you step-by-step. Ready?" }
  ]);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [intuitionFeed, setIntuitionFeed] = useState<string[]>([]);
  const lastAnalyzedCode = useRef('');

  const [currentSimStep, setCurrentSimStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testData, setTestData] = useState<any>({ nums: [2, 7, 11, 15], target: 9 });
  const [variableTrace, setVariableTrace] = useState<Record<string, any>>({});
  const [roadmapStep, setRoadmapStep] = useState(0);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, intuitionFeed]);

  // Simulation Playback Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating && aiResponse?.simulationSteps) {
      timer = setInterval(() => {
        setCurrentSimStep(prev => {
          if (prev >= (aiResponse.simulationSteps?.length || 0) - 1) {
            setIsSimulating(false);
            return prev;
          }
          const nextStep = aiResponse.simulationSteps![prev + 1];
          if (nextStep.trace) setVariableTrace(nextStep.trace);
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isSimulating, aiResponse]);

  const analyzeCode = async (action: string, userInput?: string) => {
    if (code === lastAnalyzedCode.current && !userInput && action !== 'initial_load') return;
    
    setIsAnalyzing(true);
    if (action !== 'initial_load') lastAnalyzedCode.current = code;
    const history = userInput ? [...messages, { role: 'user' as const, content: userInput }] : messages;
    if (userInput) setMessages(history);

    try {
      const response = await getDSAGuidance(
        selectedProblem,
        code,
        action,
        stage,
        history,
        testData
      );
      setAiResponse(response);
      setStage(response.stage);
      setCurrentSimStep(0);
      setRoadmapStep(0); // Reset roadmap
      if (response.isQuotaExceeded) {
        setIsQuotaExceeded(true);
      }
      if (response.visualizationData?.trace) {
        setVariableTrace(response.visualizationData.trace);
      }
      
      if (userInput) {
        setMessages(prev => [...prev, { role: 'ai', content: response.feedback }]);
      } else {
        setIntuitionFeed(prev => [...prev.slice(-4), response.feedback]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger initial analysis on problem change
  useEffect(() => {
    setCode(selectedProblem.starterCode);
    setStage('understanding');
    setMessages([]);
    setIntuitionFeed([]);
    analyzeCode('initial_load');
  }, [selectedProblem]);

  // Ultra-Aggressive Keystroke Analysis (3s debounce to save quota)
  useEffect(() => {
    if (code === selectedProblem.starterCode || isQuotaExceeded) return;
    
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      if (code.trim().length > 5) {
        analyzeCode('live keystroke trace');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [code, isQuotaExceeded]);

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setAiResponse(null);
    setHintLevel(0);
    setIsQuotaExceeded(false); // Reset quota on problem change
  };

  const filteredProblems = PROBLEMS.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showNextHint = () => {
    if (aiResponse?.hints && hintLevel < aiResponse.hints.length) {
      setHintLevel(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar - Problem List */}
      <aside className="w-80 border-r border-white/10 flex flex-col bg-[#0f0f0f]">
        <div className="p-6 border-bottom border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">DSA Buddy</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search problems..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredProblems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleProblemSelect(problem)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all group relative overflow-hidden",
                selectedProblem.id === problem.id 
                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                  : "hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  problem.difficulty === 'Easy' ? "text-emerald-400" : 
                  problem.difficulty === 'Medium' ? "text-amber-400" : "text-rose-400"
                )}>
                  {problem.difficulty}
                </span>
                {selectedProblem.id === problem.id && (
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                )}
              </div>
              <h3 className={cn(
                "font-medium text-sm transition-colors",
                selectedProblem.id === problem.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
              )}>
                {problem.title}
              </h3>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0f0f0f]/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white leading-tight">{selectedProblem.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{selectedProblem.pattern}</span>
                {process.env.GROQ_API_KEY && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">Groq Active</span>
                )}
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/10" />

            {isQuotaExceeded && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  Static Blueprint Mode Active
                </span>
              </div>
            )}
          </div>
            
          <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <StageIndicator current={stage} />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleProblemSelect(selectedProblem)}
              className="p-2.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
              title="Reset Workspace"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => analyzeCode('running code')}
              disabled={isAnalyzing}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              Analyze Step
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Middle: Editor */}
          <div className="flex-1 flex flex-col border-r border-white/10 bg-[#0a0a0a]">
            <div className="h-10 px-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Code2 className="w-3 h-3 text-emerald-500" />
                Solution Workspace
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">javascript</span>
              </div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 20, bottom: 20 },
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            </div>
          </div>

          {/* Right: AI Mentor & Visualizer */}
          <aside className="w-[450px] flex flex-col bg-[#0f0f0f] overflow-y-auto custom-scrollbar border-l border-white/10">
            <div className="p-6 space-y-8">
              {/* Visualizer */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    ASCII State
                  </span>
                </div>
                <div className="aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <DSAVisualizer 
                    type={stage === 'understanding' ? 'constraints' : selectedProblem.visualType} 
                    data={
                      stage === 'understanding' ? { 
                        constraints: selectedProblem.constraints, 
                        edgeCases: selectedProblem.edgeCases 
                      } : (aiResponse?.visualizationData || { items: [2, 7, 11, 15], target: 9 })
                    } 
                  />
                </div>
              </div>

              {/* Live Intuition Feed */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    Intuition Feed
                  </span>
                  {isTyping && (
                    <span className="text-[10px] text-slate-500 animate-pulse">Thinking...</span>
                  )}
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 min-h-[80px] relative">
                  <AnimatePresence mode="popLayout">
                    {intuitionFeed.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <p className="text-xs text-slate-500 italic">
                          {isQuotaExceeded 
                            ? "AI quota reached. Follow the static blueprint below!" 
                            : "Start coding to see real-time insights..."}
                        </p>
                        {isQuotaExceeded && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && (
                          <div className="text-[10px] text-amber-500/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            Tip: Add an API key to the Secrets panel to restore live AI!
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={intuitionFeed.length}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-100 leading-relaxed font-medium markdown-body"
                      >
                        <Markdown>{intuitionFeed[intuitionFeed.length - 1]}</Markdown>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Variable Trace & Pattern */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Trace</span>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar">
                    {Object.entries(variableTrace).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic">None</span>
                    ) : (
                      Object.entries(variableTrace).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center border-b border-white/5 pb-1 mb-1">
                          <span className="text-[9px] font-mono text-amber-500">{key}</span>
                          <span className="text-[10px] font-mono text-slate-300 truncate max-w-[80px]">
                            {typeof val === 'object' ? 'obj' : String(val)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Pattern</span>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 h-32 overflow-y-auto custom-scrollbar">
                    {aiResponse?.patternInfo ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-white block">{aiResponse.patternInfo.name}</span>
                        <p className="text-[9px] text-slate-400 leading-tight line-clamp-4">
                          {aiResponse.patternInfo.description}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">Detecting...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progressive Hints */}
              <div className="flex flex-col gap-3 pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Progressive Hints</span>
                <div className="space-y-2">
                  {aiResponse?.hints ? (
                    aiResponse.hints.map((hint, i) => (
                      <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] text-amber-200/80 leading-relaxed italic">
                        <span className="font-bold text-amber-500 mr-2">H{i+1}:</span>
                        {hint}
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-600 italic">Hints will appear as you code...</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .markdown-body p {
          margin-bottom: 0.5rem;
        }
        .markdown-body p:last-child {
          margin-bottom: 0;
        }
        .markdown-body code {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .markdown-body pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          line-height: 1.2;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}

function StageIndicator({ current }: { current: Stage }) {
  const stages: { id: Stage; label: string; icon: any }[] = [
    { id: 'understanding', label: 'Understanding', icon: BookOpen },
    { id: 'reasoning', label: 'Reasoning', icon: Brain },
    { id: 'coding', label: 'Coding', icon: Code2 },
    { id: 'review', label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center gap-4">
      {stages.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className={cn(
            "flex items-center gap-2 transition-all",
            current === s.id ? "opacity-100 scale-105" : "opacity-30 grayscale"
          )}>
            <s.icon className={cn("w-3.5 h-3.5", current === s.id && "text-emerald-500")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", current === s.id && "text-white")}>
              {s.label}
            </span>
          </div>
          {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-white/10" />}
        </React.Fragment>
      ))}
    </div>
  );
}
