const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');
const { getAudioDuration, splitAudio } = require('./gemini/audioHelper');
const { parseAndValidateResponse } = require('./gemini/responseParser');

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
 * Gửi file audio đơn lẻ lên Gemini API và nhận về transcript với timestamps
 */
const transcribeSingleFile = async (audioPath, targetLanguage = 'Vietnamese') => {
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
            // Tăng lên để tránh response bị cắt giữa chừng gây segment cuối bị hỏng
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

/**
 * Gửi file audio lên Gemini API và nhận về transcript với timestamps
 * (Tự động chia nhỏ nếu audio dài hơn 10 phút)
 */
const transcribeAndTranslate = async (audioPath, targetLanguage = 'Vietnamese') => {
  console.log(`🤖 Gemini: Đang xử lý ${path.basename(audioPath)}...`);
  
  let duration = 0;
  try {
    duration = await getAudioDuration(audioPath);
  } catch (err) {
    console.warn(`   ⚠️ Không đọc được duration bằng ffprobe: ${err.message}`);
  }
  
  console.log(`   Thời lượng audio: ${duration.toFixed(1)}s`);
  
  const SEGMENT_LIMIT = 60; // 1 phút
  if (duration > SEGMENT_LIMIT) {
    console.log(`   ⚠️ Audio dài hơn 1 phút. Bắt đầu chia nhỏ audio...`);
    const tempDirName = `chunks_${path.parse(audioPath).name}_${Date.now()}`;
    const tempDir = path.join(path.dirname(audioPath), tempDirName);
    
    let chunkFiles = [];
    try {
      chunkFiles = await splitAudio(audioPath, tempDir, SEGMENT_LIMIT);
      const allSegments = [];
      
      for (let i = 0; i < chunkFiles.length; i++) {
        const chunkFile = chunkFiles[i];
        console.log(`\n🤖 Đang dịch chunk [${i + 1}/${chunkFiles.length}]: ${path.basename(chunkFile)}`);
        
        const segments = await transcribeSingleFile(chunkFile, targetLanguage);
        
        // Cộng thêm time offset (i * SEGMENT_LIMIT)
        const offset = i * SEGMENT_LIMIT;
        const offsetSegments = segments.map((seg) => ({
          ...seg,
          start: Number((seg.start + offset).toFixed(2)),
          end: Number((seg.end + offset).toFixed(2)),
        }));
        
        allSegments.push(...offsetSegments);
      }
      
      return allSegments;
    } finally {
      // Dọn dẹp thư mục temp chunk
      try {
        if (fs.existsSync(tempDir)) {
          if (chunkFiles.length > 0) {
            chunkFiles.forEach((file) => {
              if (fs.existsSync(file)) fs.unlinkSync(file);
            });
          }
          fs.rmdirSync(tempDir);
          console.log(`   🗑️ Đã xóa thư mục chunk tạm: ${tempDirName}`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Không thể xóa thư mục chunk tạm: ${err.message}`);
      }
    }
  } else {
    // File ngắn, dịch trực tiếp
    return transcribeSingleFile(audioPath, targetLanguage);
  }
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

module.exports = { transcribeAndTranslate };
