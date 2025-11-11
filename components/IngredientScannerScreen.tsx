import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserDietaryProfile, IngredientAnalysisResult, IngredientAnalysis } from '../types';
import { analyzeIngredients } from '../services/geminiService';
import { ArrowLeftIcon, ArrowDownIcon } from './icons';

interface IngredientScannerScreenProps {
  userProfile: UserDietaryProfile;
  onBack: () => void;
}

const IngredientScannerScreen: React.FC<IngredientScannerScreenProps> = ({ userProfile, onBack }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<IngredientAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (capturedImage) return; 

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };
        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [capturedImage]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            handleAnalyze(dataUrl);
        }
    };

    const handleAnalyze = async (image: string) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeIngredients(image, userProfile);
            setAnalysisResult(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to analyze the ingredients. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleScanAgain = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setError(null);
        setExpandedIngredient(null);
    };
    
    const toggleIngredient = (ingredientName: string) => {
        setExpandedIngredient(prev => (prev === ingredientName ? null : ingredientName));
    };
    
    const categorizedIngredients = useMemo(() => {
        if (!analysisResult) return { red: [], amber: [], green: [] };
        return analysisResult.ingredients.reduce((acc, ingredient) => {
            acc[ingredient.risk].push(ingredient);
            return acc;
        }, { red: [], amber: [], green: [] } as Record<'red' | 'amber' | 'green', IngredientAnalysis[]>);
    }, [analysisResult]);


    const renderCameraView = () => (
        <div className="w-full h-full relative flex flex-col">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                <p className="text-center text-sm mb-4">Position the ingredients list in the frame.</p>
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-slate-400" aria-label="Capture photo">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-900"></div>
                </button>
            </div>
        </div>
    );

    const renderResultsView = () => (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
            <img src={capturedImage!} alt="Captured ingredients list" className="rounded-lg w-full max-h-40 object-contain mb-4" />
             {isLoading ? (
                <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
                    <p className="mt-4 text-lg">Analyzing Ingredients...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                   <p className="text-red-400 max-w-sm">{error}</p>
                   <button onClick={handleScanAgain} className="mt-4 px-4 py-2 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400">Scan Again</button>
                </div>
            ) : (
                <div className="space-y-4">
                    <IngredientSection title="Avoid" ingredients={categorizedIngredients.red} color="red" expanded={expandedIngredient} onToggle={toggleIngredient} />
                    <IngredientSection title="Caution" ingredients={categorizedIngredients.amber} color="amber" expanded={expandedIngredient} onToggle={toggleIngredient} />
                    <IngredientSection title="Safe" ingredients={categorizedIngredients.green} color="green" expanded={expandedIngredient} onToggle={toggleIngredient} />
                    {!analysisResult?.ingredients.length && (
                        <p className="text-center text-slate-400 pt-8">Could not detect any ingredients. Try taking a clearer photo.</p>
                    )}
                </div>
            )}
            <div className="mt-auto pt-6">
                <button onClick={handleScanAgain} className="w-full py-3 bg-cyan-500 rounded-lg text-lg font-semibold hover:bg-cyan-400 transition-colors">
                    Scan New Product
                </button>
            </div>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <header className="relative flex items-center justify-between p-4 flex-shrink-0 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold absolute left-1/2 -translate-x-1/2">Ingredient Scanner</h1>
            </header>

            <main className="flex-grow relative overflow-hidden -mt-16 pt-16">
                {!capturedImage ? renderCameraView() : renderResultsView()}
            </main>

            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

interface IngredientSectionProps {
    title: string;
    ingredients: IngredientAnalysis[];
    color: 'red' | 'amber' | 'green';
    expanded: string | null;
    onToggle: (name: string) => void;
}

const IngredientSection: React.FC<IngredientSectionProps> = ({ title, ingredients, color, expanded, onToggle }) => {
    if (ingredients.length === 0) return null;

    const colors = {
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
        amber: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    };

    return (
        <div className={`${colors[color].bg} rounded-lg border ${colors[color].border}`}>
            <h2 className={`px-4 py-3 text-lg font-bold ${colors[color].text}`}>{title} ({ingredients.length})</h2>
            <ul className="divide-y divide-slate-700/50">
                {ingredients.map(ing => (
                    <li key={ing.ingredientName}>
                        <button onClick={() => onToggle(ing.ingredientName)} className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-700/20">
                            <span className="capitalize text-slate-200">{ing.ingredientName}</span>
                            <ArrowDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${expanded === ing.ingredientName ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded === ing.ingredientName && (
                            <div className="px-4 pb-3 text-slate-300 bg-black/20">
                                <p>{ing.reason}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default IngredientScannerScreen;