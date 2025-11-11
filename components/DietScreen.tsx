import React, { useMemo } from 'react';
import { JournalEntry } from '../types';
import { ArrowLeftIcon } from './icons';

interface DietScreenProps {
  journalEntries: JournalEntry[];
  onBack: () => void;
}

interface FoodStat {
  name: string;
  goodDays: number;
  badDays: number;
  total: number;
  status: 'safe' | 'caution' | 'trigger';
}

const FoodListItem: React.FC<{ food: FoodStat }> = ({ food }) => {
  const statusColor = {
    safe: 'bg-green-500',
    caution: 'bg-yellow-500',
    trigger: 'bg-red-500',
  };

  const goodDayPercentage = food.total > 0 ? Math.round((food.goodDays / food.total) * 100) : 0;

  return (
    <li className="bg-slate-800/50 p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-4 ${statusColor[food.status]}`}></div>
        <span className="font-semibold text-slate-200 capitalize">{food.name}</span>
      </div>
      <div className="text-right text-sm">
        <p className="text-slate-300">{goodDayPercentage}% Symptom-Free</p>
        <p className="text-slate-500">{food.goodDays} good, {food.badDays} bad day{food.badDays !== 1 ? 's' : ''}</p>
      </div>
    </li>
  );
};

const DietScreen: React.FC<DietScreenProps> = ({ journalEntries, onBack }) => {
  const { foodAnalysis, uniqueFoodCount } = useMemo(() => {
    const foodStats: Record<string, { goodDays: number; badDays: number; total: number }> = {};
    const MINIMUM_ENTRIES = 3;

    const entriesWithFood = journalEntries.filter(e => e.summary.foodEaten && e.summary.foodEaten.length > 0);

    if (entriesWithFood.length < MINIMUM_ENTRIES) {
        return { foodAnalysis: null, uniqueFoodCount: 0 };
    }

    entriesWithFood.forEach(entry => {
      const isBadDay =
        (entry.summary.flareUpRisk ?? 0) > 50 ||
        entry.summary.bloodInStool === true ||
        (entry.summary.crampsSeverity ?? 0) >= 5 ||
        entry.summary.stoolType === 'Diarrhea' ||
        entry.summary.physicalSymptoms.some(symptom =>
          /pain|cramp|bloat|nausea|diarrhea/i.test(symptom)
        );

      entry.summary.foodEaten.forEach(foodItem => {
        const normalizedFood = foodItem.toLowerCase().trim();
        if (!normalizedFood) return;

        if (!foodStats[normalizedFood]) {
          foodStats[normalizedFood] = { goodDays: 0, badDays: 0, total: 0 };
        }

        if (isBadDay) {
          foodStats[normalizedFood].badDays++;
        } else {
          foodStats[normalizedFood].goodDays++;
        }
        foodStats[normalizedFood].total++;
      });
    });

    const categorizedFoods: { safe: FoodStat[], caution: FoodStat[], trigger: FoodStat[] } = {
      safe: [],
      caution: [],
      trigger: [],
    };
    
    const MINIMUM_OCCURRENCES = 2;

    Object.entries(foodStats).forEach(([name, stats]) => {
      if (stats.total < MINIMUM_OCCURRENCES) return;

      const goodRatio = stats.goodDays / stats.total;
      let status: 'safe' | 'caution' | 'trigger';

      if (goodRatio >= 0.8) {
        status = 'safe';
      } else if (goodRatio >= 0.4) {
        status = 'trigger';
      } else {
        status = 'caution';
      }
      
      const foodStat: FoodStat = { name, ...stats, status };
      categorizedFoods[status].push(foodStat);
    });
    
    categorizedFoods.safe.sort((a,b) => b.total - a.total);
    categorizedFoods.caution.sort((a,b) => b.total - a.total);
    categorizedFoods.trigger.sort((a,b) => b.total - a.total);

    return { foodAnalysis: categorizedFoods, uniqueFoodCount: Object.keys(foodStats).length };
  }, [journalEntries]);
  
  const entriesWithFoodCount = useMemo(() => {
      return journalEntries.filter(e => e.summary.foodEaten && e.summary.foodEaten.length > 0).length;
  }, [journalEntries]);

  return (
    <div className="p-4 sm:p-6 pb-24 text-white overflow-y-auto h-full">
      <header className="mb-6 flex items-center relative">
        <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label="Go back to dashboard">
            <ArrowLeftIcon className="w-6 h-6 text-slate-300" />
        </button>
        <div className="flex-grow text-center">
            <h1 className="text-3xl font-bold text-cyan-300">Dietary Insights</h1>
            <p className="text-slate-400">Discover your potential trigger foods.</p>
        </div>
      </header>

      {foodAnalysis && (
        <div className="mb-6 text-center text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg">
            <p>Analyzing <span className="font-bold text-cyan-400">{entriesWithFoodCount}</span> journal entries and <span className="font-bold text-cyan-400">{uniqueFoodCount}</span> unique food items to find your patterns.</p>
        </div>
      )}

      {!foodAnalysis || (foodAnalysis.safe.length === 0 && foodAnalysis.caution.length === 0 && foodAnalysis.trigger.length === 0) ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400">Not enough data yet.</p>
          <p className="text-slate-500 text-sm mt-1">You need at least 3 journal entries that mention food to generate insights.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {foodAnalysis.trigger.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-red-400 mb-3">Potential Triggers</h2>
              <ul className="space-y-2">
                {foodAnalysis.trigger.map(food => <FoodListItem key={food.name} food={food} />)}
              </ul>
            </section>
          )}

          {foodAnalysis.caution.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-yellow-400 mb-3">Use Caution</h2>
              <ul className="space-y-2">
                {foodAnalysis.caution.map(food => <FoodListItem key={food.name} food={food} />)}
              </ul>
            </section>
          )}

          {foodAnalysis.safe.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-green-400 mb-3">Safe Foods</h2>
              <ul className="space-y-2">
                {foodAnalysis.safe.map(food => <FoodListItem key={food.name} food={food} />)}
              </ul>
            </section>
          )}
        </div>
      )}
      <div className="mt-8 text-center text-xs text-slate-600">
        <p>Disclaimer: This analysis is based on your journal entries and is not medical advice. Consult a healthcare professional for dietary guidance.</p>
      </div>
    </div>
  );
};

export default DietScreen;