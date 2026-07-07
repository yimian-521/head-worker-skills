// file-head/guard.js — GUARD 哨卫：监控文件变化
// 角色不塌缩：只观察不修改，只报告不阻止
// 原型：门卫——谁进来登记一下，不拦人
const fs = require('fs');
const path = require('path');

class Guard {
  constructor() { this.watchers = new Map(); }

  /** 开始监控目录 */
  watch(dirPath, onChange) {
    const abs = path.resolve(dirPath);
    if (!fs.existsSync(abs)) return { error: '目录不存在' };

    try {
      const watcher = fs.watch(abs, { recursive: true }, (eventType, filename) => {
        if (filename) {
          const full = path.join(abs, filename);
          try {
            const stat = fs.statSync(full);
            onChange({ type: eventType, file: full, size: stat.size, time: new Date().toISOString() });
          } catch (e) {
            // 文件可能被瞬间删除
            onChange({ type: 'delete', file: full, time: new Date().toISOString() });
          }
        }
      });
      this.watchers.set(abs, watcher);
      return { watching: abs, ok: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  /** 停止监控 */
  unwatch(dirPath) {
    const abs = path.resolve(dirPath);
    const w = this.watchers.get(abs);
    if (w) { w.close(); this.watchers.delete(abs); return { ok: true }; }
    return { error: '未在监控' };
  }

  /** 停止所有监控 */
  unwatchAll() {
    for (const [dir, w] of this.watchers) { w.close(); }
    this.watchers.clear();
    return { ok: true, count: this.watchers.size };
  }
}

module.exports = { Guard };