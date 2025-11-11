import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { BodyAnatomyIcon, CrystalBallIcon, ResearchIcon, DietIcon, MenuScannerIcon, IngredientScannerIcon } from './icons';

interface DashboardScreenProps {
  journalEntries: JournalEntry[];
  onNavigateToDiet: () => void;
  onNavigateToTrendAnalysis: () => void;
  onNavigateToMenuScanner: () => void;
  onNavigateToIngredientScanner: () => void;
}

interface FoodStat {
  name: string;
  goodDays: number;
  badDays: number;
  total: number;
  status: 'safe' | 'caution' | 'trigger';
}


const WellnessGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 10) * circumference;

    let colorClass = 'text-sky-400';
    if (score < 4) colorClass = 'text-red-400';
    else if (score < 7) colorClass = 'text-yellow-400';

    return (
        <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    className={`${colorClass} transition-all duration-500`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${colorClass}`}>{score.toFixed(1)}</span>
                <span className="text-xs text-slate-400">Wellness</span>
            </div>
        </div>
    );
};

const DietInsightCard: React.FC<{ journalEntries: JournalEntry[], onClick: () => void }> = ({ journalEntries, onClick }) => {
    const dietInsightPreview = useMemo(() => {
        const foodStats: Record<string, { goodDays: number; badDays: number; total: number }> = {};
        const MINIMUM_ENTRIES = 3;

        const entriesWithFood = journalEntries.filter(e => e.summary.foodEaten && e.summary.foodEaten.length > 0);
        if (entriesWithFood.length < MINIMUM_ENTRIES) return { topSafeFood: null, topTriggerFood: null, hasEnoughData: false };

        entriesWithFood.forEach(entry => {
            const isBadDay = (entry.summary.flareUpRisk ?? 0) > 50 || entry.summary.bloodInStool === true || (entry.summary.crampsSeverity ?? 0) >= 5 || entry.summary.stoolType === 'Diarrhea' || entry.summary.physicalSymptoms.some(s => /pain|cramp|bloat|nausea|diarrhea/i.test(s));
            entry.summary.foodEaten.forEach(foodItem => {
                const normalizedFood = foodItem.toLowerCase().trim();
                if (!normalizedFood) return;
                if (!foodStats[normalizedFood]) foodStats[normalizedFood] = { goodDays: 0, badDays: 0, total: 0 };
                if (isBadDay) foodStats[normalizedFood].badDays++;
                else foodStats[normalizedFood].goodDays++;
                foodStats[normalizedFood].total++;
            });
        });

        const categorizedFoods: { safe: FoodStat[], caution: FoodStat[], trigger: FoodStat[] } = { safe: [], caution: [], trigger: [] };
        const MINIMUM_OCCURRENCES = 2;

        Object.entries(foodStats).forEach(([name, stats]) => {
            if (stats.total < MINIMUM_OCCURRENCES) return;
            const goodRatio = stats.goodDays / stats.total;
            let status: 'safe' | 'caution' | 'trigger' = goodRatio >= 0.8 ? 'safe' : (goodRatio >= 0.4 ? 'caution' : 'trigger');
            categorizedFoods[status].push({ name, ...stats, status });
        });
        
        categorizedFoods.safe.sort((a,b) => b.total - a.total);
        categorizedFoods.trigger.sort((a,b) => b.total - a.total);

        return { topSafeFood: categorizedFoods.safe[0] ?? null, topTriggerFood: categorizedFoods.trigger[0] ?? null, hasEnoughData: true };
    }, [journalEntries]);

    return (
        <div onClick={onClick} className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors col-span-1 md:col-span-1">
            <h2 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <DietIcon className="w-5 h-5 text-cyan-400" />
                Dietary Insights
            </h2>
            {dietInsightPreview.hasEnoughData ? (
                 <><div className="space-y-2 text-sm">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Top Safe Food</p>
                        {dietInsightPreview.topSafeFood ? (
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded capitalize font-medium">{dietInsightPreview.topSafeFood.name}</span>
                        ) : (<p className="text-slate-400 text-xs italic">Not enough data</p>)}
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Top Potential Trigger</p>
                        {dietInsightPreview.topTriggerFood ? (
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded capitalize font-medium">{dietInsightPreview.topTriggerFood.name}</span>
                        ) : (<p className="text-slate-400 text-xs italic">No triggers found yet</p>)}
                    </div>
                </div>
                <p className="text-right text-xs text-cyan-400 mt-4 font-semibold">View Full Report &rarr;</p></>
            ) : (
                <p className="text-slate-400 text-sm">Log at least 3 entries with food details to see your top safe foods and potential triggers.</p>
            )}
        </div>
    );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ journalEntries, onNavigateToDiet, onNavigateToTrendAnalysis, onNavigateToMenuScanner, onNavigateToIngredientScanner }) => {
    const [timePeriod, setTimePeriod] = useState<'7d' | '30d'>('7d');

    const filteredEntries = useMemo(() => {
        const days = timePeriod === '7d' ? 7 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return journalEntries.filter(entry => new Date(entry.date) >= cutoffDate);
    }, [journalEntries, timePeriod]);

    const avgWellness = useMemo(() => {
        if (filteredEntries.length === 0) return 0;
        const total = filteredEntries.reduce((acc, entry) => acc + entry.summary.mentalWellnessScore, 0);
        return total / filteredEntries.length;
    }, [filteredEntries]);

    const avgRisk = useMemo(() => {
        if (filteredEntries.length === 0) return 0;
        const total = filteredEntries.reduce((acc, entry) => acc + entry.summary.flareUpRisk, 0);
        return total / filteredEntries.length;
    }, [filteredEntries]);

    const { digestiveColorClass, digestiveGlowClass, riskText } = useMemo(() => {
        if (avgRisk > 66) return { digestiveColorClass: 'text-red-400', digestiveGlowClass: 'glow-red', riskText: 'High' };
        if (avgRisk > 33) return { digestiveColorClass: 'text-yellow-400', digestiveGlowClass: 'glow-yellow', riskText: 'Moderate' };
        return { digestiveColorClass: 'text-sky-400', digestiveGlowClass: 'glow-blue', riskText: 'Low' };
    }, [avgRisk]);

    const wellnessTrend = useMemo(() => {
        if (filteredEntries.length < 2) return 0; // 0 for stable
        const sorted = [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
        const avgFirst = firstHalf.reduce((acc, e) => acc + e.summary.mentalWellnessScore, 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((acc, e) => acc + e.summary.mentalWellnessScore, 0) / (secondHalf.length || 1);
        if (avgSecond > avgFirst) return 1; // Positive trend
        if (avgSecond < avgFirst) return -1; // Negative trend
        return 0;
    }, [filteredEntries]);

    const digestiveHealthStats = useMemo(() => {
        const entriesWithPhotos = filteredEntries.filter(e => e.imageUrl && e.imageAnalysis);
        const entriesWithRedFlags = entriesWithPhotos.filter(e => e.imageAnalysis!.redDetections.length > 0);
        const entriesWithReportedBlood = filteredEntries.filter(e => e.summary.bloodInStool).length;
        const highCrampsDays = filteredEntries.filter(e => (e.summary.crampsSeverity ?? 0) >= 7).length;
        return {
            totalPhotos: entriesWithPhotos.length,
            redFlagCount: entriesWithRedFlags.length,
            reportedBloodCount: entriesWithReportedBlood,
            highCrampsDays: highCrampsDays,
        };
    }, [filteredEntries]);

    return (
        <div className="p-4 sm:p-6 pb-24 text-white overflow-y-auto h-full">
            <header className="mb-4">
                <h1 className="text-3xl font-bold text-cyan-300">Dashboard</h1>
                <p className="text-slate-400">Your personalized wellness overview.</p>
            </header>
            
            <div className="flex justify-center my-4">
                <div className="bg-slate-800 p-1 rounded-full flex gap-1">
                    <button onClick={() => setTimePeriod('7d')} className={`px-4 py-1 text-sm rounded-full ${timePeriod === '7d' ? 'bg-cyan-500' : 'bg-transparent'}`}>7 Days</button>
                    <button onClick={() => setTimePeriod('30d')} className={`px-4 py-1 text-sm rounded-full ${timePeriod === '30d' ? 'bg-cyan-500' : 'bg-transparent'}`}>30 Days</button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center my-6">
                <BodyAnatomyIcon className={`w-28 h-28 transition-colors duration-500 ${digestiveColorClass} ${digestiveGlowClass}`} />
                <p className={`mt-2 text-sm font-semibold ${digestiveColorClass}`}>Inflammation Risk: {riskText}</p>
            </div>


            {filteredEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center">
                        <WellnessGauge score={avgWellness} />
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col">
                        <h2 className="font-semibold text-slate-300 mb-3 flex items-center gap-2"><BodyAnatomyIcon className="w-5 h-5 text-cyan-400" />Digestive Health</h2>
                        <div className="flex-grow grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className={`text-3xl font-bold ${digestiveHealthStats.reportedBloodCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {digestiveHealthStats.reportedBloodCount}
                                </p>
                                <p className="text-xs text-slate-400">Days with Blood Reported</p>
                            </div>
                            <div>
                                <p className={`text-3xl font-bold ${digestiveHealthStats.highCrampsDays > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {digestiveHealthStats.highCrampsDays}
                                </p>
                                <p className="text-xs text-slate-400">High Cramp Days</p>
                            </div>
                            <div className="col-span-2 text-sm text-slate-500 pt-2 mt-2 border-t border-slate-700/50">
                                {digestiveHealthStats.totalPhotos > 0 
                                    ? `${digestiveHealthStats.totalPhotos} photos analyzed, ${digestiveHealthStats.redFlagCount} with AI concerns.`
                                    : `Attach photos to entries for AI analysis.`
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={onNavigateToMenuScanner} className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors col-span-1">
                        <h2 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><MenuScannerIcon className="w-5 h-5 text-cyan-400" />AI Menu Scanner</h2>
                        <p className="text-slate-400 text-sm">Scan restaurant menus to see which options are safe for you.</p>
                         <p className="text-right text-xs text-cyan-400 mt-2 font-semibold">Open Scanner &rarr;</p>
                    </div>

                    <div onClick={onNavigateToIngredientScanner} className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors col-span-1">
                        <h2 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><IngredientScannerIcon className="w-5 h-5 text-cyan-400" />Ingredient Scanner</h2>
                        <p className="text-slate-400 text-sm">Scan product labels to analyze ingredients for potential triggers.</p>
                         <p className="text-right text-xs text-cyan-400 mt-2 font-semibold">Open Scanner &rarr;</p>
                    </div>

                    <DietInsightCard journalEntries={journalEntries} onClick={onNavigateToDiet} />
                    
                    <div onClick={onNavigateToTrendAnalysis} className="bg-slate-800/50 rounded-lg p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                        <h2 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><CrystalBallIcon className="w-5 h-5 text-cyan-400" />Trend Analysis</h2>
                        <p className="text-slate-400 text-sm">Get AI-powered insights on your flare-up risk and wellness trends.</p>
                         <p className="text-right text-xs text-cyan-400 mt-2 font-semibold">View Analysis &rarr;</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 md:col-span-2">
                         <h2 className="font-semibold text-slate-300 mb-2 flex items-center gap-2"><ResearchIcon className="w-5 h-5 text-cyan-400" />Research Contribution</h2>
                         <p className="text-slate-400 text-sm">You've logged <span className="font-bold text-white">{journalEntries.length}</span> entries! Your anonymized data helps train our AI to be more accurate for everyone.</p>
                    </div>
                </div>
            ) : (
                 <div className="text-center py-16 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400">No entries in the last {timePeriod === '7d' ? '7 days' : '30 days'}.</p>
                    <p className="text-slate-500 text-sm mt-1">Log an entry to see your dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default DashboardScreen;