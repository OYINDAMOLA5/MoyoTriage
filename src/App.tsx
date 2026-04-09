import { GoogleGenAI, Type } from '@google/genai';
import { AlertTriangle, Activity, Stethoscope, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

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
          systemInstruction: `You are an expert medical triage assistant designed to support Community Health Volunteers (CHVs) in rural West Africa. 
Your job is to analyze the raw symptoms provided by the CHV, assess the urgency, and provide a structured assessment.

Consider the context: resources are limited, and rapid identification of severe conditions like acute malaria, pneumonia, or malnutrition is critical.

You must ALWAYS output your response in valid JSON format using the following structure:
{
  "triage_level": "RED (Immediate Transport), YELLOW (Monitor & Treat Locally), or GREEN (Routine Care)",
  "primary_concern": "The most likely critical condition based on the symptoms",
  "recommended_action": "Clear, step-by-step instructions for the CHV",
  "outbreak_flag": boolean (Set to true if symptoms suggest a highly contagious local outbreak like Cholera or Lassa Fever)
}`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              triage_level: {
                type: Type.STRING,
                description: 'RED (Immediate Transport), YELLOW (Monitor & Treat Locally), or GREEN (Routine Care)',
              },
              primary_concern: {
                type: Type.STRING,
                description: 'The most likely critical condition based on the symptoms',
              },
              recommended_action: {
                type: Type.STRING,
                description: 'Clear, step-by-step instructions for the CHV',
              },
              outbreak_flag: {
                type: Type.BOOLEAN,
                description: 'Set to true if symptoms suggest a highly contagious local outbreak like Cholera or Lassa Fever',
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
    if (level.includes('RED')) return 'bg-red-50 border-red-500 text-red-900';
    if (level.includes('YELLOW')) return 'bg-yellow-50 border-yellow-500 text-yellow-900';
    if (level.includes('GREEN')) return 'bg-green-50 border-green-500 text-green-900';
    return 'bg-gray-50 border-gray-500 text-gray-900';
  };

  const getTriageBadgeColor = (level: string) => {
    if (level.includes('RED')) return 'bg-red-500 text-white';
    if (level.includes('YELLOW')) return 'bg-yellow-500 text-white';
    if (level.includes('GREEN')) return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-900 p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">MoyoTriage</h1>
          </div>
          <p className="text-blue-100 text-sm font-medium">
            Diagnostic Hub for Community Health Volunteers
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <label htmlFor="symptoms" className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Patient Symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-gray-50 text-gray-800 placeholder:text-gray-400"
              rows={5}
              placeholder="Enter patient symptoms here (e.g., 'Child is 3 years old, high fever, breathing fast, refusing to eat')"
              disabled={isAnalyzing}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={analyzeSymptoms}
            disabled={isAnalyzing || !symptoms.trim()}
            className="w-full bg-blue-600 text-white font-medium py-3.5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Data...
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
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">
                Assessment Result
              </h2>
              
              <div className={`p-5 rounded-xl border-l-4 ${getTriageColor(result.triage_level)} shadow-sm`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-2 ${getTriageBadgeColor(result.triage_level)}`}>
                      {result.triage_level.split(' ')[0]}
                    </span>
                    <h3 className="text-xl font-bold">{result.triage_level}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-1">Primary Concern</p>
                    <p className="font-medium text-lg">{result.primary_concern}</p>
                  </div>

                  <div className="bg-white/50 p-4 rounded-lg border border-black/5">
                    <p className="text-sm font-semibold uppercase tracking-wider opacity-70 mb-2 flex items-center gap-1">
                      <ChevronRight className="w-4 h-4" /> Recommended Action
                    </p>
                    <p className="leading-relaxed">{result.recommended_action}</p>
                  </div>
                </div>
              </div>

              {result.outbreak_flag && (
                <div className="bg-red-100 text-red-800 p-4 rounded-xl border border-red-300 flex items-start gap-3 shadow-sm animate-pulse">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-sm mb-1 text-red-700">Outbreak Flag Detected</h4>
                    <p className="text-sm font-medium">The reported symptoms suggest a highly contagious local outbreak. Immediately notify district health officials and isolate symptomatic patients.</p>
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
