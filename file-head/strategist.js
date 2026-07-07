// file-head/strategist.js — STRATEGIST 军师：分析索引给策略
// 角色不塌缩：只分析不给数值，纯信息调度
// 原型：老参谋看地图→给出作战建议→不亲自开枪

class Strategist {
  /** 分析文件结构 → 给摘要 */
  summarize(fileData) {
    if (!fileData || !fileData.structure) return { error: '文件未索引，请先用 SCOUT 扫描' };
    const { lineCount, size, pages, structure } = fileData;
    const decls = structure.filter(s => s.type === 'decl');
    const blocks = structure.filter(s => s.type === 'block');
    const largestBlock = blocks.length > 0 ?
      blocks.reduce((a, b) => a.lines > b.lines ? a : b) : null;

    return {
      lineCount, sizeKB: (size / 1024).toFixed(1), pages,
      functionCount: decls.filter(d => d.kind === 'function' || d.kind === 'arrow' || d.kind === 'method').length,
      classCount: decls.filter(d => d.kind === 'class').length,
      largestBlock: largestBlock ? { start: largestBlock.start, end: largestBlock.end, lines: largestBlock.lines } : null,
      topFunctions: decls.slice(0, 10).map(d => `  L${d.line}: ${d.kind} ${d.name}()`),
      recommendation: this._recommend(lineCount, decls.length, blocks.length)
    };
  }

  /** 根据文件特征给阅读建议 */
  _recommend(lineCount, declCount, blockCount) {
    if (lineCount <= 100) return { mode: 'full', reason: '文件短小，建议全量阅读' };
    if (declCount >= 20 || blockCount >= 10) return { mode: 'index', reason: '结构复杂，建议先看目录/索引' };
    if (lineCount > 500) return { mode: 'page', reason: `文件较长(${lineCount}行)，建议分页阅读` };
    return { mode: 'full', reason: '结构简单，全量阅读没问题' };
  }

  /** 分析目录结构 → 给处理策略 */
  analyzeDir(dirData) {
    if (!dirData || !dirData.files) return { error: '目录未索引' };
    const { base, fileCount, files } = dirData;
    const byExt = {};
    let totalSize = 0, totalLines = 0;
    for (const f of files) {
      byExt[f.ext] = (byExt[f.ext] || 0) + 1;
      totalSize += f.size;
      totalLines += f.lineCount;
    }
    return {
      base, fileCount, totalSizeKB: (totalSize / 1024).toFixed(1), totalLines,
      byExtension: byExt,
      largestFiles: files.sort((a, b) => b.lineCount - a.lineCount).slice(0, 5).map(f => `  ${f.path} (${f.lineCount}行)`),
      recommendation: fileCount > 100 ? '文件多，建议分批次处理' : '规模适中，可一次性处理'
    };
  }
}

module.exports = { Strategist };