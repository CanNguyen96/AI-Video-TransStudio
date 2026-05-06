const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Tỉ lệ chiều cao vùng che subtitle mặc định (15% dưới cùng)
const DEFAULT_SUBTITLE_COVER_RATIO = 0.15;

/**
 * Tách audio từ file video → xuất ra file .mp3
 * @param {string} videoPath - Đường dẫn tuyệt đối đến file video
 * @param {string} outputDir - Thư mục lưu file audio output
 * @returns {Promise<string>} - Đường dẫn file audio đã tạo
 */
const extractAudio = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Tạo thư mục output nếu chưa tồn tại
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseName = path.parse(videoPath).name;
    const audioOutputPath = path.join(outputDir, `${baseName}.mp3`);

    console.log(`🎬 FFmpeg: Bắt đầu tách audio từ ${path.basename(videoPath)}`);

    ffmpeg(videoPath)
      .noVideo()                    // Bỏ track video, chỉ lấy audio
      .audioCodec('libmp3lame')     // Encode sang MP3
      .audioBitrate('64k')          // 64kbps — đủ cho speech recognition, file nhỏ hơn 2x
      .audioChannels(1)             // Mono — giảm file size, Gemini xử lý tốt hơn
      .audioFrequency(16000)        // 16kHz — chuẩn cho speech recognition
      .output(audioOutputPath)
      .on('start', (cmd) => {
        console.log(`   FFmpeg command: ${cmd}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`   Tiến độ: ${Math.round(progress.percent)}%\r`);
        }
      })
      .on('end', () => {
        console.log(`\n✅ FFmpeg: Tách audio xong → ${audioOutputPath}`);
        resolve(audioOutputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(new Error(`FFmpeg thất bại: ${err.message}`));
      })
      .run();
  });
};

/**
 * Lấy metadata video (duration, resolution, etc.)
 * @param {string} videoPath
 * @returns {Promise<Object>}
 */
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error(`Không đọc được metadata: ${err.message}`));
      }
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      resolve({
        duration: Math.round(metadata.format.duration || 0),
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        width: videoStream?.width,
        height: videoStream?.height,
        fps: videoStream?.r_frame_rate,
        audioCodec: audioStream?.codec_name,
        hasAudio: !!audioStream,
      });
    });
  });
};

/**
 * Phát hiện subtitle streams trong video
 * @param {string} videoPath
 * @returns {Promise<Object>} - { hasSoftSubtitle, subtitleStreams, subtitleCount }
 */
const detectSubtitleStreams = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error(`Không đọc được metadata: ${err.message}`));
      }

      const subtitleStreams = metadata.streams.filter(
        (s) => s.codec_type === 'subtitle'
      );

      // Lấy thông tin chi tiết từng subtitle track
      const subtitleInfo = subtitleStreams.map((s) => ({
        index: s.index,
        codec: s.codec_name,         // ass, srt, subrip, hdmv_pgs_subtitle...
        language: s.tags?.language || 'und',
        title: s.tags?.title || '',
        isDefault: s.disposition?.default === 1,
        isForced: s.disposition?.forced === 1,
      }));

      const result = {
        hasSoftSubtitle: subtitleStreams.length > 0,
        subtitleStreams: subtitleInfo,
        subtitleCount: subtitleStreams.length,
      };

      console.log(`🔍 Detect subtitle: ${result.subtitleCount} soft subtitle track(s) tìm thấy`);
      if (result.hasSoftSubtitle) {
        subtitleInfo.forEach((s) => {
          console.log(`   → Track #${s.index} [${s.codec}] lang=${s.language} title="${s.title}"`);
        });
      }

      resolve(result);
    });
  });
};

/**
 * Xóa soft subtitle tracks khỏi video rồi burn subtitle mới vào
 * Dùng cho video có soft subtitle (mkv, mp4 có subtitle track)
 * @param {string} videoPath  - Video gốc
 * @param {string} srtPath    - File SRT mới cần burn
 * @param {string} outputPath - Output path
 * @returns {Promise<string>}
 */
const burnSubtitlesRemovingSoft = (videoPath, srtPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const escapedSrt = srtPath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');

    console.log(`🔥 FFmpeg: Burn subtitle MỚI + xóa soft subtitle cũ...`);
    console.log(`   Input : ${path.basename(videoPath)}`);
    console.log(`   SRT   : ${path.basename(srtPath)}`);
    console.log(`   Output: ${path.basename(outputPath)}`);

    ffmpeg(videoPath)
      .videoFilter(`subtitles='${escapedSrt}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`)
      .outputOptions([
        '-c:v libx264',
        '-c:a copy',
        '-sn',              // ← Xóa toàn bộ soft subtitle tracks
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', () => console.log('   Bắt đầu render (xóa soft sub + burn mới)...'))
      .on('progress', (p) => {
        if (p.percent) process.stdout.write(`   Render: ${Math.round(p.percent)}%\r`);
      })
      .on('end', () => {
        console.log(`\n✅ FFmpeg: Burn subtitle (replace soft) xong → ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg burnSubtitlesRemovingSoft error:', err.message);
        reject(new Error(`FFmpeg burn subtitle thất bại: ${err.message}`));
      })
      .run();
  });
};

/**
 * Burn subtitle mới vào video có hardcoded subtitle:
 * - Dùng drawbox để che vùng phụ đề cũ bằng màu đen mờ
 * - Sau đó burn subtitle mới lên vùng đó
 * @param {string} videoPath       - Video gốc (đã có hardcoded sub)
 * @param {string} srtPath         - File SRT mới
 * @param {string} outputPath      - Output path
 * @param {number} [coverRatio]    - Tỉ lệ chiều cao vùng che (mặc định 0.15 = 15% dưới cùng)
 * @returns {Promise<string>}
 */
const burnSubtitlesCoveringHardcoded = (videoPath, srtPath, outputPath, coverRatio = DEFAULT_SUBTITLE_COVER_RATIO) => {
  return new Promise((resolve, reject) => {
    // Trước tiên cần lấy resolution để tính vùng che
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(new Error(`Không đọc được metadata: ${err.message}`));

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const width = videoStream?.width || 1920;
      const height = videoStream?.height || 1080;

      // Tính vùng che: che phần dưới cùng (coverRatio * height) pixels
      const coverHeight = Math.round(height * coverRatio);
      const coverY = height - coverHeight;

      const escapedSrt = srtPath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\:');

      // Filter chain:
      // 1. drawbox: vẽ hộp đen mờ che phụ đề cũ
      // 2. subtitles: burn phụ đề mới
      const filterChain = [
        `drawbox=x=0:y=${coverY}:w=${width}:h=${coverHeight}:color=black@0.85:t=fill`,
        `subtitles='${escapedSrt}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`,
      ].join(',');

      console.log(`🔥 FFmpeg: Burn subtitle MỚI + che hardcoded subtitle cũ...`);
      console.log(`   Video size: ${width}x${height} | Che vùng: y=${coverY} h=${coverHeight}px (${Math.round(coverRatio * 100)}%)`);
      console.log(`   Input : ${path.basename(videoPath)}`);
      console.log(`   SRT   : ${path.basename(srtPath)}`);
      console.log(`   Output: ${path.basename(outputPath)}`);

      ffmpeg(videoPath)
        .videoFilter(filterChain)
        .outputOptions([
          '-c:v libx264',
          '-c:a copy',
          '-sn',
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
        ])
        .output(outputPath)
        .on('start', () => console.log('   Bắt đầu render (cover hardcoded + burn mới)...'))
        .on('progress', (p) => {
          if (p.percent) process.stdout.write(`   Render: ${Math.round(p.percent)}%\r`);
        })
        .on('end', () => {
          console.log(`\n✅ FFmpeg: Burn subtitle (cover hardcoded) xong → ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg burnSubtitlesCoveringHardcoded error:', err.message);
          reject(new Error(`FFmpeg burn subtitle thất bại: ${err.message}`));
        })
        .run();
    });
  });
};

/**
 * Burn (hardcode) subtitle SRT vào video → xuất file MP4 mới
 * @param {string} videoPath  - Đường dẫn video gốc
 * @param {string} srtPath    - Đường dẫn file .srt
 * @param {string} outputPath - Đường dẫn file output
 * @returns {Promise<string>} - outputPath khi hoàn tất
 */
const burnSubtitles = (videoPath, srtPath, outputPath) => {
  return new Promise((resolve, reject) => {
    // FFmpeg trên Windows cần escape dấu ":" và "\" trong đường dẫn
    const escapedSrt = srtPath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');

    console.log(`🔥 FFmpeg: Đang burn subtitle vào video...`);
    console.log(`   Input : ${path.basename(videoPath)}`);
    console.log(`   SRT   : ${path.basename(srtPath)}`);
    console.log(`   Output: ${path.basename(outputPath)}`);

    ffmpeg(videoPath)
      .videoFilter(`subtitles='${escapedSrt}':force_style='FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2'`)
      .outputOptions([
        '-c:v libx264',   // Re-encode video để burn subtitle
        '-c:a copy',      // Copy audio nguyên vẹn
        '-preset fast',   // Tốc độ encode nhanh
        '-crf 23',        // Chất lượng tốt (0-51, càng nhỏ càng tốt)
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', () => console.log('   Bắt đầu render...'))
      .on('progress', (p) => {
        if (p.percent) process.stdout.write(`   Render: ${Math.round(p.percent)}%\r`);
      })
      .on('end', () => {
        console.log(`\n✅ FFmpeg: Burn subtitle xong → ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg burnSubtitles error:', err.message);
        reject(new Error(`FFmpeg burn subtitle thất bại: ${err.message}`));
      })
      .run();
  });
};

/**
 * Chụp thumbnail từ video tại một thời điểm cụ thể
 * @param {string} videoPath  - Đường dẫn video gốc
 * @param {string} outputDir  - Thư mục lưu thumbnail
 * @param {string} baseName   - Tên file (không extension)
 * @param {number} [atSecond] - Giây cần chụp (mặc định tự tính 10% duration)
 * @returns {Promise<string>} - Đường dẫn file .jpg đã tạo
 */
const generateThumbnail = (videoPath, outputDir, baseName, atSecond = null) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const thumbPath = path.join(outputDir, `${baseName}.jpg`);

    const doCapture = (seekSecond) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [seekSecond],
          filename: `${baseName}.jpg`,
          folder: outputDir,
          size: '480x270',   // 16:9 thumbnail nhỏ gọn
        })
        .on('end', () => {
          console.log(`🖼️  Thumbnail: ${thumbPath}`);
          resolve(thumbPath);
        })
        .on('error', (err) => {
          console.warn(`⚠️  Thumbnail thất bại: ${err.message}`);
          reject(new Error(`generateThumbnail thất bại: ${err.message}`));
        });
    };

    if (atSecond !== null) {
      doCapture(Math.max(atSecond, 1));
    } else {
      // Tự lấy duration rồi chụp tại 10%
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        const duration = metadata?.format?.duration || 30;
        const seekAt = Math.max(Math.floor(duration * 0.1), 1);
        doCapture(seekAt);
      });
    }
  });
};

module.exports = {
  extractAudio,
  getVideoMetadata,
  detectSubtitleStreams,
  generateThumbnail,
  burnSubtitles,
  burnSubtitlesRemovingSoft,
  burnSubtitlesCoveringHardcoded,
};
