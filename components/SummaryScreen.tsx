import React from 'react';
import { JournalSummary } from '../types';
import { SymptomIcon, MoodIcon, FoodIcon, ExerciseIcon, XIcon, BodyAnatomyIcon, ArrowLeftIcon } from './icons';

interface SummaryScreenProps {
    summaryData: JournalSummary | null;
    onSave: () => void;
    entryImage: string | null;
    setEntryImage: (image: string | null) => void;
    isSaving: boolean;
    onBack: () => void;
    onCancel: () => void;
}

const SummaryCard = ({ title, icon, items }: { title: string, icon: React.ReactNode, items: string[] | undefined }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
                {icon}
                <span className="ml-2">{title}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                    <span key={index} className="bg-slate-700 text-slate-300 text-sm font-medium px-3 py-1 rounded-full">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

const SummaryScreen: React.FC<SummaryScreenProps> = ({ summaryData, onSave, entryImage, setEntryImage, isSaving, onBack, onCancel }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    if (!summaryData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <p>No summary data available.</p>
            </div>
        );
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEntryImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const { mentalWellnessScore, physicalSymptoms, moods, foodEaten, exercise, flareUpRisk, stoolType, stoolColor, bloodInStool, crampsSeverity } = summaryData;
    
    const stoolDetails = [];
    if (stoolType && stoolType !== 'Not mentioned') stoolDetails.push(`Type: ${stoolType}`);
    if (stoolColor && stoolColor !== 'Not mentioned') stoolDetails.push(`Color: ${stoolColor}`);
    if (bloodInStool) stoolDetails.push('Blood Present');
    if (crampsSeverity && crampsSeverity > 0) stoolDetails.push(`Cramps: ${crampsSeverity}/10`);


    let wellnessColor = 'text-green-400';
    if (mentalWellnessScore < 4) wellnessColor = 'text-red-400';
    else if (mentalWellnessScore < 7) wellnessColor = 'text-yellow-400';

    let riskColor = 'text-green-400';
    if (flareUpRisk > 66) riskColor = 'text-red-400';
    else if (flareUpRisk > 33) riskColor = 'text-yellow-400';


    return (
        <div className="flex flex-col h-full p-4 sm:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-y-auto">
            <header className="relative flex items-center justify-between mb-6">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                    aria-label="Go back to edit entry"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-slate-300" />
                </button>
                <h1 className="text-3xl font-bold text-cyan-300 absolute left-1/2 -translate-x-1/2">Entry Summary</h1>
                 <button 
                    onClick={onCancel} 
                    className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                    aria-label="Cancel and exit"
                >
                    <XIcon className="w-6 h-6 text-slate-300" />
                </button>
            </header>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <h2 className="text-sm font-semibold text-slate-400 mb-1">Wellness Score</h2>
                    <p className={`text-4xl font-bold ${wellnessColor}`}>{mentalWellnessScore}<span className="text-2xl text-slate-500">/10</span></p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <h2 className="text-sm font-semibold text-slate-400 mb-1">Flare-Up Risk</h2>
                    <p className={`text-4xl font-bold ${riskColor}`}>{flareUpRisk}<span className="text-2xl text-slate-500">%</span></p>
                </div>
            </div>

            <div className="space-y-4">
                <SummaryCard title="Symptoms" icon={<SymptomIcon className="w-5 h-5" />} items={physicalSymptoms} />
                <SummaryCard title="Moods" icon={<MoodIcon className="w-5 h-5" />} items={moods} />
                <SummaryCard title="Stool Details" icon={<BodyAnatomyIcon className="w-6 h-6" />} items={stoolDetails} />
                <SummaryCard title="Food & Diet" icon={<FoodIcon className="w-5 h-5" />} items={foodEaten} />
                <SummaryCard title="Exercise" icon={<ExerciseIcon className="w-5 h-5" />} items={exercise} />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                <h2 className="text-lg font-semibold text-slate-300 mb-3">Attach Photo <span className="text-xs text-slate-500">(Optional)</span></h2>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                {entryImage ? (
                    <div className="relative group">
                        <img src={entryImage} alt="Preview" className="rounded-lg w-full max-h-48 object-contain" />
                        <button onClick={() => setEntryImage(null)} className="absolute top-2 right-2 bg-slate-900/70 rounded-full p-1 text-white hover:bg-slate-700 opacity-50 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-600 rounded-lg p-8 text-center text-slate-400 hover:bg-slate-700/50 hover:border-slate-500 transition-colors">
                        Click to upload an image
                    </button>
                )}
            </div>
            
            <div className="mt-auto pt-8 text-center">
                <button 
                    onClick={onSave} 
                    disabled={isSaving}
                    className="w-full max-w-sm px-6 py-3 bg-cyan-500 rounded-lg text-lg font-semibold hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isSaving && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSaving ? 'Analyzing & Saving...' : 'Save to Journal'}
                </button>
            </div>
        </div>
    );
};

export default SummaryScreen;