import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalcButton } from './components/CalcButton';
import { ButtonType, HistoryItem } from './types';
import { solveMathWithAI } from './services/geminiService';
import { 
  History, 
  Sparkles, 
  X, 
  Equal, 
  Plus, 
  Minus, 
  Percent, 
  Divide, 
  Mic,
  Loader2
} from 'lucide-react';

const App: React.FC = () => {
  const [currentInput, setCurrentInput] = useState('0');
  const [previousInput, setPreviousInput] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAI, setShowAI] = useState(false);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const displayRef = useRef<HTMLDivElement>(null);

  const EXAMPLE_PROMPTS = [
    "حل المعادلة 3س + 5 = 20",
    "كم ثانية في اليوم؟",
    "تحويل 50 درجة مئوية لفهرنهايت",
    "مساحة مثلث قاعدته 5 وارتفاعه 10",
    "15% من 1500"
  ];

  // Auto-scroll display when input grows
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = 0; 
    }
  }, [currentInput]);

  // Use useCallback to stabilize function references where possible
  const handleNumber = useCallback((num: string) => {
    setCurrentInput(prev => {
      if (prev === '0' && num !== '.') return num;
      if (num === '.' && prev.includes('.')) return prev;
      return prev + num;
    });
  }, []);

  const calculate = useCallback(() => {
    if (!operator || !previousInput) return;

    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    let result = 0;

    switch (operator) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '×': result = prev * current; break;
      case '÷': result = prev / current; break;
    }

    const resultStr = String(Math.round(result * 100000000) / 100000000);
    
    setHistory(h => [{
      expression: `${previousInput} ${operator} ${currentInput}`,
      result: resultStr,
      timestamp: Date.now()
    }, ...h]);

    setCurrentInput(resultStr);
    setPreviousInput(null);
    setOperator(null);
  }, [operator, previousInput, currentInput]);

  const handleOperator = useCallback((op: string) => {
    if (operator && previousInput && currentInput !== '0') {
      const prev = parseFloat(previousInput);
      const current = parseFloat(currentInput);
      let result = 0;
      switch (operator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '×': result = prev * current; break;
        case '÷': result = prev / current; break;
      }
      const resultStr = String(Math.round(result * 100000000) / 100000000);
      setHistory(h => [{
        expression: `${previousInput} ${operator} ${currentInput}`,
        result: resultStr,
        timestamp: Date.now()
      }, ...h]);
      setPreviousInput(resultStr);
    } else {
      setPreviousInput(currentInput);
    }
    
    setOperator(op);
    setCurrentInput('0');
  }, [operator, previousInput, currentInput]);

  const handleClear = useCallback(() => {
    setCurrentInput('0');
    setPreviousInput(null);
    setOperator(null);
  }, []);

  const handlePercent = useCallback(() => {
    setCurrentInput(prev => String(parseFloat(prev) / 100));
  }, []);

  const handleToggleSign = useCallback(() => {
    setCurrentInput(prev => String(parseFloat(prev) * -1));
  }, []);

  const handleAiSolve = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await solveMathWithAI(aiPrompt);
      setAiResult(result);
      setHistory(prev => [{
        expression: `AI: ${aiPrompt}`,
        result: result,
        timestamp: Date.now()
      }, ...prev]);
    } catch (e) {
      setAiResult("عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('عذراً، المتصفح لا يدعم الكتابة بالصوت.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const formatDisplay = (num: string) => {
    const val = parseFloat(num);
    if (isNaN(val)) return num;
    if (num.length > 10) return val.toExponential(6);
    return val.toFixed(2).replace(/\.00$/, ''); // Cleaner display: remove .00 if integer-ish
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center font-sans relative overflow-hidden sm:p-4">
      
      {/* Glow Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full h-[100dvh] sm:h-[85vh] sm:w-[400px] md:w-[420px] bg-calc-surface backdrop-blur-2xl sm:rounded-[3rem] p-5 sm:p-7 flex flex-col shadow-2xl sm:border border-white/10 relative overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-2 z-10">
          <button 
            onClick={() => setShowAI(true)}
            className="group relative p-3 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all duration-300 active:scale-95"
          >
            <Sparkles size={20} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-indigo-500/20 group-hover:ring-indigo-500/40"></span>
          </button>
          
          <h1 className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase select-none opacity-60">Smart Calc</h1>
          
          <button 
            onClick={() => setShowHistory(true)}
            className="p-3 text-gray-400 hover:text-white transition-colors duration-300 rounded-full hover:bg-white/5 active:scale-95"
          >
            <History size={20} />
          </button>
        </div>

        {/* Display Section */}
        <div className="flex-1 flex flex-col justify-end items-end mb-6 px-2 space-y-2 z-10 min-h-[120px]">
          <div className="text-indigo-300/60 text-lg min-h-[1.75rem] font-medium tracking-wide select-none transition-colors duration-300">
            {previousInput} {operator}
          </div>
          <div 
            ref={displayRef}
            className="text-6xl sm:text-7xl font-light tracking-tight break-all text-right w-full overflow-x-auto no-scrollbar whitespace-nowrap select-text tabular-nums"
            dir="ltr"
            style={{ textShadow: '0 0 30px rgba(255,255,255,0.1)' }}
          >
            {formatDisplay(currentInput)}
          </div>
        </div>

        {/* Keypad Section */}
        <div className="grid grid-cols-4 grid-rows-5 gap-3 sm:gap-4 flex-[1.5] w-full z-10 pb-safe">
          <CalcButton label="AC" type={ButtonType.Action} onClick={handleClear} className="text-rose-400 font-bold" />
          <CalcButton label="+/-" type={ButtonType.Function} onClick={handleToggleSign} />
          <CalcButton label="%" icon={<Percent size={22} />} type={ButtonType.Function} onClick={handlePercent} />
          <CalcButton label="÷" icon={<Divide size={24} />} type={ButtonType.Operator} onClick={() => handleOperator('÷')} />

          <CalcButton label="7" type={ButtonType.Number} onClick={() => handleNumber('7')} />
          <CalcButton label="8" type={ButtonType.Number} onClick={() => handleNumber('8')} />
          <CalcButton label="9" type={ButtonType.Number} onClick={() => handleNumber('9')} />
          <CalcButton label="×" icon={<X size={24} />} type={ButtonType.Operator} onClick={() => handleOperator('×')} />

          <CalcButton label="4" type={ButtonType.Number} onClick={() => handleNumber('4')} />
          <CalcButton label="5" type={ButtonType.Number} onClick={() => handleNumber('5')} />
          <CalcButton label="6" type={ButtonType.Number} onClick={() => handleNumber('6')} />
          <CalcButton label="-" icon={<Minus size={24} />} type={ButtonType.Operator} onClick={() => handleOperator('-')} />

          <CalcButton label="1" type={ButtonType.Number} onClick={() => handleNumber('1')} />
          <CalcButton label="2" type={ButtonType.Number} onClick={() => handleNumber('2')} />
          <CalcButton label="3" type={ButtonType.Number} onClick={() => handleNumber('3')} />
          <CalcButton label="+" icon={<Plus size={24} />} type={ButtonType.Operator} onClick={() => handleOperator('+')} />

          <CalcButton label="0" type={ButtonType.Number} double onClick={() => handleNumber('0')} className="pl-8 text-left" />
          <CalcButton label="." type={ButtonType.Number} onClick={() => handleNumber('.')} />
          <CalcButton label="=" icon={<Equal size={28} />} type={ButtonType.Operator} onClick={calculate} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-indigo-500/30" />
        </div>
      </div>

      {/* History Overlay */}
      {showHistory && (
        <div className="fixed sm:absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-50 p-6 flex flex-col sm:rounded-[3rem] transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">السجل</h2>
            <button 
              onClick={() => setShowHistory(false)} 
              className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar py-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <History size={48} className="opacity-20" />
                <p>لا يوجد سجل عمليات</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-indigo-300/70 text-sm mb-1 font-mono tracking-wider">{item.expression}</span>
                  <span className="text-2xl text-white font-medium tabular-nums">= {item.result}</span>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setHistory([])}
            className="mt-4 w-full py-4 bg-rose-500/10 text-rose-400 rounded-2xl font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20 active:scale-[0.98]"
          >
            مسح السجل
          </button>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAI && (
        <div className="fixed sm:absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-50 p-6 flex flex-col sm:rounded-[3rem] transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles size={24} />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">المساعد الذكي</h2>
            </div>
            <button 
              onClick={() => setShowAI(false)} 
              className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 hover:scale-110 active:scale-95 transition-all duration-300"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-5 overflow-y-auto no-scrollbar">
            <p className="text-gray-400 text-sm leading-relaxed">
              اسأل الذكاء الاصطناعي عن أي مسألة رياضية معقدة، تحويلات، أو شرح للمعادلات.
            </p>

            {/* Suggestions */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 min-h-[40px]">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setAiPrompt(prompt)}
                  className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-200 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
            
            <div className="relative shrink-0 group">
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 pb-12 text-right text-lg focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 h-32 resize-none placeholder-gray-600"
                placeholder="اكتب مسألتك هنا..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button
                onClick={handleVoiceInput}
                className={`
                  absolute bottom-3 left-3 p-2 rounded-full transition-all duration-300
                  ${isListening ? 'bg-rose-500/20 text-rose-500 scale-110 animate-pulse' : 'bg-white/5 text-gray-400 hover:bg-indigo-500/20 hover:text-indigo-400 hover:scale-110 active:scale-95'}
                `}
                title="تحدث الآن"
              >
                <Mic size={20} />
              </button>
            </div>
            
            <button
              onClick={handleAiSolve}
              disabled={aiLoading || !aiPrompt.trim()}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shrink-0
                transition-all duration-300 shadow-lg shadow-indigo-900/20
                ${aiLoading ? 'bg-white/5 cursor-wait border border-indigo-500/20' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98]'}
              `}
            >
              {aiLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-[bounce_1s_infinite]"></div>
                </div>
              ) : (
                <>
                  <Sparkles size={20} />
                  حل المسألة
                </>
              )}
            </button>

            {aiResult && (
              <div className="mt-2 bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-indigo-400 text-sm mb-2 font-bold uppercase tracking-wider">الإجابة</h3>
                <p className="text-white text-lg whitespace-pre-wrap leading-relaxed font-light" dir="auto">
                  {aiResult}
                </p>
                {(/(-?\d+(?:\.\d+)?)\s*([+\-×÷*/])\s*(-?\d+(?:\.\d+)?)/.test(aiResult) || /-?\d+(\.\d+)?/.test(aiResult)) && (
                  <button 
                    onClick={() => {
                       if (!aiResult) return;
                       const expressionRegex = /(-?\d+(?:\.\d+)?)\s*([+\-×÷*/])\s*(-?\d+(?:\.\d+)?)/;
                       const exprMatch = aiResult.match(expressionRegex);
                       if (exprMatch) {
                         const left = exprMatch[1];
                         let op = exprMatch[2];
                         const right = exprMatch[3];
                         if (op === '*') op = '×';
                         if (op === '/') op = '÷';
                         setPreviousInput(left);
                         setOperator(op);
                         setCurrentInput(right);
                         setShowAI(false);
                         setAiPrompt('');
                         return;
                       }
                       const num = aiResult.match(/-?\d+(\.\d+)?/);
                       if (num) {
                         setCurrentInput(num[0]);
                         setShowAI(false);
                         setAiPrompt('');
                       }
                    }}
                    className="mt-4 text-sm text-indigo-300/80 hover:text-indigo-300 underline decoration-indigo-500/30 hover:decoration-indigo-500 decoration-dotted transition-all hover:tracking-wide"
                  >
                    نسخ الرقم/العملية إلى الحاسبة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
