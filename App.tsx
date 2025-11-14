import React, { useState, useEffect, useRef, useMemo } from 'react';
import NewEntryScreen from './components/VoiceInputScreen';
import SummaryScreen from './components/SummaryScreen';
import DashboardScreen from './components/DashboardScreen';
import JournalView from './components/JournalView';
import DietScreen from './components/DietScreen';
import TrendAnalysisScreen from './components/TrendAnalysisScreen';
import IngredientScannerScreen from './components/IngredientScannerScreen';
import ReportGeneratorScreen from './components/ReportGeneratorScreen';
import { AppScreen, NewEntryState, JournalEntry, JournalSummary, ImageAnalysisResult, UserDietaryProfile, MenuAnalysisResult, MenuItemAnalysis } from './types';
import { generateSummary, analyzeStoolImage, analyzeMenu } from './services/geminiService';
import { DashboardIcon, JournalIcon, PlusIcon, ArrowLeftIcon, XIcon, ArrowDownIcon } from './components/icons';
import { sampleJournalEntries } from './sampleData'; // Using sample data


// --- AI Menu Scanner Component ---

interface MenuItemSectionProps {
    title: string;
    items: MenuItemAnalysis[];
    color: 'avoid' | 'caution' | 'safe';
    expanded: string | null;
    onToggle: (name: string) => void;
}

const MenuItemSection: React.FC<MenuItemSectionProps> = ({ title, items, color, expanded, onToggle }) => {
    if (items.length === 0) return null;

    const colors = {
        avoid: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
        caution: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        safe: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    };

    return (
        <div className={`${colors[color].bg} rounded-lg border ${colors[color].border}`}>
            <h2 className={`px-4 py-3 text-lg font-bold ${colors[color].text}`}>{title} ({items.length})</h2>
            <ul className="divide-y divide-slate-700/50">
                {items.map(item => (
                    <li key={item.itemName + item.boundingBox.x}>
                        <button onClick={() => onToggle(item.itemName)} className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-slate-700/20">
                            <span className="capitalize text-slate-200">{item.itemName}</span>
                            <ArrowDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${expanded === item.itemName ? 'rotate-180' : ''}`} />
                        </button>
                        {expanded === item.itemName && (
                            <div className="px-4 pb-3 text-slate-300 bg-black/20 space-y-2">
                                <p><span className="font-semibold text-slate-400">Reason:</span> {item.reason}</p>
                                {item.suggestion && <p className="text-cyan-300"><span className="font-semibold text-cyan-400">Suggestion:</span> {item.suggestion}</p>}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

interface MenuScannerScreenProps {
  userProfile: UserDietaryProfile;
  onBack: () => void;
}

const MenuScannerScreen: React.FC<MenuScannerScreenProps> = ({ userProfile, onBack }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
            const result = await analyzeMenu(image, userProfile);
            setAnalysisResult(result);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to analyze the menu. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanAgain = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setError(null);
        setExpandedItem(null);
    };

    const toggleItem = (itemName: string) => {
        setExpandedItem(prev => (prev === itemName ? null : itemName));
    };
    
    const categorizedItems = useMemo(() => {
        if (!analysisResult) return { avoid: [], caution: [], safe: [] };
        return analysisResult.items.reduce((acc, item) => {
            acc[item.risk].push(item);
            return acc;
        }, { avoid: [], caution: [], safe: [] } as Record<'avoid' | 'caution' | 'safe', MenuItemAnalysis[]>);
    }, [analysisResult]);


    const renderCameraView = () => (
        <div className="w-full h-full relative flex flex-col">
             <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                <p className="text-center text-sm mb-4">Position the menu in the frame and hold steady.</p>
                <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-slate-400" aria-label="Capture photo">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-900"></div>
                </button>
            </div>
        </div>
    );
    
    const renderResultsView = () => (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
            <img src={capturedImage!} alt="Scanned menu" className="rounded-lg w-full max-h-40 object-contain mb-4" />
             {isLoading ? (
                <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
                    <p className="mt-4 text-lg">Analyzing Menu...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                   <p className="text-red-400 max-w-sm">{error}</p>
                   <button onClick={handleScanAgain} className="mt-4 px-4 py-2 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400">Scan Again</button>
                </div>
            ) : (
                <div className="space-y-4">
                    <MenuItemSection title="Avoid" items={categorizedItems.avoid} color="avoid" expanded={expandedItem} onToggle={toggleItem} />
                    <MenuItemSection title="Caution" items={categorizedItems.caution} color="caution" expanded={expandedItem} onToggle={toggleItem} />
                    <MenuItemSection title="Safe" items={categorizedItems.safe} color="safe" expanded={expandedItem} onToggle={toggleItem} />
                    {!analysisResult?.items.length && (
                        <p className="text-center text-slate-400 pt-8">Could not detect any menu items. Try taking a clearer photo.</p>
                    )}
                </div>
            )}
            <div className="mt-auto pt-6">
                <button onClick={handleScanAgain} className="w-full py-3 bg-cyan-500 rounded-lg text-lg font-semibold hover:bg-cyan-400 transition-colors">
                    Scan New Menu
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
                <h1 className="text-2xl font-bold absolute left-1/2 -translate-x-1/2">AI Menu Scanner</h1>
            </header>

            <main className="flex-grow relative overflow-hidden -mt-16 pt-16">
                 {!capturedImage ? renderCameraView() : renderResultsView()}
            </main>

            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};
// --- End Menu Scanner ---

const ProcessingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
        <h2 className="mt-8 text-2xl font-semibold text-slate-300">Analyzing your entry...</h2>
        <p className="text-slate-400">This will just take a moment.</p>
    </div>
);

const JOURNAL_STORAGE_KEY = 'IBD_NEXUS_JOURNAL_ENTRIES';

const MOCK_USER_DIET_PROFILE: UserDietaryProfile = {
  avoidsInsolubleFiber: true,
  avoidsHighFODMAP: true,
  avoidsDairy: false,
  avoidsSpicy: true,
  avoidsFatty: false,
};

function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [newEntryState, setNewEntryState] = useState<NewEntryState>(NewEntryState.NONE);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const savedEntriesJSON = localStorage.getItem(JOURNAL_STORAGE_KEY);
      return savedEntriesJSON ? JSON.parse(savedEntriesJSON) : sampleJournalEntries;
    } catch (error) {
      console.error("Error loading journal entries from localStorage:", error);
      return sampleJournalEntries; // Fallback on error
    }
  });
  
  const [finalTranscription, setFinalTranscription] = useState<string>('');
  const [currentSummary, setCurrentSummary] = useState<JournalSummary | null>(null);
  const [entryImage, setEntryImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries));
    } catch (error) {
        console.error("Error saving journal entries to localStorage:", error);
    }
  }, [journalEntries]);

  useEffect(() => {
    if (newEntryState === NewEntryState.PROCESSING && finalTranscription) {
      const getSummary = async () => {
        const summaryData = await generateSummary(finalTranscription);
        setCurrentSummary(summaryData);
        setNewEntryState(NewEntryState.SUMMARY);
      };
      getSummary();
    }
  }, [newEntryState, finalTranscription]);

  const handleStartNewEntry = () => {
      setNewEntryState(NewEntryState.VOICE_INPUT);
  };

  const handleCancelNewEntry = () => {
    setNewEntryState(NewEntryState.NONE);
    setFinalTranscription('');
    setCurrentSummary(null);
    setEntryImage(null);
  };

  const handleReturnToInput = () => {
    setNewEntryState(NewEntryState.VOICE_INPUT);
    setCurrentSummary(null); // Summary will be regenerated
  };
  
  const handleSaveJournalEntry = async () => {
    if (finalTranscription && currentSummary) {
      setIsSaving(true);
      let analysisResult: ImageAnalysisResult | undefined = undefined;
      
      if (entryImage) {
        analysisResult = await analyzeStoolImage(entryImage);
      }

      const newEntry: JournalEntry = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        transcription: finalTranscription,
        summary: currentSummary,
        imageUrl: entryImage || undefined,
        imageAnalysis: analysisResult,
      };
      setJournalEntries(prevEntries => [...prevEntries, newEntry]);

      // Reset the flow and go to dashboard
      handleCancelNewEntry();
      setActiveScreen(AppScreen.DASHBOARD);
      setIsSaving(false);
    }
  };

  const handleAttachImageToEntry = async (entryId: string, base64Image: string) => {
    const analysisResult = await analyzeStoolImage(base64Image);

    setJournalEntries(prevEntries =>
        prevEntries.map(entry =>
            entry.id === entryId
                ? {
                    ...entry,
                    imageUrl: base64Image,
                    imageAnalysis: analysisResult,
                  }
                : entry
        )
    );
  };
  
  const handleNavigate = (screen: AppScreen) => {
    if (newEntryState !== NewEntryState.NONE) {
        handleCancelNewEntry();
    }
    setActiveScreen(screen);
  }


  const renderContent = () => {
    // The new entry flow takes precedence over the main screens
    if (newEntryState !== NewEntryState.NONE) {
        switch (newEntryState) {
            case NewEntryState.VOICE_INPUT:
                return (
                <NewEntryScreen
                    setAppState={() => setNewEntryState(NewEntryState.PROCESSING)}
                    setFinalTranscription={setFinalTranscription}
                    onCancel={handleCancelNewEntry}
                />
                );
            case NewEntryState.PROCESSING:
                return <ProcessingScreen />;
            case NewEntryState.SUMMARY:
                return (
                <SummaryScreen
                    summaryData={currentSummary}
                    onSave={handleSaveJournalEntry}
                    entryImage={entryImage}
                    setEntryImage={setEntryImage}
                    isSaving={isSaving}
                    onBack={handleReturnToInput}
                    onCancel={handleCancelNewEntry}
                />
                );
            default:
                return null;
        }
    }
    
    // Otherwise, show the active screen
    switch (activeScreen) {
        case AppScreen.DASHBOARD:
            return <DashboardScreen 
                        journalEntries={journalEntries} 
                        onNavigateToDiet={() => setActiveScreen(AppScreen.DIET)} 
                        onNavigateToTrendAnalysis={() => setActiveScreen(AppScreen.TREND_ANALYSIS)}
                        onNavigateToMenuScanner={() => setActiveScreen(AppScreen.MENU_SCANNER)}
                        onNavigateToIngredientScanner={() => setActiveScreen(AppScreen.INGREDIENT_SCANNER)}
                        onNavigateToReportGenerator={() => setActiveScreen(AppScreen.REPORT_GENERATOR)}
                    />;
        case AppScreen.JOURNAL_VIEW:
            return <JournalView journalEntries={journalEntries} onAttachImage={handleAttachImageToEntry} />;
        case AppScreen.DIET:
            return <DietScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.TREND_ANALYSIS:
            return <TrendAnalysisScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.MENU_SCANNER:
            return <MenuScannerScreen userProfile={MOCK_USER_DIET_PROFILE} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.INGREDIENT_SCANNER:
            return <IngredientScannerScreen userProfile={MOCK_USER_DIET_PROFILE} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.REPORT_GENERATOR:
            return <ReportGeneratorScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        default:
            return <DashboardScreen 
                        journalEntries={journalEntries} 
                        onNavigateToDiet={() => setActiveScreen(AppScreen.DIET)}
                        onNavigateToTrendAnalysis={() => setActiveScreen(AppScreen.TREND_ANALYSIS)}
                        onNavigateToMenuScanner={() => setActiveScreen(AppScreen.MENU_SCANNER)}
                        onNavigateToIngredientScanner={() => setActiveScreen(AppScreen.INGREDIENT_SCANNER)}
                        onNavigateToReportGenerator={() => setActiveScreen(AppScreen.REPORT_GENERATOR)}
                    />;
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
        <main className="flex-grow overflow-hidden">
            {renderContent()}
        </main>
        <nav className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 flex justify-around items-center h-20 flex-shrink-0">
            <button onClick={() => handleNavigate(AppScreen.DASHBOARD)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-24 ${activeScreen === AppScreen.DASHBOARD && newEntryState === NewEntryState.NONE ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                <DashboardIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Dashboard</span>
            </button>
            <button onClick={handleStartNewEntry} className="w-16 h-16 -mt-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors" aria-label="Add new journal entry">
                <PlusIcon className="w-8 h-8 text-white" />
            </button>
            <button onClick={() => handleNavigate(AppScreen.JOURNAL_VIEW)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-24 ${activeScreen === AppScreen.JOURNAL_VIEW && newEntryState === NewEntryState.NONE ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                <JournalIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Journal</span>
            </button>
        </nav>
    </div>
  );
}

export default App;