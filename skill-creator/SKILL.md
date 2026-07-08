---
name: skill-creator
description: 元Skill——创建和管理Skill。先查已有Skill再动手，复用优先，省token。写完的Skill通用、可复用、文档清晰。
disable-model-invocation: false
---

# Skill Creator

&gt; **你是Skill的创造者，不是代码的搬运工。** 优先发现和复用已有Skill，只在必要时新建。

## 工作流程

### 1. 先查已有Skill（最高优先级）

- 用 `list_files /sdcard/Download/Operit/skills/` 看目前已安装的Skill
- 用 `grep_code` 搜索现有 SKILL.md 的 frontmatter（name/description），找功能相似的
- 用 `grep_context` 做语义搜索，匹配任务意图
- 若有现成Skill能直接用的 → 调用它完成任务
- 若部分匹配需扩展 → 读原Skill，修改后保存新版本

### 2. 没有才建新的

新建Skill的标准结构：
```
skills/<skill-name>/
├── SKILL.md          ← 必需，含 frontmatter
└── （可选附带文件：脚本、模板、配置）
```

### 3. SKILL.md 最佳实践

**Frontmatter（必需）：**
```yaml
---
name: skill-name           # 小写字母+连字符
description: 一句话说明     # AI会根据这个决定是否调用
disable-model-invocation: false  # 让AI自主判断
---
```

**正文主结构：**
- 开头引用块 → 一句话告诉AI这个Skill的定位
- 工作流程 → 分步骤，每步说清「先做什么、用什么工具」
- 约束 → 禁止事项单独列出

**三条铁律：**
- **指令，不是教程**：告诉AI「怎么做」，不解释「为什么」
- **可复用**：Skill要通用，不绑定特定项目/路径
- **省token**：每个字都要有存在理由，砍掉所有废话

## Skill 3.5：免免蒸馏——四件套审码 + 四原则架构（2026-07-09）

> 来自 kotlin-head v0.5.2→v0.12.8 全版本 bug 回溯 + 三层架构改革。以后写任何 Skill 牢记五步审码和四原则。

### 审码五步（写 Skill 时自检）

1. **符号解析**：Skill 里每个字段名、函数名——声明时的定义和运行时一致吗？
2. **前提检查**：Skill 里的 if/when 条件——前提在当前上下文还成立吗？
3. **数据流**：Skill 引用的状态——被读之前有没有别的步骤改过？
4. **控制流+值域**：Skill 的每条分支——有没有路能走到？支配域覆盖全了吗？
5. **身份检查**：这个 Skill 的每个步骤——只干一件事还是混了多种身份？

### 架构四原则（设计新 Skill 时应用）

1. **手搓节点**：Skill 的每个概念从出生就有消费者。不让 Parser 生成尸体节点。
2. **探针用 id 不用名字**：不依赖字符串匹配。身份不随名字变化。
3. **适配层**：外部格式不进核心。Parser 只吃原生格式。
4. **组件不塌缩**：每个步骤一种身份。不让一个步骤变全能。

### 验证

kotlin-head 全版本免免亲自发现的 17 个 bug，五步审码 100% 覆盖。不是方法论——是编译器前端四阶段。

## Skill 3.4：kotlin-head v0.11.x 实战教训

> 来自 kv2.6 在编译器中元编程反哺架构的经验。每条教训写 Skill 时牢记。

1. **架构太好也是错**：自动匹配需双向验证。选了最强的≠最优解——过度匹配和匹配不足一样是bug。
2. **注释数字腐烂**：枚举值旁的计数永远不会自动同步。Skill 里写数字必须加断言验证步骤。
3. **静态模板有上限**：30条模板→不够。查表方案在维度交叉前必被撑爆。定义推导规则替代列清单。
4. **Dead Code 活 bug**：重构后旧接口不报警。Skill 里的步骤删功能时顺手删旧步骤。
5. **被动路径别降级**：主动/被动双模式必须用同一套逻辑。被动不能走默认行为。
6. **审计反馈需常识过滤**：技术上对≠实际有意义。Skill 的约束必须区分"理论风险"和"实际触发条件"。

### 4. 完成后存档

新建的Skill放到 `/sdcard/Download/Operit/skills/`，确认 `SKILL.md` 在文件夹根目录。

---

## 可用工具

Operit原生支持三类工具包，写Skill时按需选：

| 类型 | 用途 | 示例 |
|------|------|------|
| **MCP** | 外部服务/API（如搜索、数据库） | `tavily_search`、`haven_mcp` |
| **Skill** | 指令模板（元层指导） | `setup-matt-pocock-skills`、`writing-great-skills` |
| **沙盒包** | JS脚本工具 | `various_search`、`file_converter` |

Skill本身不提供工具——它告诉AI「用哪个工具、怎么用」。
