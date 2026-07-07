// file-head/lightning.js — LIGHTNING 闪电：动态分配任务给最快通道
// 角色不塌缩：只分配不执行，不读写文件
// 原型：地震救援队——哪栋楼人最多先去哪，救完立刻转场

class Lightning {
  constructor(scout, burst) {
    this.scout = scout;
    this.burst = burst;
  }

  /** 动态分配文件读取——按文件大小选轻量/重量通道 */
  distributeRead(filePaths) {
    const small = [];  // < 10KB → 直接读（轻量通道）
    const large = [];  // >= 10KB → 先建索引再按需取（重量通道）
    const missing = [];

    for (const fp of filePaths) {
      try {
        const stat = require('fs').statSync(fp);
        if (stat.size < 10240) small.push(fp);
        else large.push(fp);
      } catch (e) {
        missing.push(fp);
      }
    }

    // 小文件走 BURST 批量读
    const smallResults = small.length > 0 ? this.burst.readBatch(small) : { results: [] };
    // 大文件走 SCOUT 建索引
    const largeResults = large.map(fp => this.scout.scanFile(fp));

    return {
      small: smallResults, large: largeResults, missing,
      summary: `⚡ 闪电分配: ${small.length}个小文件(直接读) + ${large.length}个大文件(索引) + ${missing.length}个缺失`
    };
  }

  /** 自适应权重：小文件多→BURST优先，大文件多→SCOUT优先 */
  weight(filePaths) {
    let small = 0, large = 0;
    for (const fp of filePaths) {
      try { require('fs').statSync(fp).size < 10240 ? small++ : large++; } catch (e) { }
    }
    return { small, large, strategy: small > large ? 'BURST优先' : 'SCOUT优先' };
  }
}

module.exports = { Lightning };