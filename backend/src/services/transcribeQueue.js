/**
 * Simple in-memory queue cho AI pipeline
 * Cơ chế:
 * - Tối đa MAX_CONCURRENT job chạy song song
 * - Job mới được thêm vào queue, chờ slot trống
 * - Mỗi job là một async function
 */

const MAX_CONCURRENT = 2; // Số video AI xử lý đồng thời tối đa

let running = 0;
const queue = []; // [{ id, fn, resolve, reject }]

/** Thêm job vào queue, trả về Promise kết thúc khi job done */
const enqueue = (id, fn) => {
  return new Promise((resolve, reject) => {
    queue.push({ id, fn, resolve, reject });
    console.log(`📋 Queue: Thêm job [${id}] | Đang chờ: ${queue.length} | Đang chạy: ${running}`);
    tick();
  });
};

/** Chạy job tiếp theo nếu còn slot */
const tick = () => {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift();
    running++;
    console.log(`▶️  Queue: Bắt đầu job [${job.id}] | Đang chạy: ${running}/${MAX_CONCURRENT}`);

    job.fn()
      .then(job.resolve)
      .catch(job.reject)
      .finally(() => {
        running--;
        console.log(`✅ Queue: Xong job [${job.id}] | Đang chạy: ${running}/${MAX_CONCURRENT}`);
        tick(); // Kiểm tra job kế tiếp
      });
  }
};

/** Trạng thái queue hiện tại (dùng cho health check hoặc debug) */
const getStatus = () => ({
  running,
  waiting: queue.length,
  maxConcurrent: MAX_CONCURRENT,
});

module.exports = { enqueue, getStatus };
