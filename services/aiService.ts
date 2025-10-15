import { GoogleGenAI } from '@google/genai';

/**
 * Generates a financial analysis for a given month's data.
 * @param summaryText - A string summarizing the month's financial data.
 * @param monthName - The name of the month being analyzed (e.g., "January 2024").
 * @returns A promise that resolves to the AI-generated analysis text.
 * @throws An error if the API key is missing or if the API call fails.
 */
export const generateMonthlyAnalysis = async (summaryText: string, monthName: string): Promise<string> => {
  // FIX: The API key must be obtained from process.env.API_KEY as per the coding guidelines,
  // instead of Vite's import.meta.env. This resolves the TypeScript error and aligns with project standards.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set in the environment variables.");
    throw new Error("لم يتم تكوين مفتاح الـ API. يرجى الاتصال بالدعم الفني.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      أنت مستشار مالي لمعلم دروس خصوصية اسمه "مستر إسلام".
      المطلوب منك تحليل بيانات الدخل لشهر ${monthName} وتقديم ملخص ونصائح مفيدة باللغة العربية.
      
      بيانات الشهر هي:
      ${summaryText}

      قدم تحليلك في النقاط التالية:
      1.  ملخص سريع للدخل هذا الشهر.
      2.  نقاط القوة (مثلاً: مجموعة معينة دخلها مرتفع).
      3.  اقتراحات للتحسين أو فرص للنمو (مثلاً: التركيز على مجموعات معينة، أو اقتراح زيادة عدد الطلاب).
      
      اجعل النصيحة قصيرة ومركزة ومكتوبة بأسلوب احترافي ومشجع ومنسقة بشكل جيد.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    // Access the 'text' property from the response.
    const text = response.text;
    if (!text) {
        throw new Error('لم يتمكن الذكاء الاصطناعي من إنشاء رد.');
    }
    return text;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message.includes('API key')) {
        throw new Error('مفتاح الـ API غير صالح. يرجى مراجعة الإعدادات.');
    }
    throw new Error('حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. حاول مرة أخرى لاحقًا.');
  }
};