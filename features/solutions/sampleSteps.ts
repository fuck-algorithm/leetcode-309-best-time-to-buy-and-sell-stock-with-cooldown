import type { AlgorithmStep, CanvasNode } from '../../types';

const PRICES = [1, 2, 3, 0, 2];
const X = PRICES.map((_, day) => 145 + day * 225);
const ROWS = { price: 110, hold: 270, sold: 440, rest: 610 } as const;
type State = { hold: number; sold: number; rest: number };

function format(value: number): string {
  return Number.isFinite(value) ? String(value) : '不可达';
}

function node(id: string, label: string, x: number, y: number, status: CanvasNode['status'], badge?: string): CanvasNode {
  return { id, label, x, y, status, badge, radius: 31 };
}

export function buildSampleSteps(solution: 'dp' | 'states' = 'dp'): AlgorithmStep[] {
  const states: State[] = [{ hold: -PRICES[0], sold: Number.NEGATIVE_INFINITY, rest: 0 }];
  for (const price of PRICES.slice(1)) {
    const previous = states[states.length - 1];
    states.push({
      hold: Math.max(previous.hold, previous.rest - price),
      sold: previous.hold + price,
      rest: Math.max(previous.rest, previous.sold)
    });
  }

  const formulas = [
    '首日没有昨天：买入花掉 1，卖出不可达，空仓利润为 0。',
    '第 1 天买入只能接昨天的休息 0；卖出则接昨天持股 −1。',
    '第 2 天卖出利润变为 2；卖出后的状态不能直接用于次日买入。',
    '第 3 天价格为 0；买入来源仍是昨天休息 1，而不是昨天卖出 2。',
    '第 4 天卖出利润达到 3；结束时不持股，取卖出 3 与休息 2 的较大值。'
  ];
  const solutionName = solution === 'dp' ? '三状态动态规划' : '状态机递推';

  return [
    ...states.map((current, day): AlgorithmStep => {
      const previous = day > 0 ? states[day - 1] : null;
      const today = day === PRICES.length - 1;
      const nodes: CanvasNode[] = [
        ...PRICES.map((price, index) => node(
          `price-${index}`,
          String(price),
          X[index],
          ROWS.price,
          index <= day ? 'visited' : 'idle',
          `第${index}天`
        )),
        ...(['hold', 'sold', 'rest'] as const).flatMap((key) => states.slice(0, day + 1).map((state, index) => {
          const value = state[key];
          const focus = index === day && key === 'hold' && !today;
          const result = today && index === day && (key === 'sold' || key === 'rest');
          return node(
            `${key}-${index}`,
            `${key === 'hold' ? '持股' : key === 'sold' ? '今日卖出' : '休息'} ${format(value)}`,
            X[index],
            ROWS[key],
            result ? 'done' : focus ? 'current' : 'visited',
            key === 'hold' ? '持股' : key === 'sold' ? '卖出' : '休息'
          );
        }))
      ];
      const arrows = previous ? [
        { id: `hold-flow-${day}`, from: { x: X[day - 1] + 35, y: ROWS.hold }, to: { x: X[day] - 35, y: ROWS.hold }, text: `持股=max(昨天持股${previous.hold},昨天休息${previous.rest}−今日价格${PRICES[day]})`, kind: 'transfer' as const },
        { id: `sold-flow-${day}`, from: { x: X[day - 1] + 35, y: ROWS.hold + 38 }, to: { x: X[day] - 35, y: ROWS.sold - 38 }, text: `卖出=昨天持股${previous.hold}+今日价格${PRICES[day]}`, kind: 'flow' as const },
        { id: `rest-flow-${day}`, from: { x: X[day - 1] + 35, y: ROWS.rest }, to: { x: X[day] - 35, y: ROWS.rest }, text: `休息=max(昨天休息${previous.rest},昨天卖出${format(previous.sold)})`, kind: 'transfer' as const }
      ] : [];
      const maxProfit = Math.max(current.sold, current.rest);
      const narration = day === 0
        ? '第 0 天买入后持股利润是 −1；尚未发生卖出，所以“今日卖出”不可达，空仓利润为 0。'
        : day === 3
          ? `价格降到 0，买入只允许接昨天休息的利润 1；因为昨天卖出会触发冷冻期，不能直接买入。持股 ${format(current.hold)}，休息 ${current.rest}。`
          : `价格 ${PRICES[day]}：${formulas[day]} 持股 ${format(current.hold)}，卖出 ${format(current.sold)}，休息 ${current.rest}。`;

      return {
        id: day,
        title: `第 ${day} 天：${day === 0 ? '建立起始状态' : '更新三种状态'}`,
        description: narration,
        narration,
        operation: day === 0 ? 'init' : today ? 'done' : 'compare',
        binding: {
          anchorIds: [day === 0 ? 'init' : today ? 'return' : 'transition'],
          variables: { day, price: PRICES[day], hold: current.hold, sold: current.sold, rest: current.rest, profit: maxProfit }
        },
        frame: {
          nodes,
          edges: [],
          arrows,
          labels: [{
            id: 'table-guide',
            targetId: `price-${day}`,
            text: '今天的价格',
            detail: '向下读三种持仓状态；横向比较前一天',
            position: 'top',
            variant: 'callout',
            tone: 'accent'
          }],
          notes: [day === 0
            ? '不可达 = 这种状态还不可能发生，不参与最大值比较。'
            : '冷冻期关键：买入只看“昨天休息”，绝不从“昨天卖出”连线。'],
          metrics: [
            { label: '今天', value: `${day + 1}/5` },
            { label: '价格', value: PRICES[day] },
            { label: '不持股最高利润', value: maxProfit }
          ],
          legend: [
            { status: 'current', label: '今天正在计算' },
            { status: 'visited', label: '已算出的状态' },
            { status: 'done', label: '最终候选答案' }
          ]
        }
      };
    }),
    {
      id: PRICES.length,
      title: `${solutionName}：为什么答案是 3？`,
      description: '最后一天结束时不能持股；今日卖出利润为 3，休息利润为 2，因此返回 3。',
      narration: '收盘时手中必须没有股票：末日卖出得到 3，保持休息得到 2；取两者较大值，答案为 3。',
      operation: 'return',
      binding: { anchorIds: ['return'], variables: { hold: 1, sold: 3, rest: 2, profit: 3 } },
      frame: {
        ...buildSampleStepsFrame(states),
        metrics: [
          { label: '末日卖出', value: 3 },
          { label: '末日休息', value: 2 },
          { label: '最大利润', value: 3 }
        ]
      }
    }
  ];
}

function buildSampleStepsFrame(states: State[]): AlgorithmStep['frame'] {
  const day = states.length - 1;
  const last = states[day];
  const nodes: CanvasNode[] = [
    ...PRICES.map((price, index) => node(`price-${index}`, String(price), X[index], ROWS.price, 'visited', `第${index}天`)),
    ...(['hold', 'sold', 'rest'] as const).flatMap((key) => states.map((state, index) => node(
      `${key}-${index}`,
      `${key === 'hold' ? '持股' : key === 'sold' ? '今日卖出' : '休息'} ${format(state[key])}`,
      X[index], ROWS[key], index === day && key !== 'hold' ? 'done' : 'visited',
      key === 'hold' ? '持股' : key === 'sold' ? '卖出' : '休息'
    )))
  ];
  return {
    nodes,
    edges: [],
    arrows: [],
    labels: [{ id: 'answer-guide', targetId: `price-${day}`, text: '最后一天', detail: '只比较卖出与休息，不能带股离场', position: 'top', variant: 'callout', tone: 'accent' }],
    notes: ['末日候选：卖出 3、休息 2；持股 1 不能作为最终利润。'],
    metrics: [{ label: '末日卖出', value: last.sold }, { label: '末日休息', value: last.rest }, { label: '最大利润', value: Math.max(last.sold, last.rest) }],
    legend: [
      { status: 'current', label: '今天正在计算' },
      { status: 'visited', label: '已算出的状态' },
      { status: 'done', label: '最终候选答案' }
    ]
  };
}
