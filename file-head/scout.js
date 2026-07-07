// file-head/scout.js — SCOUT 侦察：扫描目录/文件建索引
// 角色不塌缩：只扫描不读写，不执行任何修改
const fs = require('fs');
const path = require('path');

class Scout {
  constructor() { this.fileIndex = new Map(); this.pageSize = 50; }

  /** 扫描目录，建文件索引 */
  scanDir(dirPath) {
    this.fileIndex.clear();
    const base = path.resolve(dirPath);
    if (!fs.existsSync(base)) return { error: `目录不存在: ${base}` };

    this._walk(base, base);
    return {
      base,
      fileCount: this.fileIndex.size,
      files: Array.from(this.fileIndex.values()).map(f => ({
        path: f.path, size: f.size, ext: f.ext, lineCount: f.lineCount
      }))
    };
  }

  /** 递归遍历 */
  _walk(base, current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) { this._walk(base, full); }
      else { this._indexFile(base, full); }
    }
  }

  /** 索引单个文件 */
  _indexFile(base, fullPath) {
    try {
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(base, fullPath);
      this.fileIndex.set(relPath, {
        path: fullPath, relPath, size: stat.size,
        ext: path.extname(fullPath), lineCount: lines.length,
        content, lines
      });
    } catch (e) { /* 跳过不可读文件 */ }
  }

  /** 扫描单个文件，建页索引+结构索引 */
  scanFile(filePath) {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) return { error: `文件不存在: ${abs}` };
    try {
      const content = fs.readFileSync(abs, 'utf-8');
      const lines = content.split('\n');
      const structure = this._scanStructure(lines);
      const pageIndex = this._buildPageIndex(lines.length);
      return {
        path: abs, lineCount: lines.length,
        size: fs.statSync(abs).size, pages: Math.ceil(lines.length / this.pageSize),
        structure, pageIndex, content, lines
      };
    } catch (e) { return { error: `无法读取: ${e.message}` }; }
  }

  /** 建结构索引——扫描函数/类/大括号块边界 */
  _scanStructure(lines) {
    const structure = [];
    let braceDepth = 0, inBlock = false, blockStart = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 检测函数/类声明
      const funcMatch = line.match(/^(async\s+)?(function|class)\s+(\w+)/);
      const arrowMatch = line.match(/^(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(/);
      const methodMatch = line.match(/^\s*(\w+)\s*\([^)]*\)\s*\{/);
      if (funcMatch) {
        structure.push({ type: 'decl', name: funcMatch[3] || 'anonymous', line: i + 1, kind: funcMatch[2] });
      } else if (arrowMatch) {
        structure.push({ type: 'decl', name: arrowMatch[2], line: i + 1, kind: 'arrow' });
      } else if (methodMatch && !line.startsWith('if') && !line.startsWith('for') && !line.startsWith('while')) {
        structure.push({ type: 'decl', name: methodMatch[1], line: i + 1, kind: 'method' });
      }
      // 跟踪大括号深度
      for (const ch of line) {
        if (ch === '{') {
          if (braceDepth === 0) { blockStart = i; inBlock = true; }
          braceDepth++;
        } else if (ch === '}') {
          braceDepth--;
          if (braceDepth === 0 && inBlock && i - blockStart > 10) {
            structure.push({ type: 'block', start: blockStart + 1, end: i + 1, lines: i - blockStart + 1 });
            inBlock = false;
          }
        }
      }
    }
    return structure;
  }

  /** 建分页索引——每 pageSize 行一个断点 */
  _buildPageIndex(totalLines) {
    const pages = [];
    for (let i = 0; i < totalLines; i += this.pageSize) {
      pages.push({ page: Math.floor(i / this.pageSize) + 1, start: i + 1, end: Math.min(i + this.pageSize, totalLines) });
    }
    return pages;
  }

  /** 按页码取内容（从索引读取，200ns级） */
  getPage(fileData, pageNum) {
    if (!fileData || !fileData.lines) return { error: '文件未索引' };
    const page = fileData.pageIndex.find(p => p.page === pageNum);
    if (!page) return { error: `页码超出范围 (1-${fileData.pageIndex.length})` };
    return {
      page: pageNum, totalPages: fileData.pageIndex.length,
      start: page.start, end: page.end,
      content: fileData.lines.slice(page.start - 1, page.end).join('\n')
    };
  }
}

module.exports = { Scout };