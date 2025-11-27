const fs = require('fs');
const path = require('path');

module.exports = function autoload(app) {
  const folder = path.join(__dirname, '../sys_file');

  function loadAll(trigger = 'manual') {
    console.log('==========================');
    console.log(`[AUTOLOAD] Bắt đầu scan (${trigger}) lúc:`, new Date().toISOString());
    console.log('[AUTOLOAD] Thư mục:', folder);

    let files;

    try {
      files = fs.readdirSync(folder, { recursive: true });
      console.log(`[AUTOLOAD] Tổng số item đọc được: ${files.length}`);
    } catch (err) {
      console.log('[AUTOLOAD ERROR] Không đọc được thư mục:', err.message);
      return;
    }

    files.forEach((file, index) => {
      console.log('--------------------------');
      console.log(`[AUTOLOAD] [${index + 1}/${files.length}] Kiểm tra: ${file}`);

      if (!file.endsWith('.js')) {
        console.log(`[AUTOLOAD] Bỏ qua (không phải .js): ${file}`);
        return;
      }

      const fullPath = path.join(folder, file);
      console.log('[AUTOLOAD] -> File JS target:', fullPath);

      try {
        // resolve & clear cache
        const resolved = require.resolve(fullPath);
        if (require.cache[resolved]) {
          console.log('[AUTOLOAD] Xóa cache require:', resolved);
          delete require.cache[resolved];
        } else {
          console.log('[AUTOLOAD] Không có cache cho:', resolved);
        }

        console.log('[AUTOLOAD] Require module...');
        const mod = require(fullPath);
        console.log(`[AUTOLOAD] Require OK: ${file} (typeof = ${typeof mod})`);

        if (typeof mod === 'function') {
          console.log('[AUTOLOAD] Gọi hàm export mặc định của module...');
          mod(app);
          console.log('[AUTOLOAD] Gọi hàm xong cho:', file);
        } else {
          console.log('[AUTOLOAD] Không gọi được (module không phải function), skip:', file);
        }
      } catch (err) {
        console.log('[AUTOLOAD ERROR] Lỗi ở file:', file);
        console.log('[AUTOLOAD ERROR] Chi tiết:', err.stack || err.message);
      }
    });

    console.log(`[AUTOLOAD] Kết thúc scan (${trigger})`);
    console.log('==========================\n');
  }

  // log khi khởi tạo
  console.log('==========================');
  console.log('[AUTOLOAD] Khởi tạo autoload...');
  console.log('[AUTOLOAD] Folder target:', folder);
  console.log('==========================\n');

  // load ngay khi khởi động
  loadAll('startup');

  // load lại khi có file mới hoặc file thay đổi
  fs.watch(folder, { recursive: true }, (eventType, filename) => {
    console.log('==========================');
    console.log('[AUTOLOAD] fs.watch event nhận được:');
    console.log('[AUTOLOAD] eventType:', eventType);
    console.log('[AUTOLOAD] filename:', filename);
    console.log('==========================\n');

    loadAll('fs.watch');
  });
};
