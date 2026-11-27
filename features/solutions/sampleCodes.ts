import type { CodeArtifact, Language } from '../../types';

const lines = {
  java: `class Solution {
    public int maxProfit(int[] prices) {
        // anchor:init
        int hold = -prices[0], sold = Integer.MIN_VALUE, rest = 0;
        // anchor:read-hold
        for (int i = 1; i < prices.length; i++) {
            int prevHold = hold, prevSold = sold, prevRest = rest;
            // anchor:hold-keep
            int keep = prevHold;
            // anchor:hold-buy
            int buy = prevRest - prices[i];
            // anchor:choose-hold
            hold = Math.max(keep, buy);
            // anchor:read-sell
            int sellSource = prevHold;
            // anchor:sold
            sold = sellSource + prices[i];
            // anchor:rest-carry
            int restSource = prevRest;
            // anchor:rest-cooldown
            int cooldownSource = prevSold;
            // anchor:choose-rest
            rest = Math.max(restSource, cooldownSource);
        }
        // anchor:return
        return Math.max(sold, rest);
    }
}`,
  python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # anchor:init
        hold, sold, rest = -prices[0], float('-inf'), 0
        # anchor:read-hold
        for price in prices[1:]:
            prev_hold, prev_sold, prev_rest = hold, sold, rest
            # anchor:hold-keep
            keep = prev_hold
            # anchor:hold-buy
            buy = prev_rest - price
            # anchor:choose-hold
            hold = max(keep, buy)
            # anchor:read-sell
            sell_source = prev_hold
            # anchor:sold
            sold = sell_source + price
            # anchor:rest-carry
            rest_source = prev_rest
            # anchor:rest-cooldown
            cooldown_source = prev_sold
            # anchor:choose-rest
            rest = max(rest_source, cooldown_source)
        # anchor:return
        return max(sold, rest)`,
  go: `func maxProfit(prices []int) int {
    // anchor:init
    hold, sold, rest := -prices[0], -1<<60, 0
    // anchor:read-hold
    for _, price := range prices[1:] {
        prevHold, prevSold, prevRest := hold, sold, rest
        // anchor:hold-keep
        keep := prevHold
        // anchor:hold-buy
        buy := prevRest - price
        // anchor:choose-hold
        hold = max(keep, buy)
        // anchor:read-sell
        sellSource := prevHold
        // anchor:sold
        sold = sellSource + price
        // anchor:rest-carry
        restSource := prevRest
        // anchor:rest-cooldown
        cooldownSource := prevSold
        // anchor:choose-rest
        rest = max(restSource, cooldownSource)
    }
    // anchor:return
    return max(sold, rest)
}`,
  javascript: `function maxProfit(prices) {
  // anchor:init
  let hold = -prices[0], sold = -Infinity, rest = 0;
  // anchor:read-hold
  for (const price of prices.slice(1)) {
    const [prevHold, prevSold, prevRest] = [hold, sold, rest];
    // anchor:hold-keep
    const keep = prevHold;
    // anchor:hold-buy
    const buy = prevRest - price;
    // anchor:choose-hold
    hold = Math.max(keep, buy);
    // anchor:read-sell
    const sellSource = prevHold;
    // anchor:sold
    sold = sellSource + price;
    // anchor:rest-carry
    const restSource = prevRest;
    // anchor:rest-cooldown
    const cooldownSource = prevSold;
    // anchor:choose-rest
    rest = Math.max(restSource, cooldownSource);
  }
  // anchor:return
  return Math.max(sold, rest);
}`
} as const;

export function buildSampleCodes(): Record<Language, CodeArtifact> {
  return Object.fromEntries(Object.entries(lines).map(([language, code]) => {
    const anchorLineMap: Record<string, number[]> = {};
    code.split('\n').forEach((line, index) => {
      const match = line.match(/anchor:([\w-]+)/);
      if (match) anchorLineMap[match[1]] = [index + 2];
    });
    return [language, { language, code, anchorLineMap }];
  })) as Record<Language, CodeArtifact>;
}
