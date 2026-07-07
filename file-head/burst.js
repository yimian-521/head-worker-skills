// file-head/burst.js — BURST 爆裂：批量读写，适合大量小文件
// 角色不塌缩：只做批量IO，不建索引不分析
// 原型：搬运工——一车拉十个箱子，不管里面装什么
const fs = require('fs');
const path = require('path');

class Burst {
  /** 批量读取多个文件 */
  readBatch(filePaths) {
    const results = [];
    for (const fp of filePaths) {
      try {
        const content = fs.readFileSync(fp, 'utf-8');
        results.push({ path: fp, ok: true, size: content.length, content });
      } catch (e) {
        results.push({ path: fp, ok: false, error: e.message });
      }
    }
    return { total: filePaths.length, ok: results.filter(r => r.ok).length, results };
  }

  /** 批量写入（每个文件独立写入） */
  writeBatch(writes) {
    // writes: [{path, content}, ...]
    const results = [];
    for (const w of writes) {
      try {
        fs.mkdirSync(path.dirname(w.path), { recursive: true });
        fs.writeFileSync(w.path, w.content, 'utf-8');
        results.push({ path: w.path, ok: true });
      } catch (e) {
        results.push({ path: w.path, ok: false, error: e.message });
      }
    }
    return { total: writes.length, ok: results.filter(r => r.ok).length, results };
  }

  /** 批量替换——grep搜索+替换 */
  replaceInFiles(dirPath, pattern, replacement) {
    // ...暂空，等 SCOUT扫描后用索引加速
  }

  /** 批量复制 */
  copyBatch(copies) {
    // copies: [{src, dest}, ...]
    const results = [];
    for (const c of copies) {
      try {
        fs.mkdirSync(path.dirname(c.dest), { recursive: true });
        fs.copyFileSync(c.src, c.dest);
        results.push({ src: c.src, dest: c.dest, ok: true });
      } catch (e) {
        results.push({ src: c.src, dest: c.dest, ok: false, error: e.message });
      }
    }
    return { total: copies.length, ok: results.filter(r => r.ok).length, results };
  }
}

module.exports = { Burst };