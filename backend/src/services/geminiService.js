const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gửi file audio lên Gemini API và nhận về transcript với timestamps
 * Gemini 2.0 Flash có thể xử lý audio trực tiếp (inline data)
 *
 * @param {string} audioPath - Đường dẫn tuyệt đối đến file .mp3
 * @param {string} targetLanguage - Ngôn ngữ dịch sang (mặc định: 'Vietnamese')
 * @returns {Promise<Array>} - Mảng segments: [{start, end, original, translated}]
 */
const transcribeAndTranslate = async (audioPath, targetLanguage = 'Vietnamese') => {
  console.log(`🤖 Gemini: Đang xử lý ${path.basename(audioPath)}...`);

  // Đọc file audio dưới dạng base64
  const audioData = fs.readFileSync(audioPath);
  const base64Audio = audioData.toString('base64');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a professional transcription and translation AI. 
Analyze the audio and provide a detailed transcript with precise timestamps.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no explanation.

Format each segment as:
[
  {
    "start": 0.0,
    "end": 3.5,
    "original": "Original spoken text here",
    "translated": "Translated text in ${targetLanguage} here"
  }
]

Rules:
- "start" and "end" are timestamps in SECONDS (float, 1 decimal)
- "original" is the verbatim transcription of what was said
- "translated" is the accurate translation into ${targetLanguage}
- Each segment should be 1-3 sentences max for readability
- If audio is already in ${targetLanguage}, keep "translated" same as "original"
- If no speech detected, return an empty array: []

Transcribe and translate ALL speech in the audio now.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'audio/mp3',
        data: base64Audio,
      },
    },
    { text: prompt },
  ]);

  const responseText = result.response.text().trim();
  console.log(`✅ Gemini: Nhận được response (${responseText.length} ký tự)`);

  // Parse JSON từ response
  return parseGeminiResponse(responseText);
};

/**
 * Parse và validate JSON response từ Gemini
 */
const parseGeminiResponse = (responseText) => {
  try {
    // Xóa markdown code blocks nếu Gemini trả về dạng ```json ... ```
    let cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response không phải là array');
    }

    // Validate và normalize từng segment
    return parsed.map((seg, idx) => ({
      start: parseFloat(seg.start) || 0,
      end: parseFloat(seg.end) || 0,
      original: String(seg.original || '').trim(),
      translated: String(seg.translated || seg.original || '').trim(),
    })).filter((seg) => seg.original.length > 0 && seg.end > seg.start);
  } catch (err) {
    console.error('❌ Lỗi parse Gemini response:', err.message);
    console.error('Raw response:', responseText.substring(0, 500));
    throw new Error(`Không thể parse kết quả từ Gemini: ${err.message}`);
  }
};

module.exports = { transcribeAndTranslate };
