import type { AlgorithmStep, CanvasNode } from '../../types';

const PRICES = [1, 2, 3, 0, 2];
const X = PRICES.map((_, index) => 150 + index * 220);
const ROWS = { price: 135, hold: 295, sold: 455, rest: 615 } as const;
type State = { hold: number; sold: number; rest: number };

function node(id: string, label: string, x: number, y: number, status: CanvasNode['status'], badge?: string): CanvasNode {
  return { id, label, x, y, status, badge, radius: 29 };
}

export function buildSampleSteps(solution: 'dp' | 'states' = 'dp'): AlgorithmStep[] {
  const dp: State[] = [{ hold: -1, sold: Number.NEGATIVE_INFINITY, rest: 0 }];
  for (const price of PRICES.slice(1)) {
    const prev = dp[dp.length - 1];
    dp.push({ hold: Math.max(prev.hold, prev.rest - price), sold: prev.hold + price, rest: Math.max(prev.rest, prev.sold) });
  }
  const steps: AlgorithmStep[] = [];
  const descriptions = [
    '第 0 天只能持股买入，利润为 -1；卖出状态不可达。',
    '第 1 天可继续持有或从休息状态买入；卖出利润由昨天持股转来。',
    '第 2 天卖出利润升至 2，但今天卖出后明天不能买入。',
    '第 3 天价格为 0；休息状态可以买入，持股利润更新为 0。',
    '第 4 天可卖出获得利润 2；答案取卖出或休息中的较大值 3。'
  ];
  const stateName = solution === 'dp' ? '三状态动态规划' : '状态机递推';
  for (let day = 0; day < PRICES.length; day += 1) {
    const state = dp[day];
    const prior = day ? dp[day - 1] : null;
    const values = [
      { key: 'hold', label: `持股 ${state.hold}`, value: state.hold, y: ROWS.hold },
      { key: 'sold', label: `卖出 ${Number.isFinite(state.sold) ? state.sold : '—'}`, value: state.sold, y: ROWS.sold },
      { key: 'rest', label: `休息 ${state.rest}`, value: state.rest, y: ROWS.rest }
    ];
    const focus = values[day === 0 ? 0 : day % values.length];
    const nodes: CanvasNode[] = [
      ...PRICES.map((price, index) => node(`price-${index}`, String(price), X[index], ROWS.price, index <= day ? 'visited' : 'idle', `第${index}天`)),
      ...values.map((entry) => node(`${entry.key}-${day}`, entry.label, X[day], entry.y, entry.key === focus.key ? (day === PRICES.length - 1 ? 'done' : 'current') : 'visited', entry.key))
    ];
    const arrows = prior ? [
      { id: `hold-${day}`, from: { x: X[day - 1], y: ROWS.hold + 35 }, to: { x: X[day], y: ROWS.hold + 35 }, text: `持有=max(持有,休息−${PRICES[day]})`, kind: 'transfer' as const },
      { id: `sold-${day}`, from: { x: X[day - 1], y: ROWS.hold + 45 }, to: { x: X[day], y: ROWS.sold - 45 }, text: `卖出+${PRICES[day]}`, kind: 'flow' as const },
      { id: `rest-${day}`, from: { x: X[day - 1], y: ROWS.rest - 38 }, to: { x: X[day], y: ROWS.rest - 38 }, text: '休息=max(休息,昨日卖出)', kind: 'transfer' as const }
    ] : [];
    steps.push({
      id: day, title: `第 ${day} 天：更新状态`, description: descriptions[day],
      narration: day === 0 ? `初始化第 0 天，买入价 ${PRICES[0]} 使持股利润为 -${PRICES[0]}；卖出状态标为不可达。` : `读入第 ${day} 天价格 ${PRICES[day]}，${descriptions[day]}`,
      operation: day === 0 ? 'init' : 'compare',
      binding: { anchorIds: [day === 0 ? 'init' : 'transition'], variables: { day, price: PRICES[day], hold: state.hold, sold: state.sold, rest: state.rest, profit: Math.max(state.sold, state.rest) } },
      frame: { nodes, edges: [], arrows, labels: [{ id: 'legend-label', targetId: `price-${day}`, text: '今日价格', detail: '更新三种持仓状态', position: 'top', variant: 'callout', tone: 'accent' }], notes: ['卖出后隔一天才能买入：今日买入只允许从昨日休息状态转移'], metrics: [{ label: '交易日', value: `${day + 1}/5` }, { label: '今日价格', value: PRICES[day] }, { label: '最大利润', value: Math.max(state.sold, state.rest) }], legend: [{ status: 'current', label: '当前' }, { status: 'visited', label: '已计算' }, { status: 'done', label: '最终状态' }] }
    });
  }
  const last = steps[steps.length - 1];
  steps.push({ ...last, id: PRICES.length, title: `${stateName}：返回最大利润`, description: '遍历结束且手中不持股，比较最后一天的卖出与休息利润，返回 3。', narration: '交易结束时不能仍持有股票，因此取最后一天卖出与休息状态的最大值 3。', operation: 'done', binding: { anchorIds: ['return'], variables: { profit: 3, hold: 1, sold: 3, rest: 3 } }, frame: { ...last.frame, nodes: last.frame.nodes.map((n) => n.id === 'sold-4' || n.id === 'rest-4' ? { ...n, status: 'done' as const } : n), metrics: [{ label: '天数', value: 5 }, { label: '最大利润', value: 3 }, { label: '交易次数', value: 2 }] } });
  return steps;
}
