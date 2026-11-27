import type { InputValidationResult, SolutionDefinition } from '../../types';
import { buildSampleCodes } from './sampleCodes';
import { buildSampleSteps } from './sampleSteps';

function parsePrices(raw: string): InputValidationResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 5000 || parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 1000)) {
      return { valid: false, error: '输入须为 1–5000 个 0–1000 的整数价格数组' };
    }
    return { valid: true, parsed };
  } catch {
    return { valid: false, error: '输入格式错误，请使用合法 JSON 数组' };
  }
}

function samples() {
  return [{ id: 's1', label: '样例1', value: '[1,2,3,0,2]' }, { id: 's2', label: '样例2', value: '[1]' }];
}

function randomPrices() {
  return JSON.stringify(Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * 11)));
}

function solution(id: string, name: string, thought: string, kind: 'dp' | 'states'): SolutionDefinition {
  return { id, name, thought, samples: samples(), codes: buildSampleCodes(), steps: buildSampleSteps(kind), validateInput: parsePrices, generateRandom: randomPrices };
}

export function createSolutionRegistry(): SolutionDefinition[] {
  return [
    solution('dp', '三状态动态规划', '将每天结束时的状态分为持股、今日卖出、休息。持股只能由昨日持股或前日（即昨日休息）买入得到；卖出只能由昨日持股转移；休息取昨日休息与昨日卖出最大值。时间 O(n)，空间 O(1)。', 'dp'),
    solution('states', '状态机递推', '将冷冻期编码在状态转移约束中：今天买入只接收昨天 rest，不接收昨天 sold；卖出状态由昨天 hold 转移。与滚动 DP 等价，额外空间 O(1)。', 'states')
  ];
}
