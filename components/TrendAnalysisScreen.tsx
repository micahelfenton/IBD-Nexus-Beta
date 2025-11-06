import React, { useState, useEffect } from 'react';
import { JournalEntry, TrendAnalysisResult, JournalSummary } from '../types';
import { generateTrendAnalysis } from '../services/geminiService';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon, FoodIcon, MoodIcon, BodyAnatomyIcon, FireIcon } from './icons';

interface TrendAnalysisScreenProps {
  journalEntries: JournalEntry[];
  onBack: () => void;
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-500"></div>
        <h2 className="mt-6 text-xl font-semibold text-slate-300">Running Analysis...</h2>
        <p className="text-slate-400">This may take a moment.</p>
    </div>
);

const ErrorDisplay = ({ onRetry }: { onRetry: () => void }) => (
    <div className="text-center">
        <p className="text-red-400">Failed to generate the analysis.</p>
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400 transition-colors">
            Try Again
        </button>
    </div>
);

const TrendCard: React.FC<{ title: string; value: number; metric: string }> = ({ title, value, metric }) => {
    // Determine the implication of the change (good, bad, or neutral)
    const isGood = (metric === 'Wellness' && value > 0) || (metric === 'Risk' && value < 0);
    const isBad = (metric === 'Wellness' && value < 0) || (metric === 'Risk' && value > 0);
    const isNeutral = value === 0;

    // Set color and text based on the implication
    const color = isGood ? 'text-green-400' : isBad ? 'text-red-400' : 'text-yellow-400';
    const text = isGood ? 'Improvement' : isBad ? (metric === 'Risk' ? 'Increase' : 'Decline') : 'Stable';

    // Set the icon based on the numerical direction of the change
    const icon = value > 0 ? <ArrowUpIcon className="w-5 h-5" /> : value < 0 ? <ArrowDownIcon className="w-5 h-5" /> : null;
    
    // Display the absolute value of the percentage change, rounded to one decimal place.
    const formattedValue = parseFloat(Math.abs(value).toFixed(1));

    return (
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <h3 className="text-sm font-semibold text-slate-400">{title}</h3>
            <div className={`my-2 text-4xl font-bold flex items-center justify-center gap-2 ${color}`}>
                {icon}
                <span>{formattedValue}%</span>
            </div>
            <p className={`text-xs font-semibold ${color}`}>{text} over 30 days</p>
        </div>
    );
};

const InsightCard: React.FC<{ title: string; icon: React.ReactNode; value: string; emptyText: string }> = ({ title, icon, value, emptyText }) => (
    <div className="bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
            {icon} {title}
        </h3>
        {value && value !== "N/A" ? (
             <span className="bg-slate-700 text-slate-200 text-base font-medium px-3 py-1.5 rounded-full capitalize">{value}</span>
        ) : (
            <p className="text-slate-500 italic text-sm">{emptyText}</p>
        )}
    </div>
);

const TrendAnalysisScreen: React.FC<TrendAnalysisScreenProps> = ({ journalEntries, onBack }) => {
  const [analysis, setAnalysis] = useState<TrendAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const runAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
          if (journalEntries.length < 2) {
              throw new Error("Not enough journal entries to perform an analysis. Please add at least two entries.");
          }
          const summaries: JournalSummary[] = journalEntries.map(entry => entry.summary);
          const result = await generateTrendAnalysis(summaries);
          setAnalysis(result);
      } catch (e: any) {
          setError(e.message || "An unexpected error occurred.");
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    runAnalysis();
  }, [journalEntries]);

  return (
    <div className="p-4 sm:p-6 pb-24 text-white overflow-y-auto h-full flex flex-col">
        <header className="mb-6 flex items-center relative flex-shrink-0">
            <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label="Go back to dashboard">
                <ArrowLeftIcon className="w-6 h-6 text-slate-300" />
            </button>
            <div className="flex-grow text-center">
                <h1 className="text-3xl font-bold text-cyan-300">Trend Analysis</h1>
                <p className="text-slate-400">AI-powered insights from your journal.</p>
            </div>
        </header>
        
        <div className="flex-grow flex items-center justify-center">
            {isLoading && <LoadingSpinner />}
            {!isLoading && error && <ErrorDisplay onRetry={runAnalysis} />}
            {!isLoading && !error && analysis && (
                <div className="w-full max-w-2xl mx-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <TrendCard title="Flare-Up Risk" value={analysis.riskTrend.changePercent} metric="Risk" />
                        <TrendCard title="Wellness Score" value={analysis.wellnessTrend.changePercent} metric="Wellness" />
                    </div>
                    
                    <h2 className="text-xl font-semibold text-slate-300 pt-4">Correlation Insights</h2>
                    <InsightCard 
                        title="High Risk Food Trigger"
                        icon={<FoodIcon className="w-5 h-5 text-yellow-400" />}
                        value={analysis.correlationInsights.highRiskFoodTrigger}
                        emptyText="No specific food trigger identified."
                    />
                    <InsightCard 
                        title="High Risk Mood Trigger"
                        icon={<MoodIcon className="w-5 h-5 text-yellow-400" />}
                        value={analysis.correlationInsights.highRiskMoodTrigger}
                        emptyText="No specific mood trigger identified."
                    />

                    <h2 className="text-xl font-semibold text-slate-300 pt-4">Stool Patterns</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4">
                             <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <BodyAnatomyIcon className="w-6 h-6 text-cyan-400" /> Most Frequent
                            </h3>
                             <span className="bg-slate-700 text-slate-200 text-base font-medium px-3 py-1.5 rounded-full capitalize">
                                {analysis.stoolPattern.mostFrequentType}
                            </span>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <FireIcon className="w-5 h-5 text-red-400" /> Blood Reported
                            </h3>
                             <p className="text-3xl font-bold text-red-400">{analysis.stoolPattern.bloodInStoolCount} <span className="text-lg text-slate-400">days</span></p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default TrendAnalysisScreen;