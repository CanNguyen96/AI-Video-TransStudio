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

module.exports = {
  parseAndValidateResponse,
};
