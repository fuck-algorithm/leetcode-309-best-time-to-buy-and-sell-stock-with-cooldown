import type { AlgorithmStep, CanvasNode, StepOperation } from '../../types';

const PRICES = [1, 2, 3, 0, 2];
const X = PRICES.map((_, day) => 150 + day * 215);
const ROWS = { price: 110, hold: 285, sold: 455, rest: 625 } as const;
type StateKey = 'hold' | 'sold' | 'rest';
type State = Record<StateKey, number>;
type Transition = {
  target: StateKey;
  sources: StateKey[];
  operation: StepOperation;
  title: string;
  narration: (day: number, price: number, previous: State, current: State) => string;
};

const STATE_LABELS: Record<StateKey, string> = {
  hold: '持股',
  sold: '今天卖出',
  rest: '休息/冷冻结束'
};

function format(value: number): string {
  return Number.isFinite(value) ? String(value) : '不可达';
}

function node(id: string, label: string, x: number, y: number, status: CanvasNode['status'], badge?: string): CanvasNode {
  return { id, label, x, y, status, badge, radius: 31 };
}

function makeTransitions(): Transition[] {
  return [
    {
      target: 'hold', sources: ['hold', 'rest'], operation: 'compare', title: '先决定今天收盘时是否持股',
      narration: (day, price, previous, current) => day === 3
        ? `第 ${day} 天价格是 ${price}。昨天休息的利润是 ${previous.rest}，买入后利润仍是 ${current.hold}；昨天卖出的 ${format(previous.sold)} 不可用于买入，因为卖出后的下一天是冷冻期。`
        : `第 ${day} 天价格是 ${price}。今天持股有两种来源：昨天已持有（${format(previous.hold)}），或昨天休息后花 ${price} 买入（${previous.rest}−${price}）；取较大利润 ${current.hold}。`
    },
    {
      target: 'sold', sources: ['hold'], operation: 'compare', title: '再计算今天卖出的利润',
      narration: (day, price, previous, current) => `只有昨天持股才能在今天卖出：${format(previous.hold)} 加上今天价格 ${price}，今天卖出状态为 ${format(current.sold)}。`
    },
    {
      target: 'rest', sources: ['rest', 'sold'], operation: 'compare', title: '最后计算今天结束时空仓',
      narration: (day, _price, previous, current) => `今天结束时没有股票，可能是昨天继续休息（${previous.rest}），也可能是昨天卖出后冷冻期结束（${format(previous.sold)}）；取较大值 ${current.rest}。`
    }
  ];
}

function buildFrame(day: number, target: StateKey | null, sourceKeys: StateKey[], states: State[], final = false): AlgorithmStep['frame'] {
  const nodes: CanvasNode[] = PRICES.map((price, index) => node(
    `price-${index}`, String(price), X[index], ROWS.price,
    index < day ? 'visited' : 'idle', index === day ? '今天' : `第${index}天`
  ));
  const arrows: AlgorithmStep['frame']['arrows'] = [];

  states.forEach((state, stateDay) => {
    (['hold', 'sold', 'rest'] as StateKey[]).forEach((key) => {
      const id = `${key}-${stateDay}`;
      const isTarget = stateDay === day && key === target;
      const isSource = stateDay === day - 1 && sourceKeys.includes(key);
      const isFinal = final && stateDay === states.length - 1 && (key === 'sold' || key === 'rest');
      const status = isFinal ? 'done' : isTarget ? 'current' : isSource ? 'compare' : 'visited';
      const exists = final || stateDay < day || isTarget || isSource;
      if (!exists) return;

      nodes.push(node(
        id,
        `${STATE_LABELS[key]} ${format(state[key])}`,
        X[stateDay],
        ROWS[key],
        status,
        `${stateDay}天`
      ));

      if (isSource && target) {
        const startY = ROWS[key];
        const endY = ROWS[target];
        arrows.push({
          id: `transition-${stateDay}-${key}-${target}`,
          from: { x: X[stateDay] + 34, y: startY },
          to: { x: X[day] - 34, y: endY },
          text: `昨天${STATE_LABELS[key]} → 今天${STATE_LABELS[target]}`,
          kind: 'transfer',
          curve: key === target ? -18 : 18
        });
      }
    });
  });

  const todayPrice = PRICES[day];
  const profit = Math.max(states[day].sold, states[day].rest);
  return {
    nodes,
    edges: [],
    arrows,
    labels: [{
      id: 'today-guide',
      targetId: `price-${day}`,
      text: `第 ${day} 天 · 价格 ${todayPrice}`,
      detail: target ? `这一步只更新「${STATE_LABELS[target]}」` : '收盘时必须不持股',
      position: 'top',
      variant: 'callout',
      tone: 'accent'
    }],
    notes: [target === 'hold' && day === 3
      ? '冷冻期：卖出后下一天不能买；持股只能从“昨天休息”转入。'
      : target ? `当前只聚焦一个状态：${STATE_LABELS[target]}。黄色输入是本步比较的昨天状态。` : '最终答案不能选择持股状态，因为交易结束时必须空仓。'],
    metrics: target
      ? [
          { label: '已处理天数', value: `${day + 1}/5` },
          { label: '本步更新', value: STATE_LABELS[target] },
          { label: '空仓利润', value: profit }
        ]
      : [
          { label: '末日卖出', value: states[day].sold },
          { label: '末日休息', value: states[day].rest },
          { label: '最大利润', value: profit }
        ],
    legend: [
      { status: 'current', label: '本步结果' },
      { status: 'compare', label: '昨天的来源状态' },
      { status: 'visited', label: '已计算' },
      { status: 'done', label: '答案候选' }
    ]
  };
}

export function buildSampleSteps(solution: 'dp' | 'states' = 'dp'): AlgorithmStep[] {
  const states: State[] = [{ hold: -PRICES[0], sold: Number.NEGATIVE_INFINITY, rest: 0 }];
  const steps: AlgorithmStep[] = [{
    id: 0,
    title: '第 0 天：从空仓开始',
    description: '首日可买入或保持空仓；还没有股票可卖，因此卖出状态不可达。',
    narration: '开始时手里没有股票、利润为 0。第 0 天买入后持股利润是 −1；因为尚未持有过股票，今天不可能卖出。',
    operation: 'init',
    binding: { anchorIds: ['init'], variables: { day: 0, price: PRICES[0], hold: -1, sold: Number.NEGATIVE_INFINITY, rest: 0 } },
    frame: buildFrame(0, 'rest', [], states)
  }];

  const transitions = makeTransitions();
  for (let day = 1; day < PRICES.length; day += 1) {
    const previous = states[day - 1];
    const price = PRICES[day];
    const current = {
      hold: Math.max(previous.hold, previous.rest - price),
      sold: previous.hold + price,
      rest: Math.max(previous.rest, previous.sold)
    };
    states.push(current);

    transitions.forEach((transition) => {
      const stepId = steps.length;
      steps.push({
        id: stepId,
        title: `第 ${day} 天：${transition.title}`,
        description: transition.narration(day, price, previous, current),
        narration: transition.narration(day, price, previous, current),
        operation: transition.operation,
        binding: {
          anchorIds: ['transition'],
          variables: {
            day,
            price,
            hold: current.hold,
            sold: current.sold,
            rest: current.rest,
            updatedState: transition.target,
            profit: Math.max(current.sold, current.rest)
          }
        },
        frame: buildFrame(day, transition.target, transition.sources, states)
      });
    });
  }

  const last = states[states.length - 1];
  const answer = Math.max(last.sold, last.rest);
  const resultId = steps.length;
  steps.push({
    id: resultId,
    title: `${solution === 'dp' ? '三状态动态规划' : '状态机递推'}：核对最终利润`,
    description: `最后一天卖出利润为 ${last.sold}，休息利润为 ${last.rest}；结束时不能持股，因此最大利润是 ${answer}。`,
    narration: `交易结束时必须空仓。最后一天卖出可得 ${last.sold}，休息可得 ${last.rest}；不把仍持股的利润算作已实现收益，所以返回 ${answer}。`,
    operation: 'return',
    binding: { anchorIds: ['return'], variables: { hold: last.hold, sold: last.sold, rest: last.rest, profit: answer } },
    frame: buildFrame(PRICES.length - 1, null, [], states, true)
  });
  return steps;
}
