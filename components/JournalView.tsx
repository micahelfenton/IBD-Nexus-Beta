import React, { useState, useRef } from 'react';
import { JournalEntry, ImageAnalysisResult } from '../types';
import { SymptomIcon, MoodIcon, FoodIcon, ExerciseIcon, PaperClipIcon, PhotoIcon, XIcon, FireIcon, DropletIcon } from './icons';

// Props for the main view component
interface JournalViewProps {
  journalEntries: JournalEntry[];
  onAttachImage: (entryId: string, base64Image: string) => Promise<void>;
}

// Displays the image with AI-detected bounding boxes overlaid
const AnalyzedImage: React.FC<{ imageUrl: string, analysis: ImageAnalysisResult }> = ({ imageUrl, analysis }) => {
    const { redDetections, brownDetections } = analysis;
  
    return (
      <div className="relative">
        <img src={imageUrl} alt="Journal entry" className="w-full h-auto rounded-md" />
        {redDetections.map((box, i) => (
          <div key={`red-${i}`} className="absolute border-2 border-yellow-400"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
            title="Potential area of interest (red color detected)"
          ></div>
        ))}
        {brownDetections.map((box, i) => (
          <div key={`brown-${i}`} className="absolute border-2 border-blue-400"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
            title="Normal area (brown color detected)"
          ></div>
        ))}
      </div>
    );
};

// Props for the card component
interface JournalCardProps {
    entry: JournalEntry;
    isUpdating: boolean;
    onFileSelect: (entryId: string, file: File) => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ entry, isUpdating, onFileSelect }) => {
    const { date, summary } = entry;
    const { mentalWellnessScore, flareUpRisk, physicalSymptoms, moods, foodEaten, exercise, bloodInStool, crampsSeverity } = summary;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImageVisible, setIsImageVisible] = useState(false);

    let wellnessColor = 'text-green-400';
    if (mentalWellnessScore < 4) wellnessColor = 'text-red-400';
    else if (mentalWellnessScore < 7) wellnessColor = 'text-yellow-400';

    let riskColor = 'border-green-500/50';
    if (flareUpRisk > 66) riskColor = 'border-red-500/50';
    else if (flareUpRisk > 33) riskColor = 'border-yellow-500/50';

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(entry.id, file);
        }
    };

    return (
        <div className={`bg-slate-800/50 rounded-lg p-4 border-l-4 ${riskColor} flex flex-col`}>
            <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-semibold text-slate-400">{formattedDate}</p>
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-xs text-slate-500">Wellness</p>
                        <p className={`font-bold ${wellnessColor}`}>{mentalWellnessScore}/10</p>
                    </div>
                </div>
            </div>
            <div className="text-xs text-slate-300 mb-4 line-clamp-3">
                <p>
                    {entry.transcription}
                </p>
            </div>
             {entry.imageUrl && (
                <div className="my-2">
                    {isImageVisible ? (
                        <div className="space-y-2">
                            {entry.imageAnalysis ? (
                                <AnalyzedImage imageUrl={entry.imageUrl} analysis={entry.imageAnalysis} />
                            ) : (
                                <img src={entry.imageUrl} alt="Journal entry" className="rounded-lg w-full" />
                            )}
                            <button onClick={() => setIsImageVisible(false)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                                <XIcon className="w-3 h-3" />
                                Hide Image
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsImageVisible(true)} className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-md">
                            <PhotoIcon className="w-5 h-5" />
                            <span>See Attached Image</span>
                        </button>
                    )}
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            {isUpdating ? (
                 <div className="flex items-center justify-center mt-auto pt-3">
                    <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="ml-2 text-sm text-slate-400">Analyzing...</span>
                </div>
            ) : (
                <div className="mt-auto flex items-center justify-between text-slate-500 pt-3">
                    <div className="flex items-center gap-4">
                        {physicalSymptoms?.length > 0 && <span title={physicalSymptoms.join(', ')}><SymptomIcon className="w-5 h-5" /></span>}
                        {moods?.length > 0 && <span title={moods.join(', ')}><MoodIcon className="w-5 h-5" /></span>}
                        {foodEaten?.length > 0 && <span title={foodEaten.join(', ')}><FoodIcon className="w-5 h-5" /></span>}
                        {exercise?.length > 0 && <span title={exercise.join(', ')}><ExerciseIcon className="w-5 h-5" /></span>}
                        {crampsSeverity && crampsSeverity > 3 && <span title={`Cramps: ${crampsSeverity}/10`}><FireIcon className="w-5 h-5 text-yellow-400" /></span>}
                        {bloodInStool && <span title="Blood reported"><DropletIcon className="w-5 h-5 text-red-400" /></span>}
                    </div>
                    {!entry.imageUrl && (
                        <button onClick={handleAttachClick} title="Attach photo" className="hover:text-white transition-colors">
                            <PaperClipIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const JournalView: React.FC<JournalViewProps> = ({ journalEntries, onAttachImage }) => {
    const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);

    const handleFileSelect = async (entryId: string, file: File) => {
        if (!file) return;

        setUpdatingEntryId(entryId);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result as string;
            await onAttachImage(entryId, base64Image);
            setUpdatingEntryId(null);
        };
        reader.readAsDataURL(file);
    };
    
    const sortedEntries = [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="p-4 sm:p-6 pb-24 text-white overflow-y-auto h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-300">Journal</h1>
        <p className="text-slate-400">Your past entries.</p>
      </header>

      {sortedEntries.length > 0 ? (
        <div className="space-y-4">
            {sortedEntries.map(entry => (
                <JournalCard 
                  key={entry.id} 
                  entry={entry}
                  isUpdating={updatingEntryId === entry.id}
                  onFileSelect={handleFileSelect}
                />
            ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-slate-500">You haven't saved any journal entries yet.</p>
        </div>
      )}
    </div>
  );
};

export default JournalView;
