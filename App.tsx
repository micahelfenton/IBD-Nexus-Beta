import React, { useState, useEffect, useRef } from 'react';
import NewEntryScreen from './components/VoiceInputScreen';
import SummaryScreen from './components/SummaryScreen';
import DashboardScreen from './components/DashboardScreen';
import JournalView from './components/JournalView';
import DietScreen from './components/DietScreen';
import TrendAnalysisScreen from './components/TrendAnalysisScreen';
import { AppScreen, NewEntryState, JournalEntry, JournalSummary, ImageAnalysisResult, UserDietaryProfile, MenuAnalysisResult, MenuItemAnalysis } from './types';
import { generateSummary, analyzeStoolImage, analyzeMenu } from './services/geminiService';
import { DashboardIcon, JournalIcon, PlusIcon, ArrowLeftIcon, XIcon } from './components/icons';
import { sampleJournalEntries } from './sampleData'; // Using sample data

// --- AI Menu Scanner Component ---
interface MenuScannerScreenProps {
  userProfile: UserDietaryProfile;
  onBack: () => void;
}

const MenuScannerScreen: React.FC<MenuScannerScreenProps> = ({ userProfile, onBack }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<MenuItemAnalysis | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        streamRef.current = stream;
                    }
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
    }, []);

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
            setError("Failed to analyze the menu. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleScanAgain = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setError(null);
        setSelectedItem(null);
    };

    const riskColorClasses = {
        safe: 'border-green-400',
        caution: 'border-yellow-400',
        avoid: 'border-red-500',
    };
    
    const riskHighlightClasses = {
        safe: 'border-green-400 glow-green',
        caution: 'border-yellow-400 glow-yellow',
        avoid: 'border-red-500 glow-red',
    };


    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <header className="relative flex items-center justify-between p-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors z-10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold absolute left-1/2 -translate-x-1/2">AI Menu Scanner</h1>
            </header>

            <main className="flex-grow relative overflow-hidden">
                {!capturedImage ? (
                    <div className="w-full h-full relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
                            <p className="text-center text-sm mb-4">Position the menu in the frame and hold steady.</p>
                            <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-slate-400">
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-900"></div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full relative">
                        <img ref={imageRef} src={capturedImage} alt="Scanned menu" className="w-full h-full object-contain" />
                        {analysisResult && imageRef.current && analysisResult.items.map((item, index) => {
                            const imgWidth = imageRef.current!.clientWidth;
                            const imgHeight = imageRef.current!.clientHeight;
                            const isSelected = selectedItem?.itemName === item.itemName && selectedItem?.boundingBox === item.boundingBox;

                            return (
                                <button
                                    key={index}
                                    className={`absolute border-2 rounded-md transition-all duration-300 ease-in-out ${riskHighlightClasses[item.risk]} ${isSelected ? 'bg-white/20' : 'bg-transparent hover:bg-white/10'}`}
                                    style={{
                                        left: `${item.boundingBox.x * imgWidth}px`,
                                        top: `${item.boundingBox.y * imgHeight}px`,
                                        width: `${item.boundingBox.width * imgWidth}px`,
                                        height: `${item.boundingBox.height * imgHeight}px`,
                                    }}
                                    onClick={() => setSelectedItem(item)}
                                />
                            );
                        })}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
                                <p className="mt-4 text-lg">Analyzing Menu...</p>
                            </div>
                        )}
                         {error && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-4">
                               <p className="text-red-400">{error}</p>
                               <button onClick={handleScanAgain} className="mt-4 px-4 py-2 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400">Scan Again</button>
                            </div>
                        )}
                    </div>
                )}
                 {selectedItem && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-20" onClick={() => setSelectedItem(null)}>
                        <div className={`bg-slate-800 rounded-xl p-6 w-full max-w-sm border-t-4 ${riskColorClasses[selectedItem.risk]}`} onClick={(e) => e.stopPropagation()}>
                           <h2 className="text-xl font-bold capitalize">{selectedItem.itemName}</h2>
                           <p className={`text-sm font-bold uppercase mb-3 ${riskColorClasses[selectedItem.risk].replace('border-green-400', 'text-green-400').replace('border-yellow-400', 'text-yellow-400').replace('border-red-500', 'text-red-400')}`}>{selectedItem.risk}</p>
                           <p className="text-slate-300 mb-2"><span className="font-semibold text-slate-400">Reason:</span> {selectedItem.reason}</p>
                           {selectedItem.suggestion && <p className="text-cyan-300"><span className="font-semibold text-cyan-400">Suggestion:</span> {selectedItem.suggestion}</p>}
                           <button onClick={() => setSelectedItem(null)} className="mt-4 w-full text-center py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">Close</button>
                        </div>
                    </div>
                )}
            </main>
            
            {capturedImage && !isLoading && (
                 <div className="p-4 flex-shrink-0">
                    <button onClick={handleScanAgain} className="w-full py-3 bg-cyan-500 rounded-lg text-lg font-semibold hover:bg-cyan-400 transition-colors">
                        Scan Again
                    </button>
                 </div>
            )}

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
                    />;
        case AppScreen.JOURNAL_VIEW:
            return <JournalView journalEntries={journalEntries} onAttachImage={handleAttachImageToEntry} />;
        case AppScreen.DIET:
            return <DietScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.TREND_ANALYSIS:
            return <TrendAnalysisScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.MENU_SCANNER:
            return <MenuScannerScreen userProfile={MOCK_USER_DIET_PROFILE} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        default:
            return <DashboardScreen 
                        journalEntries={journalEntries} 
                        onNavigateToDiet={() => setActiveScreen(AppScreen.DIET)}
                        onNavigateToTrendAnalysis={() => setActiveScreen(AppScreen.TREND_ANALYSIS)}
                        onNavigateToMenuScanner={() => setActiveScreen(AppScreen.MENU_SCANNER)}
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