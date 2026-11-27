# 动画规格说明：LeetCode 309

## 1. 本题结构与焦点

| 项目 | 内容 |
| --- | --- |
| 主数据结构 | 价格数组 `[1,2,3,0,2]`，价格 ID=`price-day` |
| 辅助结构 | 每日三状态：持股 `hold`、今天卖出 `sold`、空仓 `rest` |
| 标量 | 天数、今日价格、每日三状态利润、最高空仓利润 |
| 焦点 | 每个转移帧唯一 `current` 为当日目标状态；其前驱状态最多两个 `compare` |
| 帧数 | 1 帧初始化 + 4 天 × 3 个单独状态更新 + 1 帧最终取值，共 14 帧 |

## 2. 步骤规划与稳定布局

状态节点按日期留在画布上，x=`150+215*day`；价格轨道 y=110，hold/sold/rest 三泳道分别 y=285/455/625。状态 ID=`hold-day`、`sold-day`、`rest-day`，位置由日期与状态决定，不随步骤重排。已完成的当日状态留在同列，后续帧继续显示作为记忆轨迹。

| operation | 焦点/来源 | 画面讲解 | 代码锚点 |
|---|---|---|---|
| init | 第 0 天 rest | 初始空仓 0、买入后 hold=-1、sold 不可达 | init |
| compare（每天三步） | 当日 hold/sold/rest 分开计算；昨天必要前驱为 compare | 一步只更新一种状态；箭头写明昨天日期、来源状态、目标状态；之前算出的同日状态继续留在画面 | transition |
| return | 最终 sold 与 rest | 并列末日卖出/休息利润；说明不能带持仓作为最终已实现利润 | return |

转移定义：`hold[d]=max(hold[d-1], rest[d-1]-price[d])`；`sold[d]=hold[d-1]+price[d]`；`rest[d]=max(rest[d-1], sold[d-1])`。冷冻期通过不生成 `sold[d-1] → hold[d]` 入边体现；第 3 天价格为 0，明确展示昨天 sold=2 被排除，hold 只从昨天 rest=1 转移。

## 3. 运动、状态图例与教学层

**运动语法：** 使用 `features/animation/motion.ts` 的 `MOTION` token；稳定 ID 的 D3 keyed join；退出统一经 `fadeOutAndRemove`。

**状态图例：** 固定 current/compare/visited/done；除颜色外以操作 badge、节点标签和箭头语义共同区分状态。每步含变量旁注、操作徽标、独立解说与三项快照指标。

**prefers-reduced-motion：** JS 过渡归零、CSS 动效关闭，状态、解说、代码高亮与图例继续更新。

## 4. 辅助结构容器

本题是数组与 DP 状态，不使用栈或队列；容器验收不适用。

## 5. 箭头与标注规范

箭头用“昨天 + 状态 → 今天 + 状态”标出来源和目标；价格轨道单独标今天价格。第 3 天持股帧只画昨天 hold/rest 的有效来源，无卖出来源箭头，并在 narration 中解释冷冻期。最终帧仅把 sold/rest 标 done 并并列显示答案候选。

## 6. 验收

画布优先；在 1920×1080、1366×768 验证空间预算。自动化覆盖步骤解说、稳定 ID、代码 anchor、快捷键、拖动、状态转移和全套 15 个 E2E；人工证据仍需 1x/3x 录屏、相邻步骤截图与 reduced-motion 截图。
