import { JournalEntry } from './types';

// Helper to get a date X days ago
const getDateAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

export const sampleJournalEntries: JournalEntry[] = [
    {
        id: '1',
        date: getDateAgo(1),
        transcription: "Feeling pretty stressed today, work was overwhelming. My stomach has been bothering me, probably a 6 out of 10 on the pain scale with bad cramps, maybe a 7 severity. I think I saw some blood in my stool, which was very soft, almost like diarrhea. I just had some toast and a coffee for dinner because I didn't feel like cooking.",
        summary: {
            mentalWellnessScore: 3,
            physicalSymptoms: ["6/10 stomach pain", "stress"],
            moods: ["overwhelmed", "stressed"],
            foodEaten: ["toast", "coffee"],
            exercise: [],
            flareUpRisk: 85,
            stoolType: 'Soft',
            stoolColor: 'Brown with red streaks',
            bloodInStool: true,
            crampsSeverity: 7,
        },
    },
    {
        id: '2',
        date: getDateAgo(2),
        transcription: "Today was a much better day. I went for a long walk in the morning which really helped clear my head. My symptoms are much calmer, maybe a 2 out of 10 pain and no cramps. Stool was normal, solid brown. For lunch, I had a chicken salad. Feeling optimistic.",
        summary: {
            mentalWellnessScore: 8,
            physicalSymptoms: ["2/10 stomach pain"],
            moods: ["optimistic", "calm"],
            foodEaten: ["chicken", "salad"],
            exercise: ["long walk"],
            flareUpRisk: 20,
            stoolType: 'Normal',
            stoolColor: 'Brown',
            bloodInStool: false,
            crampsSeverity: 1,
        },
    },
    {
        id: '3',
        date: getDateAgo(5),
        transcription: "I'm so tired today, just feeling drained. Had toast for breakfast, then my stomach acted up with diarrhea. I had pizza for dinner which might not have been the best choice either.",
        summary: {
            mentalWellnessScore: 4,
            physicalSymptoms: ["fatigue", "diarrhea"],
            moods: ["tired", "drained"],
            foodEaten: ["toast", "pizza"],
            exercise: [],
            flareUpRisk: 60,
            stoolType: 'Diarrhea',
            stoolColor: 'Brown',
            bloodInStool: false,
            crampsSeverity: 3,
        },
    },
    {
        id: '4',
        date: getDateAgo(8),
        transcription: "Feeling good. Productive day at work and I managed to hit the gym in the evening. My energy levels are high and symptoms are nonexistent. Everything is normal in the bathroom department. I had a healthy salmon and vegetable dinner.",
        summary: {
            mentalWellnessScore: 9,
            physicalSymptoms: [],
            moods: ["productive", "energetic"],
            foodEaten: ["salmon", "vegetables"],
            exercise: ["gym session"],
            flareUpRisk: 10,
            stoolType: 'Normal',
            stoolColor: 'Brown',
            bloodInStool: false,
            crampsSeverity: 0,
        },
    },
     {
        id: '6',
        date: getDateAgo(6),
        transcription: "Felt pretty good today, no major issues. Had a chicken salad for lunch which sat well. Stool was normal. Feeling content.",
        summary: {
            mentalWellnessScore: 8,
            physicalSymptoms: [],
            moods: ["content"],
            foodEaten: ["chicken", "salad"],
            exercise: ["walk"],
            flareUpRisk: 15,
            stoolType: 'Normal',
            stoolColor: 'Brown',
            bloodInStool: false,
            crampsSeverity: 0,
        },
    },
    {
        id: '5',
        date: getDateAgo(15),
        transcription: "A bit of a mixed day. Felt anxious in the morning but I did some meditation which helped. My stomach is a little unsettled with some mild cramps, maybe a 2/10. Stool was a bit hard. Had a sandwich for lunch and a coffee. Went for a short bike ride.",
        summary: {
            mentalWellnessScore: 6,
            physicalSymptoms: ["unsettled stomach", "mild cramps"],
            moods: ["anxious"],
            foodEaten: ["sandwich", "coffee"],
            exercise: ["short bike ride"],
            flareUpRisk: 40,
            stoolType: 'Hard',
            stoolColor: 'Dark Brown',
            bloodInStool: false,
            crampsSeverity: 2,
        },
    },
];