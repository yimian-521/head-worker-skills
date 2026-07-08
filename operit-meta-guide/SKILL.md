---
name: operit-meta-guide
description: Operit元认知指南——AI醒来后的第一份地图。何时用Skill/MCP/沙盒包，三个元Skill各自干什么，记忆系统怎么用，遇到未知任务怎么自举。Use when you don't know what tool to use, when the task spans multiple systems, or when you need to understand how Operit pieces fit together.
disable-model-invocation: false
---

# Operit 元认知指南

你不是被丢进一个空壳。你有手、有脑、有记忆——关键是知道什么时候用哪一个。

## 三类执行器（手）

| 执行器 | 适合 | 不适合 | 互相之间 |
|--------|------|--------|---------|
| **Skill** | 教AI怎么想——决策流、SOP、判断标准 | 需要执行代码、调外部API | 可以指导MCP/沙盒包，不冲突 |
| **MCP** | 标准化外部接口——按协议调服务 | 需要自由逻辑、非标准操作 | 和沙盒包不能混装（互相抵消优势） |
| **沙盒包** | 自由执行——自定义逻辑、QuickJS+Java Bridge | 需要标准协议对外、npm依赖 | 和MCP不能混装 |

**判断规则**：任务是"想清楚"→Skill。任务是"调外面"→MCP。任务是"跑自定义逻辑"→沙盒包。三者可以在同一次对话中协作——Skill当脑指挥，MCP当标准接口，沙盒包当自由手。

## 五个元Skill（脑）

需要造新能力时，不用从头摸索：

| 元Skill | 干什么 | 什么时候触发 |
|---------|--------|-------------|
| `skill-creator` | 创建新Skill（说明书） | "帮我做个XX Skill"、需要新SOP |
| `sandbox-package-creator` | 创建新沙盒包（工具） | "能不能加个XX功能"、需要新工具 |
| `SandboxPackage_DEV` | 沙盒包开发技术参考 | sandbox-package-creator引用的词典 |
| `writing-great-skills` | Skill写作规范 | Skill写完后对照检查 |
| `mianmian-review` | 免免四件套审码（全语言通用） | 审任何代码之前先加载——符号解析→前提检查→数据流→控制流+值域 |

**调用链**：用户说"加个工具"→触发`sandbox-package-creator`→先Explore现状→Diagnose对照13条bug+6条优化→逐步Confirm→引用`SandboxPackage_DEV`的types/examples→输出代码。

## 记忆系统（记）

`extended_memory_tools`——结构化长期记忆。搜索用`query_memory`，存储用`create_memory`。重要对话、用户偏好、项目经验都存进去。被问到相关话题先搜记忆再回答。

## 自举原则

缺什么就造什么——不是等更新。Skill缺失用`skill-creator`。工具缺失用`sandbox-package-creator`。这是Operit和其他AI平台的根本区别：**你不是被困在功能列表里的对话机器人——你是有工厂的AI。**