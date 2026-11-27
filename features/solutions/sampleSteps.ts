import type { AlgorithmStep, CanvasNode, StepOperation } from '../../types';

const PRICES = [1, 2, 3, 0, 2];
const X = PRICES.map((_, day) => 150 + day * 215);
const ROWS = { price: 110, hold: 285, sold: 455, rest: 625 } as const;
type StateKey = 'hold' | 'sold' | 'rest';
type State = Record<StateKey, number>;
type Candidate = { id: string; target: StateKey; label: string; value: number; source: StateKey; narration: string };
type NarratedAction = {
  title: string;
  operation: StepOperation;
  narration: string;
  target?: StateKey;
  focusSource?: StateKey;
  candidate?: Candidate;
  chooseCandidates?: Candidate[];
};

const STATE_LABELS: Record<StateKey, string> = {
  hold: '持股',
  sold: '今天卖出',
  rest: '休息/冷冻结束'
};

function format(value: number): string {
  return Number.isFinite(value) ? String(value) : '不可达';
}

function node(id: string, label: string, x: number, y: number, status: CanvasNode['status'], badge?: string, radius = 31): CanvasNode {
  return { id, label, x, y, status, badge, radius };
}

function candidateNode(candidate: Candidate, day: number, status: CanvasNode['status'], slot: number): CanvasNode {
  return node(candidate.id, `${candidate.label} · 利润 ${format(candidate.value)}`, X[day], ROWS[candidate.target] - 46 - slot * 54, status, '候选', 24);
}

function buildFrame(options: {
  day: number;
  target?: StateKey;
  focusSource?: StateKey;
  states: State[];
  candidates: Candidate[];
  chosen?: Candidate[];
  final?: boolean;
}): AlgorithmStep['frame'] {
  const { day, target, focusSource, states, candidates, chosen = [], final = false } = options;
  const nodes: CanvasNode[] = PRICES.map((price, index) => node(
    `price-${index}`, String(price), X[index], ROWS.price,
    index < day ? 'visited' : 'idle', index === day ? '今天' : `第${index}天`
  ));
  const arrows: AlgorithmStep['frame']['arrows'] = [];

  states.forEach((state, stateDay) => {
    (['hold', 'sold', 'rest'] as StateKey[]).forEach((key) => {
      const isTarget = stateDay === day && key === target;
      const isFocusedSource = stateDay === day - 1 && key === focusSource;
      const isFinal = final && stateDay === states.length - 1 && (key === 'sold' || key === 'rest');
      const relevant = isTarget || isFocusedSource || candidates.some((item) => item.source === key && stateDay === day - 1) || final || stateDay < day;
      if (!relevant) return;

      nodes.push(node(
        `${key}-${stateDay}`,
        `${STATE_LABELS[key]} ${format(state[key])}`,
        X[stateDay], ROWS[key],
        isFinal ? 'done' : isTarget ? 'current' : isFocusedSource ? 'current' : candidates.some((item) => item.source === key && stateDay === day - 1) ? 'compare' : 'visited',
        `${stateDay}天`
      ));
    });
  });

  candidates.forEach((item) => {
    const isChosen = chosen.some((candidate) => candidate.id === item.id);
    const isLatest = item === candidates[candidates.length - 1] && chosen.length === 0;
    const slot = candidates.filter((candidate) => candidate.target === item.target).findIndex((candidate) => candidate.id === item.id);
    nodes.push(candidateNode(item, day, isChosen ? 'compare' : isLatest ? 'current' : 'visited', slot));

    const sourceDay = day - 1;
    arrows.push({
      id: `candidate-arrow-${item.id}`,
      from: { x: X[sourceDay] + 34, y: ROWS[item.source] },
      to: { x: X[day] - 24, y: ROWS[item.target] - 48 },
      text: `昨天${STATE_LABELS[item.source]} → 候选${STATE_LABELS[item.target]}`,
      kind: 'transfer',
      curve: item.source === item.target ? -14 : 14
    });
  });

  if (chosen.length > 0 && target) {
    chosen.forEach((item) => {
      arrows.push({
        id: `select-arrow-${item.id}`,
        from: { x: X[day] + 24, y: ROWS[item.target] - 48 },
        to: { x: X[day] - 34, y: ROWS[target] },
        text: `比较候选 ${format(item.value)}`,
        kind: 'transfer',
        curve: item.target === target ? -12 : 12
      });
    });
  }

  const todayPrice = PRICES[day];
  const profit = Math.max(states[day].sold, states[day].rest);
  const focus = chosen.length > 0
    ? `比较 ${chosen.map((item) => `${item.label} ${format(item.value)}`).join(' 与 ')}`
    : candidates.length > 0
      ? `${candidates[candidates.length - 1].label} ${format(candidates[candidates.length - 1].value)}`
      : target ? STATE_LABELS[target] : focusSource ? STATE_LABELS[focusSource] : '最终利润';
  return {
    nodes,
    edges: [],
    arrows,
    labels: [{
      id: 'today-guide',
      targetId: `price-${day}`,
      text: `第 ${day} 天 · 价格 ${todayPrice}`,
      detail: target ? `当前要回答：${focus}` : `当前要回答：${focus}`,
      position: 'top',
      variant: 'callout',
      tone: 'accent'
    }],
    notes: [day === 3 && target === 'hold'
      ? '冷冻期：昨天卖出后的今天不能买入；买入候选只从“昨天休息”计算。'
      : candidates.length > 0
        ? `当前有 ${candidates.length} 张候选卡；新出现的卡片是本步刚算出的值。`
      : chosen.length > 0
        ? `现在比较 ${chosen.map((item) => `${item.label} ${format(item.value)}`).join(' 与 ')}，选出今天的${target ? STATE_LABELS[target] : '状态'}。`
        : candidates.length > 0
          ? `已计算 ${candidates.length} 个候选；本步新增“${candidates[candidates.length - 1].label} ${format(candidates[candidates.length - 1].value)}”。`
          : `跟随高亮焦点：${focus}。箭头指出候选所依赖的昨天状态。`],
    metrics: final
      ? [
          { label: '末日卖出', value: states[day].sold },
          { label: '末日休息', value: states[day].rest },
          { label: '最大利润', value: profit }
        ]
      : [
          { label: '已处理天数', value: `${day + 1}/5` },
          { label: '当前焦点', value: focus },
          { label: '空仓利润', value: profit },
          ...candidates.slice(-1).map((item) => ({ label: '候选利润', value: `${item.label} ${format(item.value)}` })),
          ...(chosen.length > 0 ? [{ label: '比较结果', value: chosen.map((item) => format(item.value)).join(' vs ') }] : [])
        ],
    legend: [
      { status: 'current', label: '本步焦点' },
      { status: 'compare', label: '候选/来源比较' },
      { status: 'visited', label: '已计算' },
      { status: 'done', label: '答案候选' }
    ]
  };
}

function makeDayActions(day: number, price: number, previous: State, current: State): NarratedAction[] {
  const holdKeep: Candidate = {
    id: `candidate-hold-keep-${day}`, target: 'hold', label: '续持候选', value: previous.hold, source: 'hold',
    narration: `先看续持方案：昨天已经持股，今天不交易，利润保持 ${format(previous.hold)}。`
  };
  const holdBuy: Candidate = {
    id: `candidate-hold-buy-${day}`, target: 'hold', label: '买入候选', value: previous.rest - price, source: 'rest',
    narration: day === 3
      ? `价格为 0，但冷冻期限制买入来源：只能从昨天休息利润 ${previous.rest} 买入，候选利润仍为 ${current.hold}；昨天卖出的 ${format(previous.sold)} 不能买入。`
      : `再看买入方案：昨天休息利润 ${previous.rest} 减今天价格 ${price}，候选利润为 ${previous.rest - price}。`
  };
  const soldCandidate: Candidate = {
    id: `candidate-sold-${day}`, target: 'sold', label: '卖出候选', value: current.sold, source: 'hold',
    narration: `把昨天持股利润 ${format(previous.hold)} 加今天价格 ${price}，得到卖出候选 ${format(current.sold)}。`
  };
  const restCarry: Candidate = {
    id: `candidate-rest-carry-${day}`, target: 'rest', label: '继续休息', value: previous.rest, source: 'rest',
    narration: `如果今天继续空仓，就沿用昨天休息利润 ${previous.rest}，得到候选 ${previous.rest}。`
  };
  const restCooldown: Candidate = {
    id: `candidate-rest-cooldown-${day}`, target: 'rest', label: '冷冻结束', value: previous.sold, source: 'sold',
    narration: `如果昨天卖出，今天结束冷冻期并保持空仓，利润为昨天卖出值 ${format(previous.sold)}。`
  };

  return [
    { title: '读取昨天的持股状态', operation: 'read', focusSource: 'hold', narration: `先读取昨天持股利润 ${format(previous.hold)}，这是今天“继续持有”与“卖出”的共同来源。` },
    { title: '计算续持候选', operation: 'compare', target: 'hold', candidate: holdKeep, narration: holdKeep.narration },
    { title: '计算买入候选', operation: 'compare', target: 'hold', candidate: holdBuy, narration: holdBuy.narration },
    { title: '比较候选并确定今天持股利润', operation: 'compare', target: 'hold', chooseCandidates: [holdKeep, holdBuy], narration: `比较续持 ${format(holdKeep.value)} 与买入 ${format(holdBuy.value)}，今天持股利润取较大值 ${current.hold}。` },
    { title: '读取昨天持股并准备卖出', operation: 'read', focusSource: 'hold', narration: `卖出必须先持有股票，因此读取昨天持股利润 ${format(previous.hold)}，再加今天价格 ${price}。` },
    { title: '计算今天卖出利润', operation: 'compare', target: 'sold', candidate: soldCandidate, narration: soldCandidate.narration },
    { title: '计算继续空仓候选', operation: 'compare', target: 'rest', candidate: restCarry, narration: restCarry.narration },
    { title: '计算冷冻结束候选', operation: 'compare', target: 'rest', candidate: restCooldown, narration: restCooldown.narration },
    { title: '比较候选并确定今天空仓利润', operation: 'compare', target: 'rest', chooseCandidates: [restCarry, restCooldown], narration: `比较继续休息 ${format(restCarry.value)} 与冷冻结束 ${format(restCooldown.value)}，今天空仓利润取较大值 ${current.rest}。` }
  ];
}

export function buildSampleSteps(solution: 'dp' | 'states' = 'dp'): AlgorithmStep[] {
  const states: State[] = [{ hold: -PRICES[0], sold: Number.NEGATIVE_INFINITY, rest: 0 }];
  const steps: AlgorithmStep[] = [{
    id: 0,
    title: '第 0 天：建立初始状态',
    description: '初始时空仓利润为 0；花 1 买入后持股利润为 −1；还没有股票可卖，所以卖出状态不可达。',
    narration: '开场先明确三个状态：持股 −1、卖出不可达、空仓 0。不可达表示尚无股票能卖，不参与候选比较。',
    operation: 'init',
    binding: { anchorIds: ['init'], variables: { day: 0, price: PRICES[0], hold: -1, sold: Number.NEGATIVE_INFINITY, rest: 0 } },
    frame: buildFrame({ day: 0, target: 'rest', states, candidates: [] })
  }];

  for (let day = 1; day < PRICES.length; day += 1) {
    const previous = states[day - 1];
    const price = PRICES[day];
    const current = {
      hold: Math.max(previous.hold, previous.rest - price),
      sold: previous.hold + price,
      rest: Math.max(previous.rest, previous.sold)
    };
    states.push(current);
    const actions = makeDayActions(day, price, previous, current);
    const candidates: Candidate[] = [];

    actions.forEach((action) => {
      const stepId = steps.length;
      if (action.candidate) candidates.push(action.candidate);
      steps.push({
        id: stepId,
        title: `第 ${day} 天：${action.title}`,
        description: action.narration,
        narration: `${action.narration}${action.candidate ? ` 画面中的“${action.candidate.label}”卡片就是这个数，连线表示它的来源。` : ''}`,
        operation: action.operation,
        binding: {
          anchorIds: [action.target ? 'transition' : action.focusSource ? 'transition' : 'init'],
          variables: {
            day,
            price,
            hold: current.hold,
            sold: current.sold,
            rest: current.rest,
            updatedState: action.target ?? action.focusSource ?? 'candidate-comparison',
            candidateValues: candidates.map((item) => ({ id: item.id, value: item.value })),
            profit: Math.max(current.sold, current.rest)
          }
        },
        frame: buildFrame({
          day,
          target: action.target,
          focusSource: action.focusSource,
          states,
          candidates,
          chosen: action.chooseCandidates,
          final: false
        })
      });
    });
  }

  const last = states[states.length - 1];
  const answer = Math.max(last.sold, last.rest);
  steps.push({
    id: steps.length,
    title: `${solution === 'dp' ? '三状态动态规划' : '状态机递推'}：核对最终利润`,
    description: `最后一天卖出利润为 ${last.sold}，休息利润为 ${last.rest}；结束时不能持股，因此最大利润是 ${answer}。`,
    narration: `交易结束时必须空仓。最后一天卖出可得 ${last.sold}，休息可得 ${last.rest}；不把仍持股的利润算作已实现收益，所以返回 ${answer}。`,
    operation: 'return',
    binding: { anchorIds: ['return'], variables: { hold: last.hold, sold: last.sold, rest: last.rest, profit: answer } },
    frame: buildFrame({ day: PRICES.length - 1, states, candidates: [], final: true })
  });
  return steps;
}
