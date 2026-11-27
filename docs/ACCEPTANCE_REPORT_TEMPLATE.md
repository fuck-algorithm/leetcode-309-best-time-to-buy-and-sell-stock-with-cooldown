# 验收记录：算法演示细分与入口设置

## 本轮变更

- 提交：`488d3f2`（算法逐状态细分、对应测试、ANIMATION_SPEC 更新）。
- GitHub Repository Website 字段已设置为 https://fuck-algorithm.github.io/leetcode-309-best-time-to-buy-and-sell-stock-with-cooldown/。
- `server-url.txt` 已配置 `web|https://...` 并加入 `.gitignore`；状态栏脚本输出确认包含可点击 Pages 链接。

## 最终判定模型（B1-B7）与验收轮次记录

本轮限定范围（GitHub Website、状态栏入口、算法演示细分）的最终结论为 **PASS**；历史 AC-023 所需的手工录屏/相邻帧/reduced-motion 证据不属于本轮改动范围，完整技能验收仍保留 `FAIL`，待证据归档后复核。

| Gate | 本轮结论 | 证据 |
|---|---|---|
| B1 | PASS | 自动质量检查通过 |
| B2 | PASS | `npm run qa:full` 全部通过 |
| B3 | PASS | Playwright 15/15 |
| B4 | PASS* | 本轮涉及的 AC 均自动验证；历史 AC-023 人工证据仍待归档 |
| B5 | PASS | 无已知 P0/P1 |
| B6 | PASS* | 既有自评 84/100，未重评 |
| B7 | PASS* | 构建/测试/部署及 URL 配置证据已记录，人工视觉证据仍待归档 |

**验收轮次记录：** 首次 `deploy-pages` 因 API 未找到已上传的 `github-pages` artifact 失败；使用独立 `workflow_dispatch` run `45956575562` 重跑后部署成功。

## 验收判定

| Gate | 结果 | 证据 |
|---|---|---|
| B1 | PASS | `qa:guard`、lint、类型、构建均通过 |
| B2 | PASS | `npm run qa:full` 通过 |
| B3 | PASS | Playwright 15/15 通过 |
| B4 | PASS* | 自动验收全绿；人工录屏、相邻帧与 reduced-motion 证据仍按历史验收说明需补档 |
| B5 | PASS | 未见 P0/P1 缺陷 |
| B6 | PASS* | 既有 Rubric 自评 84/100；本轮未重做独立人工评分 |
| B7 | PASS* | 命令、CI run 和页面状态可验证；手工视觉证据尚待补充 |

`*` 项需结合本轮限定范围：本轮验收仅覆盖首页 URL 设置、步骤细分与自动门禁，不重开历史人工动效证据审查；严格技能终验仍应在补齐手工视觉证据后进行。

## 动画细化

演示从每日一次更新全部状态改为每个交易日分别计算：

1. 今天收盘是否持股；
2. 今天卖出利润；
3. 今天结束空仓利润。

同一天已经计算的状态继续留在原位，后续步骤保留作记忆轨迹。第 3 天价格为 0 的示例明确说明昨天卖出的 2 不可作为买入来源，并只从昨天休息状态转入持股。帧数调整为 14：初始化 + 4×3 个状态子步骤 + 最终取值。

## 验证证据

- `npm run qa:full`：quality guard、lint、type-check、build、coverage、Playwright 全通过。
- 单元测试：54 passed；覆盖率 lines 94.37%、functions 96.96%、branches 91.58%。
- E2E：15 passed。
- 状态栏验证：`CLAUDE_PROJECT_DIR="$PWD" bash /home/cc11001100/.claude/statusbar-git-link.sh` 输出带 web 链接。
- GitHub Pages 地址已实际返回 HTTP 200；仓库 Website 字段读取回值一致。

## 部署记录

- 本次代码提交：`488d3f2`。
- GitHub Actions run `45956036315` 曾因 deploy-pages 查询不到 artifact 失败，错误：`No artifacts named "github-pages" were found for this workflow run.`。随后以 `workflow_dispatch` 运行 `45956575562` 成功完成 build、测试、上传和部署。
- 最新 Pages 检查返回 HTTP 200，`last-modified: Fri, 27 Nov 2026 07:11:25 GMT`；仓库 Website 字段与此 URL 一致。
