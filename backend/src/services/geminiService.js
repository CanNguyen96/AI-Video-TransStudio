const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// File lớn hơn ngưỡng này sẽ dùng File API thay vì inline base64
const FILE_API_THRESHOLD_MB = 4;

const MODELS_TO_TRY = [
  'gemini-2.0-flash',          // Ổn định nhất, thử trước
  'gemini-2.5-flash',          // Mạnh hơn nhưng đôi khi overload
  'gemini-2.5-flash-lite',     // Nhẹ nhưng hay bị 503
  'gemini-1.5-flash',          // Fallback cuối nếu tất cả fail
];

/**
 * Upload audio lên Gemini File API, đợi xử lý xong
 * Dùng cho file lớn > FILE_API_THRESHOLD_MB
 */
const uploadToFileAPI = async (audioPath) => {
  console.log(`   📤 Upload audio lên Gemini File API...`);
  const uploadResult = await fileManager.uploadFile(audioPath, {
    mimeType: 'audio/mp3',
    displayName: path.basename(audioPath),
  });

  // Đợi file được xử lý xong (ACTIVE state)
  let file = uploadResult.file;
  let waitMs = 1000;
  while (file.state === 'PROCESSING') {
    process.stdout.write(`   ⏳ File đang xử lý... (${file.state})\r`);
    await new Promise((r) => setTimeout(r, waitMs));
    waitMs = Math.min(waitMs * 1.5, 5000); // exponential backoff, tối đa 5s
    file = await fileManager.getFile(file.name);
  }

  if (file.state !== 'ACTIVE') {
    throw new Error(`File API upload thất bại, state: ${file.state}`);
  }

  console.log(`   ✅ File API ready: ${file.uri}`);
  return file;
};

/**
 * Gửi file audio lên Gemini API và nhận về transcript với timestamps
 */
const transcribeAndTranslate = async (audioPath, targetLanguage = 'Vietnamese') => {
  console.log(`🤖 Gemini: Đang xử lý ${path.basename(audioPath)}...`);

  const fileSizeBytes = fs.statSync(audioPath).size;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  console.log(`   File size: ${fileSizeMB.toFixed(2)} MB`);

  // Quyết định dùng File API hay inline base64
  const useFileAPI = fileSizeMB > FILE_API_THRESHOLD_MB;
  console.log(`   Phương thức: ${useFileAPI ? 'File API (upload trước)' : 'Inline base64'}`);

  let audioPart;
  let uploadedFile = null;

  if (useFileAPI) {
    // Dùng File API cho file lớn — nhanh hơn, không bị giới hạn size
    uploadedFile = await uploadToFileAPI(audioPath);
    audioPart = { fileData: { mimeType: 'audio/mp3', fileUri: uploadedFile.uri } };
  } else {
    // Inline base64 cho file nhỏ — nhanh hơn vì không cần upload riêng
    const audioData = fs.readFileSync(audioPath);
    const base64Audio = audioData.toString('base64');
    audioPart = { inlineData: { mimeType: 'audio/mp3', data: base64Audio } };
  }

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

  try {
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`   Thử model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              audioPart,
              { text: prompt },
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            // Tăng lên để tránh response bị cắt giữa chừng gây segment cuối bị hỏ
            maxOutputTokens: 65536,
            temperature: 0.1,  // Giảm temperature để output ổn định hơn
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

        // Các lỗi có thể retry: quota, overload, service unavailable, server error
        const isRetryable =
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('503') ||
          msg.includes('Service Unavailable') ||
          msg.includes('overloaded') ||
          msg.includes('500') ||
          msg.includes('UNAVAILABLE');

        if (isRetryable) {
          console.warn(`   ⚠️  Model ${modelName} không khả dụng (${msg.substring(0, 80)}), thử model tiếp theo...`);
          await new Promise((r) => setTimeout(r, 1500)); // đợi 1.5s trước khi thử model kế
          continue;
        }

        // Lỗi không retry được (API key sai, request lỗi...) → throw ngay
        throw formatGeminiError(err);
      }
    }
  } finally {
    // Dọn dẹp file trên Gemini File API sau khi xong
    if (uploadedFile) {
      try {
        await fileManager.deleteFile(uploadedFile.name);
        console.log(`   🗑️  Đã xóa file tạm trên Gemini File API`);
      } catch (_) { /* ignore cleanup errors */ }
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

  // Bước 1: Map và normalize
  const mapped = parsed.map((seg) => ({
    start:      parseFloat(seg.start) || 0,
    end:        parseFloat(seg.end)   || 0,
    original:   String(seg.original   || '').trim(),
    translated: String(seg.translated || seg.original || '').trim(),
  }));

  // Bước 2: Tính max end time thực tế (dùng để cap các segment bị hảo)
  // Lấy end time lớn nhất của 90% segments đầu tiên để tránh outlier
  const sortedEnds = mapped
    .map((s) => s.end)
    .filter((e) => e > 0)
    .sort((a, b) => a - b);
  const p90End = sortedEnds[Math.floor(sortedEnds.length * 0.9)] || 7200;
  // Giới hạn tối đa: không quá 2 giờ (7200s) và không quá giá trị p90 * 1.5
  const MAX_END = Math.min(7200, p90End * 1.5);

  const validated = mapped
    .map((seg) => {
      // Cap end time bất thường (segment cuối bị recover có end = 0 sau khi parseFloat)
      // Hoặc Gemini hallucinate end rất lớn
      if (seg.end > MAX_END) {
        console.warn(`   ⚠️ Cap end time bất thường: ${seg.end}s → bỏ qua segment này`);
        return null;
      }
      // Đảm bảo mỗi segment tối đa 15 giây (nếu dài hơn là bất thường)
      if (seg.end - seg.start > 15) {
        console.warn(`   ⚠️ Segment quá dài: ${(seg.end - seg.start).toFixed(1)}s | "${seg.original.substring(0, 40)}"`);
        // Không bỏ, chỉ cảnh báo — có thể là chủ đề nhạc, khoảng lặng...
      }
      return seg;
    })
    .filter((seg) => {
      if (!seg) return false;
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

  console.log(`   → Sau validate: ${validated.length}/${mapped.length} segments hợp lệ (max end cap: ${MAX_END.toFixed(0)}s)`);
  return validated;
};

module.exports = { transcribeAndTranslate };
