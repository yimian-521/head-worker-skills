// file-head/index.js — 有头文件操作沙盒 v0.1.0
// 五军：SCOUT侦察 + STRATEGIST军师 + BURST爆裂 + GUARD哨卫 + LIGHTNING闪电
// 看书模式：全量/分页/索引 一键切换
// 零依赖：Node.js标准库
// 原型：把kotlin-head的军队模型搬到文件操作——每个角色只管一件事，不等不卡
const fs = require('fs');
const path = require('path');
const { Scout } = require('./scout');
const { Strategist } = require('./strategist');
const { Burst } = require('./burst');
const { Guard } = require('./guard');
const { Lightning } = require('./lightning');

class FileHead {
  constructor() {
    this.scout = new Scout();
    this.strategist = new Strategist();
    this.burst = new Burst();
    this.guard = new Guard();
    this.lightning = new Lightning(this.scout, this.burst);

    // 当前状态
    this.currentFile = null;      // SCOUT扫描后的文件数据
    this.currentDir = null;       // SCOUT扫描后的目录数据
    this.currentPage = 1;         // 分页模式当前页
    this.viewMode = 'index';      // full | page | index
    this.cwd = process.cwd();

    // HED按钮
    this.menu = {
      '1': { label: '📂 浏览目录', fn: () => this.browseDir(this.cwd) },
      '2': { label: '📄 打开文件', fn: () => this.openFile() },
      '3': { label: '🔍 军师摘要', fn: () => this.showSummary() },
      '4': { label: '📖 分页翻书', fn: () => this.pageView() },
      '5': { label: '📋 全量显示', fn: () => this.fullView() },
      '6': { label: '📑 结构索引', fn: () => this.indexView() },
      '7': { label: '🔎 搜索内容', fn: () => this.search() },
      '8': { label: '👁 哨卫监控', fn: () => this.toggleWatch() },
      '9': { label: '⚙ 切换目录', fn: () => this.changeDir() },
      '0': { label: '❌ 退出', fn: () => this.exit() },
    };
    this.watching = false;
  }

  /** 主入口 */
  start(args) {
    if (args.length > 0) {
      const target = path.resolve(args[0]);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        this.cwd = target;
      } else if (fs.existsSync(target)) {
        return this._quickOpen(target);
      }
    }
    this._showMenu();
  }

  /** HED菜单 */
  _showMenu() {
    let out = `\n🧠 file-head v0.1.0 | ${this.cwd}\n`;
    out += '─'.repeat(50) + '\n';
    for (const [k, v] of Object.entries(this.menu)) {
      out += `  [${k}] ${v.label}\n`;
    }
    out += '─'.repeat(50);
    return out;
  }

  // ─── 按钮实现 ───

  /** [1] 浏览目录 */
  browseDir(dir) {
    const abs = path.resolve(dir);
    this.currentDir = this.scout.scanDir(abs);
    if (this.currentDir.error) return this.currentDir.error;

    const analysis = this.strategist.analyzeDir(this.currentDir);
    let out = `\n📂 ${abs}\n`;
    out += `   文件数: ${this.currentDir.fileCount} | 总大小: ${analysis.totalSizeKB}KB | 总行: ${analysis.totalLines}\n`;
    out += `   军师建议: ${analysis.recommendation}\n`;
    out += `   类型分布: ${JSON.stringify(analysis.byExtension)}\n`;
    out += `   最大文件:\n${analysis.largestFiles.join('\n')}\n\n`;
    out += `   文件列表:\n`;
    for (const f of this.currentDir.files.slice(0, 30)) {
      out += `     ${f.path} (${f.lineCount}行, ${(f.size/1024).toFixed(1)}KB)\n`;
    }
    if (this.currentDir.files.length > 30) out += `     ... 还有 ${this.currentDir.files.length - 30} 个文件\n`;
    return out;
  }

  /** [2] 打开文件 */
  openFile(filePath) {
    if (!filePath && this.currentFile) filePath = this.currentFile.path;
    if (!filePath) return '⚠ 请指定文件路径: openFile("/path/to/file")';
    // 简化版：走 SCOUT扫描建索引
    this.currentFile = this.scout.scanFile(filePath);
    if (this.currentFile.error) return this.currentFile.error;
    const summary = this.strategist.summarize(this.currentFile);
    this.currentPage = 1;
    this.viewMode = summary.recommendation.mode;
    return `✅ 已打开: ${filePath}\n   行数: ${summary.lineCount} | 函数: ${summary.functionCount} | 建议: ${summary.recommendation.mode}\n   军师说: ${summary.recommendation.reason}`;
  }

  /** 快速打开（命令行直接传文件） */
  _quickOpen(filePath) {
    const result = this.openFile(filePath);
    if (result.startsWith('✅')) {
      return result + '\n\n' + this.fullView();
    }
    return result;
  }

  /** [3] 军师摘要 */
  showSummary() {
    if (!this.currentFile) return '⚠ 请先打开文件 [2]';
    const s = this.strategist.summarize(this.currentFile);
    let out = `\n🧠 军师摘要\n`;
    out += `   行数: ${s.lineCount} | 大小: ${s.sizeKB}KB | 页数: ${s.pages}\n`;
    out += `   函数数: ${s.functionCount} | 类数: ${s.classCount}\n`;
    if (s.largestBlock) out += `   最大块: L${s.largestBlock.start}-L${s.largestBlock.end} (${s.largestBlock.lines}行)\n`;
    out += `   建议: [${s.recommendation.mode}] ${s.recommendation.reason}\n`;
    out += `   主要函数:\n${s.topFunctions.join('\n')}`;
    return out;
  }

  /** [4] 分页翻书 */
  pageView(pageNum) {
    if (!this.currentFile) return '⚠ 请先打开文件 [2]';
    const pn = pageNum || this.currentPage;
    this.currentPage = pn;
    this.viewMode = 'page';
    const page = this.scout.getPage(this.currentFile, pn);
    if (page.error) return page.error;
    return `\n📖 第 ${page.page}/${page.totalPages} 页 (L${page.start}-L${page.end})\n${'─'.repeat(40)}\n${page.content}\n${'─'.repeat(40)}\n  [N]下一页 [P]上一页 [J]跳转 [I]索引 [F]全量`;
  }

  /** [5] 全量显示 */
  fullView() {
    if (!this.currentFile) return '⚠ 请先打开文件 [2]';
    this.viewMode = 'full';
    return `\n📋 全量 (${this.currentFile.lineCount}行)\n${'─'.repeat(40)}\n${this.currentFile.content}\n${'─'.repeat(40)}`;
  }

  /** [6] 结构索引 */
  indexView() {
    if (!this.currentFile) return '⚠ 请先打开文件 [2]';
    this.viewMode = 'index';
    let out = `\n📑 结构索引 (${this.currentFile.structure.length}个节点)\n`;
    for (const s of this.currentFile.structure) {
      if (s.type === 'decl') out += `  L${s.line}: ${s.kind} ${s.name}()\n`;
      else out += `  L${s.start}-L${s.end}: block (${s.lines}行)\n`;
    }
    out += `\n  点击行号跳转到对应位置`;
    return out;
  }

  /** [7] 搜索 */
  search(pattern, fp) {
    const filePath = fp || (this.currentFile ? this.currentFile.path : null);
    if (!filePath) return '⚠ 请指定文件';
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let out = `\n🔎 搜索 "${pattern}" in ${filePath}\n`;
      let found = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
          out += `  L${i+1}: ${lines[i].trim().substring(0, 80)}\n`;
          found++;
          if (found >= 20) { out += `  ... 还有更多结果\n`; break; }
        }
      }
      out += `  共找到 ${found} 处`;
      return out;
    } catch (e) { return `搜索失败: ${e.message}`; }
  }

  /** [8] 哨卫监控 */
  toggleWatch() {
    if (this.watching) {
      this.guard.unwatchAll();
      this.watching = false;
      return '👁 哨卫已撤回';
    }
    const result = this.guard.watch(this.cwd, (event) => {
      console.log(`  👁 ${event.type}: ${event.file}`);
    });
    if (result.ok) { this.watching = true; return `👁 哨卫正在监控: ${this.cwd}`; }
    return `哨卫启动失败: ${result.error}`;
  }

  /** [9] 切换目录 */
  changeDir(newDir) {
    if (!newDir) return `当前目录: ${this.cwd}\n用法: changeDir("/path/to/dir")`;
    const abs = path.resolve(newDir);
    if (!fs.existsSync(abs)) return `目录不存在: ${abs}`;
    this.cwd = abs;
    return `✅ 已切换: ${abs}\n` + this.browseDir(abs);
  }

  /** [0] 退出 */
  exit() {
    if (this.watching) this.guard.unwatchAll();
    return '👋 file-head 已退出';
  }

  /** 对AI调用的快捷接口——直接给结果不弹菜单 */
  exec(command, ...args) {
    if (command === 'menu' || command === 'm') return this._showMenu();
    if (command === 'dir' || command === 'd') return this.browseDir(args[0] || this.cwd);
    if (command === 'open' || command === 'o') return this.openFile(args[0]);
    if (command === 'summary' || command === 's') return this.showSummary();
    if (command === 'page' || command === 'p') return this.pageView(parseInt(args[0]) || 1);
    if (command === 'full' || command === 'f') return this.fullView();
    if (command === 'index' || command === 'i') return this.indexView();
    if (command === 'search' || command === 'g') return this.search(args[0], args[1]);
    if (command === 'scan' || command === 'sc') {
      // 扫描目录 + 军师分析 = 一键备菜
      const d = this.browseDir(args[0] || this.cwd);
      return d;
    }
    if (command === 'read' || command === 'r') {
      // 自动选最优模式：小文件全量，大文件分页+军师摘要
      const fp = args[0];
      this.openFile(fp);
      const s = this.strategist.summarize(this.currentFile);
      if (s.recommendation.mode === 'full') return this.fullView();
      return this.showSummary() + '\n\n' + this.pageView(1) + '\n\n💡 军师建议分页阅读，输入 page(2) 翻下一页';
    }
    return `未知命令: ${command}\n可用: menu|dir|open|summary|page|full|index|search|scan|read`;
  }
}

// 直接运行时
const fh = new FileHead();
if (require.main === module) {
  console.log(fh.start(process.argv.slice(2)));
}

module.exports = { FileHead };