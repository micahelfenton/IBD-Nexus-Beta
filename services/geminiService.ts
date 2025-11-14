import { GoogleGenAI, Type } from '@google/genai';
import { JournalSummary, ImageAnalysisResult, TrendAnalysisResult, MenuAnalysisResult, UserDietaryProfile, IngredientAnalysisResult } from '../types';

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
                timeframe: { type: Type.STRING },
                startValue: { type: Type.NUMBER, description: "The flareUpRisk value from the earliest entry." },
                endValue: { type: Type.NUMBER, description: "The flareUpRisk value from the most recent entry." }
            },
            required: ["metric", "changePercent", "timeframe", "startValue", "endValue"]
        },
        wellnessTrend: {
            type: Type.OBJECT,
            properties: {
                metric: { type: Type.STRING },
                changePercent: { type: Type.NUMBER },
                timeframe: { type: Type.STRING },
                startValue: { type: Type.NUMBER, description: "The mentalWellnessScore value from the earliest entry." },
                endValue: { type: Type.NUMBER, description: "The mentalWellnessScore value from the most recent entry." }
            },
            required: ["metric", "changePercent", "timeframe", "startValue", "endValue"]
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
        },
        overallInterpretation: {
            type: Type.STRING,
            description: "A single, non-technical sentence summarizing the overall trend for the user."
        }
    },
    required: ['riskTrend', 'wellnessTrend', 'correlationInsights', 'stoolPattern', 'overallInterpretation']
};

export async function generateTrendAnalysis(entries: JournalSummary[]): Promise<TrendAnalysisResult> {
    const prompt = `
        You are a data analyst for a health application. Based on the following array of journal entry summary objects, perform these analysis tasks:
        1.  **Trend Score:** Calculate the percentage change in 'flareUpRisk' and 'mentalWellnessScore' from the earliest entry to the most recent entry. You MUST also provide the exact 'startValue' (from the earliest entry) and 'endValue' (from the most recent entry).
        2.  **Symptom Correlation:** Identify the single most common food ('foodEaten') and single most common mood ('moods') that appear in entries where 'flareUpRisk' is 80 or higher.
        3.  **Stool Pattern:** State the most frequent 'stoolType' across all entries and the total count of entries where 'bloodInStool' was true.
        4.  **Overall Interpretation:** Write one single, non-technical sentence that summarizes the meaning of the trends for the user. For example: "It looks like your wellness has improved while your flare-up risk has decreased, which is a great sign."

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
            riskTrend: { metric: "FlareUpRisk", changePercent: 0, timeframe: "Last 30 Days", startValue: 0, endValue: 0 },
            wellnessTrend: { metric: "MentalWellnessScore", changePercent: 0, timeframe: "Last 30 Days", startValue: 0, endValue: 0 },
            correlationInsights: { highRiskFoodTrigger: "N/A", highRiskMoodTrigger: "N/A" },
            stoolPattern: { mostFrequentType: "N/A", bloodInStoolCount: 0 },
            overallInterpretation: "Could not determine trend. Please log more entries."
        };
    }
}

const menuAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            description: 'An array of analyzed menu items found in the image.',
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: { type: Type.STRING, description: 'The name of the menu item.' },
                    risk: { type: Type.STRING, description: 'Risk level: "safe", "caution", or "avoid".' },
                    reason: { type: Type.STRING, description: 'A brief explanation for the assigned risk level.' },
                    suggestion: { type: Type.STRING, description: 'A suggested modification, if applicable (for "caution" items).' },
                    boundingBox: {
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
                required: ['itemName', 'risk', 'reason', 'boundingBox']
            }
        },
        error: { 
            type: Type.STRING, 
            description: "An error message if the image is unreadable. If the image is readable, this key should not be present."
        }
    },
    required: ['items']
};

export async function analyzeMenu(base64Image: string, profile: UserDietaryProfile): Promise<MenuAnalysisResult> {
    const parts = base64Image.split(',');
    if (parts.length < 2) throw new Error("Invalid base64 image format");
    const mimeTypeMatch = parts[0].match(/:(.*?);/);
    if (!mimeTypeMatch) throw new Error("Could not determine mime type from base64 string");
    
    const mimeType = mimeTypeMatch[1];
    const data = parts[1];
    const imagePart = { inlineData: { mimeType, data } };
    
    const dietaryRestrictions = [];
    if (profile.avoidsInsolubleFiber) dietaryRestrictions.push("Insoluble Fiber (e.g., whole grains, raw vegetables with skins)");
    if (profile.avoidsHighFODMAP) dietaryRestrictions.push("High-FODMAP ingredients (e.g., onion, garlic, beans, certain fruits)");
    if (profile.avoidsDairy) dietaryRestrictions.push("Dairy (e.g., milk, cream, cheese)");
    if (profile.avoidsSpicy) dietaryRestrictions.push("Spicy ingredients (e.g., chili, cayenne)");
    if (profile.avoidsFatty) dietaryRestrictions.push("High-fat/fried foods (e.g., deep-fried items, heavy oils)");

    const prompt = `
        You are an expert-level visual analysis AI. Your task is to analyze a restaurant menu image for an IBD patient with these dietary restrictions: ${dietaryRestrictions.join(', ')}. Your absolute top priority is generating **surgically precise** bounding boxes for each menu item.

        **CRITICAL INSTRUCTIONS - FOLLOW THIS PROCESS EXACTLY:**

        1.  **IMAGE QUALITY CHECK (CRITICAL):** Your first step is to assess the image quality. Make your absolute best effort to analyze the menu even if the image is not perfect (e.g., slightly blurry, minor glare, challenging lighting).
            *   **Prioritize Analysis:** If you can confidently identify at least a few menu items, proceed with the analysis. Omit any items you are unsure about rather than guessing.
            *   **Error Handling:** Only if the image is **so blurry, dark, or obscured that you cannot confidently read ANY menu items**, should you return an error. In that specific case, return this JSON: \`{"items": [], "error": "The image is unreadable. Please provide a clearer picture with better lighting."}\`. In all other cases, analyze what you can and do NOT include the 'error' key.

        2.  **MENTAL SCAN**: First, visually scan the entire image to identify logical text blocks that represent individual menu items. A "menu item" includes its name AND its description, which might span multiple lines.

        3.  **ONE ITEM AT A TIME**: Process each identified menu item individually. Do not try to process them all at once.

        4.  **FOR EACH ITEM - GENERATE THE BOUNDING BOX**:
            *   **Step A: Find the Text Boundaries.** Identify the absolute top, bottom, left, and right extents of the text for this single item.
            *   **Step B: Create the Tightest Possible Box.** The bounding box coordinates MUST tightly enclose ONLY the text. There should be almost zero padding.
            *   **Step C: ABSOLUTELY IGNORE NON-TEXT.** Your bounding box must NOT include page spirals, lines on the paper, illustrations, or large gaps between the item and the next. This is a critical failure point. If you see a spiral binding, your box must stop before it.
            *   **Step D: SELF-CORRECT.** Look at your generated box. Is it too wide? Is it too tall? Does it include the spiral? If so, shrink it until it ONLY covers the text pixels.

        5.  **FOR EACH ITEM - PERFORM RISK ANALYSIS**:
            *   Read the text inside your perfect bounding box.
            *   Infer ingredients (e.g., "Fried Chicken" implies high fat and likely wheat flour).
            *   Assign a risk ("safe", "caution", "avoid") based on the user's restrictions.
            *   Provide a concise reason for the risk.
            *   For "caution" items, provide an actionable suggestion (e.g., "Ask for grilled instead of fried").

        6.  **FINALIZE JSON**: Compile the results for all items into a single JSON object that strictly adheres to the schema. The accuracy of your bounding boxes is the most important part of this task. Do not fail on this point.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: menuAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as MenuAnalysisResult & { error?: string };
        if (result.error) {
            throw new Error(result.error);
        }
        return result;
    } catch (error) {
        console.error('Error analyzing menu:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred during menu analysis.');
    }
}

const ingredientAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        ingredients: {
            type: Type.ARRAY,
            description: 'An array of analyzed ingredients found in the image.',
            items: {
                type: Type.OBJECT,
                properties: {
                    ingredientName: { type: Type.STRING, description: 'The name of the ingredient.' },
                    risk: { type: Type.STRING, description: 'Risk level: "green", "amber", or "red".' },
                    reason: { type: Type.STRING, description: 'A brief explanation for the assigned risk level.' },
                },
                required: ['ingredientName', 'risk', 'reason']
            }
        },
        error: { 
            type: Type.STRING, 
            description: "An error message if the image is unreadable. If the image is readable, this key should not be present."
        }
    },
    required: ['ingredients']
};


export async function analyzeIngredients(base64Image: string, profile: UserDietaryProfile): Promise<IngredientAnalysisResult> {
    const parts = base64Image.split(',');
    if (parts.length < 2) throw new Error("Invalid base64 image format");
    const mimeTypeMatch = parts[0].match(/:(.*?);/);
    if (!mimeTypeMatch) throw new Error("Could not determine mime type from base64 string");
    
    const mimeType = mimeTypeMatch[1];
    const data = parts[1];
    const imagePart = { inlineData: { mimeType, data } };
    
    const dietaryRestrictions = [];
    if (profile.avoidsInsolubleFiber) dietaryRestrictions.push("Insoluble Fiber (e.g., whole grains, raw vegetables with skins)");
    if (profile.avoidsHighFODMAP) dietaryRestrictions.push("High-FODMAP ingredients (e.g., onion, garlic, beans, certain fruits)");
    if (profile.avoidsDairy) dietaryRestrictions.push("Dairy (e.g., milk, cream, cheese)");
    if (profile.avoidsSpicy) dietaryRestrictions.push("Spicy ingredients (e.g., chili, cayenne)");
    if (profile.avoidsFatty) dietaryRestrictions.push("High-fat/fried foods (e.g., deep-fried items, heavy oils)");
    
    const prompt = `
        You are an expert nutritional analysis AI for IBD patients. Your task is to analyze an image of a food product's ingredients list.

        **CRITICAL INSTRUCTIONS:**

        1.  **IMAGE QUALITY CHECK (CRITICAL):** Your first step is to assess image quality. Your goal is to extract information whenever possible, even if the image is imperfect.
            *   **Prioritize Analysis:** Make your best attempt to read the ingredients list even if the image quality is not perfect (e.g., slightly blurry, minor glare). If you can read at least a few ingredients, proceed with the analysis for those. If you cannot read any ingredients but the image is not completely blank or obscured, return an empty ingredients array without an error.
            *   **Error Handling:** Only if the image is **so blurry, dark, or obscured that no text is legible at all**, you MUST return the following JSON: \`{"ingredients": [], "error": "The image is unreadable. Please provide a clearer picture."}\`. Otherwise, do your best with what you can see and do NOT include the 'error' key.

        2.  **OCR and Extraction**: The text will be small. Perform high-accuracy OCR to read the ingredients list. Ingredients are typically listed after a keyword like "Ingredients:". Extract every single ingredient from this list. Be meticulous in parsing comma-separated items and items within parentheses.

        3.  **User Profile Analysis**: Analyze each extracted ingredient against the user's dietary profile: ${dietaryRestrictions.join(', ')}.

        4.  **Risk Classification**: For each ingredient, assign a risk level:
            *   **'red' (Avoid)**: The ingredient is a known major trigger or directly conflicts with the user's profile (e.g., 'milk' if user avoids dairy, 'chili powder' if user avoids spicy).
            *   **'amber' (Caution)**: The ingredient could be problematic for some people with IBD or depending on quantity (e.g., 'inulin' as a fiber source, 'natural flavors' which can be ambiguous, high-fat oils).
            *   **'green' (Safe)**: The ingredient is generally considered safe and well-tolerated for IBD (e.g., 'salt', 'rice flour', 'water').

        5.  **Provide a Reason**: For every ingredient, provide a concise, clear reason for its classification. For 'red' and 'amber', explain why it's a risk. For 'green', briefly state why it's likely safe (e.g., "Generally well-tolerated").

        6.  **Finalize JSON**: Compile the results for all identified ingredients into a single JSON object that strictly adheres to the provided schema. If you cannot read any ingredients, return an empty array.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: ingredientAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as IngredientAnalysisResult & { error?: string };
        if (result.error) {
            throw new Error(result.error);
        }
        return result;
    } catch (error) {
        console.error('Error analyzing ingredients:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unexpected error occurred during ingredient analysis.');
    }
}

const reportSummarySchema = {
    type: Type.OBJECT,
    properties: {
        title: { 
            type: Type.STRING,
            description: 'A concise, engaging title for the wellness report based on the timeframe and overall trend. E.g., "Weekly Wellness Uptick" or "Monthly Symptom Review".'
        },
        summary: {
            type: Type.STRING,
            description: 'A 2-3 sentence summary of the user\'s overall wellness. The tone should be objective but supportive. Mention key trends in symptoms, mood, and flare-up risk. This will be part of a report for the user or their doctor.'
        }
    },
    required: ['title', 'summary']
};

export async function generateReportSummary(entries: JournalSummary[], timeframeDays: number): Promise<{ title: string; summary: string }> {
    const prompt = `
        You are a health assistant AI. Based on the following journal data for the last ${timeframeDays} days, generate a JSON object containing a report title and a 2-3 sentence summary.

        - **Title**: Create a concise, engaging title for the report. Examples: "7-Day Wellness Review", "Weekly Health Snapshot", "Monthly Wellness Improvement".
        - **Summary**: Write a 2-3 sentence summary of the user's overall wellness. The tone should be objective but supportive, suitable for sharing with a doctor. Mention key trends in symptoms (e.g., "decreased stomach pain"), mood (e.g., "improved mood"), and flare-up risk.

        DATA:
        ${JSON.stringify(entries, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: reportSummarySchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as { title: string; summary: string };
    } catch (error) {
        console.error('Error generating report summary:', error);
        return {
            title: `Wellness Report`,
            summary: "Could not generate an AI summary for this period. The report below contains your key metrics."
        };
    }
}