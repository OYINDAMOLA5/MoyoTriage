import { GoogleGenAI, Type } from '@google/genai';
import { AlertTriangle, Activity, Stethoscope, ChevronRight, Loader2, Mic, Sun, Moon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface TriageResult {
  triage_level: string;
  primary_concern: string;
  recommended_action: string;
  outbreak_flag: boolean;
}

export default function App() {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setSymptoms(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      setError('Please enter symptoms before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze these symptoms: ${symptoms}`,
        config: {
          systemInstruction: `You are a medical triage assistant. Analyze symptoms and output ONLY valid JSON in this exact format: {"triage_level": "RED, YELLOW, or GREEN", "primary_concern": "string", "recommended_action": "string", "outbreak_flag": boolean}.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              triage_level: {
                type: Type.STRING,
                description: 'RED, YELLOW, or GREEN',
              },
              primary_concern: {
                type: Type.STRING,
              },
              recommended_action: {
                type: Type.STRING,
              },
              outbreak_flag: {
                type: Type.BOOLEAN,
              },
            },
            required: ['triage_level', 'primary_concern', 'recommended_action', 'outbreak_flag'],
          },
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as TriageResult;
        setResult(parsedResult);
      } else {
        setError('Received an empty response from the analysis engine.');
      }
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      setError('An error occurred while analyzing the symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTriageColor = (level: string) => {
    const l = level.toUpperCase();
    if (l.includes('RED')) return 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-200';
    if (l.includes('YELLOW')) return 'bg-yellow-50 border-yellow-500 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200';
    if (l.includes('GREEN')) return 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-200';
    return 'bg-gray-50 border-gray-500 text-gray-900 dark:bg-gray-800 dark:text-gray-200';
  };

  const getTriageBadgeColor = (level: string) => {
    const l = level.toUpperCase();
    if (l.includes('RED')) return 'bg-red-500 text-white';
    if (l.includes('YELLOW')) return 'bg-yellow-500 text-white dark:bg-yellow-600';
    if (l.includes('GREEN')) return 'bg-green-500 text-white dark:bg-green-600';
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 p-4 flex justify-center items-start transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MoyoTriage</h1>
              <p className="text-blue-100 text-xs font-medium opacity-90">
                CHV Diagnostic Hub
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Input Section */}
          <div className="space-y-2 relative">
            <label htmlFor="symptoms" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Patient Symptoms
            </label>
            <div className="relative">
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-4 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                rows={4}
                placeholder="Dictate or type symptoms..."
                disabled={isAnalyzing}
              />
              <button
                onClick={toggleRecording}
                className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                }`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800/30 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={analyzeSymptoms}
            disabled={isAnalyzing || !symptoms.trim()}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Stethoscope className="w-5 h-5" />
                Analyze Symptoms
              </>
            )}
          </button>

          {/* Results Section */}
          {result && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-4 rounded-xl border-l-4 ${getTriageColor(result.triage_level)} shadow-sm`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase mb-2 ${getTriageBadgeColor(result.triage_level)}`}>
                      {result.triage_level.split(' ')[0]}
                    </span>
                    <h3 className="text-lg font-bold">{result.triage_level}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Primary Concern</p>
                    <p className="font-semibold">{result.primary_concern}</p>
                  </div>

                  <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/5">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Recommended Action
                    </p>
                    <p className="text-sm leading-relaxed">{result.recommended_action}</p>
                  </div>
                </div>
              </div>

              {result.outbreak_flag && (
                <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 p-3 rounded-xl border border-red-300 dark:border-red-800 flex items-start gap-3 shadow-sm animate-pulse">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-sm mb-0.5 text-red-700 dark:text-red-300">OUTBREAK ALERT</h4>
                    <p className="text-xs font-medium">Notify District Officials Immediately!</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
