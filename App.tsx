import React, { useState, useEffect } from 'react';
import NewEntryScreen from './components/VoiceInputScreen';
import SummaryScreen from './components/SummaryScreen';
import DashboardScreen from './components/DashboardScreen';
import JournalView from './components/JournalView';
import DietScreen from './components/DietScreen';
import TrendAnalysisScreen from './components/TrendAnalysisScreen';
import { AppScreen, NewEntryState, JournalEntry, JournalSummary, ImageAnalysisResult } from './types';
import { generateSummary, analyzeStoolImage } from './services/geminiService';
import { DashboardIcon, JournalIcon, PlusIcon } from './components/icons';
import { sampleJournalEntries } from './sampleData'; // Using sample data

const ProcessingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
        <h2 className="mt-8 text-2xl font-semibold text-slate-300">Analyzing your entry...</h2>
        <p className="text-slate-400">This will just take a moment.</p>
    </div>
);

const JOURNAL_STORAGE_KEY = 'IBD_NEXUS_JOURNAL_ENTRIES';

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
                    />;
        case AppScreen.JOURNAL_VIEW:
            return <JournalView journalEntries={journalEntries} onAttachImage={handleAttachImageToEntry} />;
        case AppScreen.DIET:
            return <DietScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        case AppScreen.TREND_ANALYSIS:
            return <TrendAnalysisScreen journalEntries={journalEntries} onBack={() => setActiveScreen(AppScreen.DASHBOARD)} />;
        default:
            return <DashboardScreen 
                        journalEntries={journalEntries} 
                        onNavigateToDiet={() => setActiveScreen(AppScreen.DIET)}
                        onNavigateToTrendAnalysis={() => setActiveScreen(AppScreen.TREND_ANALYSIS)}
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