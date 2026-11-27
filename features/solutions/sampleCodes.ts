import type { CodeArtifact, Language } from '../../types';

const lines = {
  java: `class Solution {
    public int maxProfit(int[] prices) {
        // anchor:init
        int hold = -prices[0], sold = Integer.MIN_VALUE, rest = 0;
        // anchor:transition
        for (int i = 1; i < prices.length; i++) {
            int prevHold = hold, prevSold = sold, prevRest = rest;
            hold = Math.max(prevHold, prevRest - prices[i]);
            sold = prevHold + prices[i];
            rest = Math.max(prevRest, prevSold);
        }
        // anchor:return
        return Math.max(sold, rest);
    }
}`,
  python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # anchor:init
        hold, sold, rest = -prices[0], float('-inf'), 0
        # anchor:transition
        for price in prices[1:]:
            hold, sold, rest = max(hold, rest - price), hold + price, max(rest, sold)
        # anchor:return
        return max(sold, rest)`,
  go: `func maxProfit(prices []int) int {
    // anchor:init
    hold, sold, rest := -prices[0], -1<<60, 0
    // anchor:transition
    for _, price := range prices[1:] {
        hold, sold, rest = max(hold, rest-price), hold+price, max(rest, sold)
    }
    // anchor:return
    return max(sold, rest)
}`,
  javascript: `function maxProfit(prices) {
  // anchor:init
  let hold = -prices[0], sold = -Infinity, rest = 0;
  // anchor:transition
  for (const price of prices.slice(1)) {
    [hold, sold, rest] = [Math.max(hold, rest - price), hold + price, Math.max(rest, sold)];
  }
  // anchor:return
  return Math.max(sold, rest);
}`
} as const;

export function buildSampleCodes(): Record<Language, CodeArtifact> {
  return Object.fromEntries(Object.entries(lines).map(([language, code]) => {
    const anchorLineMap: Record<string, number[]> = {};
    code.split('\n').forEach((line, index) => {
      const match = line.match(/anchor:(\w+)/);
      if (match) anchorLineMap[match[1]] = [index + 2];
    });
    return [language, { language, code, anchorLineMap }];
  })) as Record<Language, CodeArtifact>;
}
