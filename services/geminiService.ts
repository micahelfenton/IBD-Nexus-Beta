import { GoogleGenAI, Type } from '@google/genai';
import { JournalSummary, ImageAnalysisResult, TrendAnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fallbackSummary: JournalSummary = {
    mentalWellnessScore: 5,
    physicalSymptoms: ["No data"],
    moods: ["neutral"],
    foodEaten: [],
    exercise: [],
    flareUpRisk: 0,
    stoolType: 'Not mentioned',
    stoolColor: 'Not mentioned',
    bloodInStool: false,
    crampsSeverity: 0,
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mentalWellnessScore: {
      type: Type.INTEGER,
      description: 'A score from 1 (very poor) to 10 (excellent) representing the user\'s overall mental and emotional state for the day.'
    },
    physicalSymptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of any physical symptoms mentioned (e.g., "headache", "7/10 stomach pain", "fatigue"). Be specific.'
    },
    moods: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of emotions or moods described (e.g., "anxious", "optimistic", "stressed").'
    },
    foodEaten: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of ALL individual food items, ingredients, drinks, and spices mentioned (e.g., "coffee", "cinnamon", "toast", "avocado"). Break down meals into components.'
    },
    exercise: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of any physical activities or exercises mentioned (e.g., "30-minute walk", "gym session").'
    },
    flareUpRisk: {
      type: Type.INTEGER,
      description: 'A percentage (0-100) estimating the risk of a symptom flare-up based on the entry. Higher numbers mean higher risk. Consider factors like high stress, poor diet, lack of sleep, or increased symptoms.'
    },
    stoolType: {
        type: Type.STRING,
        description: 'The type of stool mentioned, if any. Categorize as one of: "Diarrhea", "Soft", "Normal", "Hard". If not mentioned, use "Not mentioned".'
    },
    stoolColor: {
        type: Type.STRING,
        description: 'The color of the stool mentioned, if any (e.g., "brown", "red", "black"). If not mentioned, use "Not mentioned".'
    },
    bloodInStool: {
        type: Type.BOOLEAN,
        description: 'True if the user explicitly mentions seeing blood, false otherwise.'
    },
    crampsSeverity: {
        type: Type.INTEGER,
        description: 'A score from 0 (no cramps) to 10 (severe cramps) based on the user\'s description. Default to 0 if not mentioned.'
    }
  },
  required: ['mentalWellnessScore', 'physicalSymptoms', 'moods', 'flareUpRisk', 'foodEaten', 'exercise', 'stoolType', 'stoolColor', 'bloodInStool', 'crampsSeverity']
};

export async function generateSummary(transcription: string): Promise<JournalSummary> {
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an empathetic health assistant. Analyze this voice journal entry to extract key wellness information. Focus on physical symptoms (IBD-related if mentioned), emotional state, stress levels, diet, and exercise.
      
      When extracting diet information, be very granular. List all individual food items, ingredients (like spices or condiments), and drinks mentioned. For example, if the user says "I had a chicken salad with ranch dressing and a coke", you should extract "chicken", "salad", "ranch dressing", and "coke".
      
      Pay special attention to descriptions of stool, including type (diarrhea, soft, normal, hard), color, presence of blood, and any mention of cramps (rate severity 0-10).
      
      Transcription: "${transcription}"
      
      Based on the transcription, generate a JSON object that strictly follows the provided schema.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as JournalSummary;

  } catch (error) {
    console.error('Error generating summary:', error);
    return fallbackSummary;
  }
}


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      redDetections: {
        type: Type.ARRAY,
        description: 'Bounding boxes for any red colored areas, potentially indicating blood.',
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER, description: 'Top-left corner X coordinate (normalized 0-1)'},
            y: { type: Type.NUMBER, description: 'Top-left corner Y coordinate (normalized 0-1)'},
            width: { type: Type.NUMBER, description: 'Width of the box (normalized 0-1)'},
            height: { type: Type.NUMBER, description: 'Height of the box (normalized 0-1)'},
          },
          required: ['x', 'y', 'width', 'height']
        }
      },
      brownDetections: {
         type: Type.ARRAY,
         description: 'Bounding boxes for brown colored areas, typical for stool.',
         items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: 'Top-left corner X coordinate (normalized 0-1)'},
              y: { type: Type.NUMBER, description: 'Top-left corner Y coordinate (normalized 0-1)'},
              width: { type: Type.NUMBER, description: 'Width of the box (normalized 0-1)'},
              height: { type: Type.NUMBER, description: 'Height of the box (normalized 0-1)'},
            },
            required: ['x', 'y', 'width', 'height']
        }
      }
    },
    required: ['redDetections', 'brownDetections']
  };

export async function analyzeStoolImage(base64Image: string): Promise<ImageAnalysisResult> {
    const parts = base64Image.split(',');
    if (parts.length < 2) {
        throw new Error("Invalid base64 image format");
    }
    const mimeTypeMatch = parts[0].match(/:(.*?);/);
    if (!mimeTypeMatch) {
        throw new Error("Could not determine mime type from base64 string");
    }
    const mimeType = mimeTypeMatch[1];
    const data = parts[1];

    const imagePart = {
        inlineData: { mimeType, data },
    };
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: 'You are a helpful medical analysis assistant. Analyze this image, which is purported to be of a stool sample. Identify and provide normalized bounding boxes for any areas that are colored red (which could indicate blood) and areas that are colored brown. Adhere strictly to the provided JSON schema. If no colors are found, return empty arrays.' },
                    imagePart
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ImageAnalysisResult;
    } catch (error) {
        console.error('Error analyzing image:', error);
        return { redDetections: [], brownDetections: [] };
    }
}

const trendAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        riskTrend: {
            type: Type.OBJECT,
            properties: {
                metric: { type: Type.STRING },
                changePercent: { type: Type.NUMBER },
                timeframe: { type: Type.STRING }
            }
        },
        wellnessTrend: {
            type: Type.OBJECT,
            properties: {
                metric: { type: Type.STRING },
                changePercent: { type: Type.NUMBER },
                timeframe: { type: Type.STRING }
            }
        },
        correlationInsights: {
            type: Type.OBJECT,
            properties: {
                highRiskFoodTrigger: { type: Type.STRING },
                highRiskMoodTrigger: { type: Type.STRING }
            }
        },
        stoolPattern: {
            type: Type.OBJECT,
            properties: {
                mostFrequentType: { type: Type.STRING },
                bloodInStoolCount: { type: Type.NUMBER }
            }
        }
    },
    required: ['riskTrend', 'wellnessTrend', 'correlationInsights', 'stoolPattern']
};

export async function generateTrendAnalysis(entries: JournalSummary[]): Promise<TrendAnalysisResult> {
    const prompt = `
        You are a data analyst for a health application. Based on the following array of journal entry summary objects, perform these analysis tasks:
        1.  **Trend Score:** Calculate the percentage change in 'flareUpRisk' and 'mentalWellnessScore' from the earliest entry to the most recent entry.
        2.  **Symptom Correlation:** Identify the single most common food ('foodEaten') and single most common mood ('moods') that appear in entries where 'flareUpRisk' is 80 or higher.
        3.  **Stool Pattern:** State the most frequent 'stoolType' across all entries and the total count of entries where 'bloodInStool' was true.

        Return ONLY a single, valid JSON object that adheres strictly to the provided schema. The timeframe for trends should be "Last 30 Days".

        DATA:
        ${JSON.stringify(entries, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: trendAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as TrendAnalysisResult;
    } catch (error) {
        console.error('Error generating trend analysis:', error);
        // Provide a fallback structure in case of an error
        return {
            riskTrend: { metric: "FlareUpRisk", changePercent: 0, timeframe: "Last 30 Days" },
            wellnessTrend: { metric: "MentalWellnessScore", changePercent: 0, timeframe: "Last 30 Days" },
            correlationInsights: { highRiskFoodTrigger: "N/A", highRiskMoodTrigger: "N/A" },
            stoolPattern: { mostFrequentType: "N/A", bloodInStoolCount: 0 }
        };
    }
}