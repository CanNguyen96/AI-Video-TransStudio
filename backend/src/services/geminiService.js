const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS_TO_TRY = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

/**
 * Gửi file audio lên Gemini API và nhận về transcript với timestamps
 */
const transcribeAndTranslate = async (audioPath, targetLanguage = 'Vietnamese') => {
  console.log(`🤖 Gemini: Đang xử lý ${path.basename(audioPath)}...`);

  const audioData = fs.readFileSync(audioPath);
  const base64Audio = audioData.toString('base64');

  const prompt = `Listen carefully to this audio file and create subtitles for it.

Your task: transcribe the spoken words and translate them into ${targetLanguage}.

OUTPUT FORMAT: Return a single valid JSON array only. No markdown, no explanation, just JSON.

EXAMPLE of the expected output:
[
  {"start": 0.0, "end": 3.2, "original": "突然，猪猪发现了浑身是伤的香奈乎", "translated": "Đột nhiên, Heo phát hiện ra Xuyên Nại Hồ đầy thương tích"},
  {"start": 3.2, "end": 6.5, "original": "不知道这里发生了什么事", "translated": "Không biết điều gì đã xảy ra ở đây"},
  {"start": 6.5, "end": 9.0, "original": "She walked slowly to the door", "translated": "Cô ấy bước chậm chạp tới cửa"}
]

RULES:
- "start" and "end" = time position in seconds (a number like 3.2, NOT a string like "00:03")
- "original" = the ACTUAL SPOKEN WORDS in their original language (Chinese? use 汉字. English? use English letters.)
- "translated" = accurate translation of those words into ${targetLanguage}
- Each segment must be max 5 seconds long
- Each segment must be max 15 words
- Split long sentences into multiple segments at natural pause points
- Silence, music, sound effects: skip them, no segment needed
- NEVER put time codes like "00:16" or "01:23" inside the "original" or "translated" fields
- The text fields must contain WORDS, not numbers or timestamps

Now transcribe and translate the entire audio:`;

  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`   Thử model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
            { text: prompt },
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        }
      });

      const responseText = result.response.text().trim();
      console.log(`✅ Gemini [${modelName}]: Nhận về ${responseText.length} ký tự`);

      const segments = parseAndValidateResponse(responseText);
      console.log(`   → ${segments.length} segments hợp lệ sau khi validate`);
      return segments;

    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`   ⚠️  Model ${modelName} bị giới hạn quota, thử tiếp...`);
        continue;
      }
      throw formatGeminiError(err);
    }
  }

  throw formatGeminiError(lastError);
};

const formatGeminiError = (err) => {
  const msg = err?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return new Error('API Gemini đã hết quota. Vui lòng bật billing tại https://aistudio.google.com hoặc tạo API key mới.');
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
    return new Error('GEMINI_API_KEY không hợp lệ. Hãy kiểm tra lại file .env');
  }
  return new Error(`Gemini API lỗi: ${msg.substring(0, 200)}`);
};

/**
 * Parse JSON từ Gemini + khôi phục nếu bị cắt cụt + lọc bỏ segments ảo giác
 */
const parseAndValidateResponse = (responseText) => {
  let cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.warn(`⚠️ JSON bị lỗi (${err.message}), đang thử khôi phục...`);

    // Khôi phục bằng cách chặt bớt phần cuối bị hỏng
    let textToTry = cleaned;
    while (textToTry.length > 5) {
      try { parsed = JSON.parse(textToTry + ']'); break; } catch (e) {}
      const lastBrace = textToTry.lastIndexOf('}');
      if (lastBrace === -1) break;
      textToTry = textToTry.substring(0, lastBrace + 1);
      try { parsed = JSON.parse(textToTry + ']'); break; } catch (e) {}
      textToTry = textToTry.substring(0, textToTry.length - 1);
    }

    if (!parsed) {
      throw new Error(`Response không chứa JSON hợp lệ: ${err.message}`);
    }
    console.log(`✅ Đã khôi phục ${parsed.length} segments từ JSON bị lỗi!`);
  }

  if (!Array.isArray(parsed)) throw new Error('Response không phải là array');

  // Pattern nhận diện text bị hallucinate thành danh sách timestamps
  // Ví dụ: "00:00 00:01 00:02 00:03..."
  const TIMESTAMP_LIST_PATTERN = /^(\d{2}:\d{2}\s+){3,}/;

  const validated = parsed
    .map((seg) => ({
      start:      parseFloat(seg.start) || 0,
      end:        parseFloat(seg.end)   || 0,
      original:   String(seg.original   || '').trim(),
      translated: String(seg.translated || seg.original || '').trim(),
    }))
    .filter((seg) => {
      if (!seg.original || seg.original.length === 0) return false;
      if (seg.end <= seg.start) return false;
      // Lọc bỏ segment bị ảo giác thành danh sách timestamps
      if (TIMESTAMP_LIST_PATTERN.test(seg.original)) {
        console.warn(`   ⚠️ Lọc segment ảo giác: "${seg.original.substring(0, 60)}"`);
        return false;
      }
      if (TIMESTAMP_LIST_PATTERN.test(seg.translated)) {
        console.warn(`   ⚠️ Lọc translated ảo giác: "${seg.translated.substring(0, 60)}"`);
        return false;
      }
      return true;
    });

  return validated;
};

module.exports = { transcribeAndTranslate };
