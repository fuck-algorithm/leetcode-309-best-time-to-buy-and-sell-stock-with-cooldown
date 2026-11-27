import { describe, it, expect } from 'vitest';
import { createSolutionRegistry } from '../../../../features/solutions/solutionRegistry';

describe('createSolutionRegistry', () => {
  it('should return at least one solution', () => {
    const registry = createSolutionRegistry();
    expect(registry.length).toBeGreaterThan(0);
  });

  it('should have valid AlgorithmStep shapes', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];
    expect(sol.steps.length).toBeGreaterThan(0);

    for (const step of sol.steps) {
      expect(step.id).toBeDefined();
      expect(step.title).toBeDefined();
      expect(step.operation).toBeDefined();
      expect(step.binding.anchorIds).toBeDefined();
      expect(Array.isArray(step.frame.nodes)).toBe(true);
    }
  });

  it('should use unique stable node ids and valid references in every frame', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];

    for (const step of sol.steps) {
      const ids = step.frame.nodes.map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);

      const idSet = new Set(ids);
      for (const edge of step.frame.edges) {
        expect(idSet.has(edge.from)).toBe(true);
        expect(idSet.has(edge.to)).toBe(true);
      }
      for (const label of step.frame.labels) {
        expect(idSet.has(label.targetId)).toBe(true);
      }
      for (const arrow of step.frame.arrows) {
        expect(arrow.id.length).toBeGreaterThan(0);
      }

      const focused = step.frame.nodes.filter(
        (node) => node.status === 'current' || (!node.status && node.kind === 'highlight')
      );
      expect(focused.length).toBeLessThanOrEqual(1);
    }
  });

  it('should keep node ids stable across animation steps', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];
    const first = new Set(sol.steps[0].frame.nodes.map((node) => node.id));
    const reused = sol.steps[1].frame.nodes.filter((node) => first.has(node.id));

    expect(reused.length).toBeGreaterThan(0);
  });

  it('should contain all four language code artifacts', () => {
    const registry = createSolutionRegistry();
    const sol = registry[0];
    expect(sol.codes.java).toBeDefined();
    expect(sol.codes.python).toBeDefined();
    expect(sol.codes.go).toBeDefined();
    expect(sol.codes.javascript).toBeDefined();
  });

  it('should reject invalid JSON array input', () => {
    const registry = createSolutionRegistry();
    const result = registry[0].validateInput('not-json');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should accept valid JSON array input', () => {
    const registry = createSolutionRegistry();
    const result = registry[0].validateInput('[1,2,3]');
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual([1, 2, 3]);
  });

  it('should reject non-array JSON input', () => {
    const registry = createSolutionRegistry();
    const result = registry[0].validateInput('{"a":1}');
    expect(result.valid).toBe(false);
  });

  it('should generate random input accepted by the problem validator', () => {
    const registry = createSolutionRegistry();
    const raw = registry[0].generateRandom();
    expect(registry[0].validateInput(raw).valid).toBe(true);
  });

  it('should enforce the stock price constraints', () => {
    const validator = createSolutionRegistry()[0].validateInput;
    expect(validator('[0]').valid).toBe(true);
    expect(validator('[1000]').valid).toBe(true);
    expect(validator('[]').valid).toBe(false);
    expect(validator('[-1]').valid).toBe(false);
    expect(validator('[1001]').valid).toBe(false);
    expect(validator('[1.5]').valid).toBe(false);
  });

  it('should provide distinct narrated semantic frames with stable anchors', () => {
    const solutions = createSolutionRegistry();
    expect(solutions).toHaveLength(2);
    for (const solution of solutions) {
      expect(solution.steps.length).toBeGreaterThan(1);
      solution.steps.forEach((step, index) => {
        expect(step.operation).toBeTruthy();
        expect(step.narration).toBeTruthy();
        expect(step.binding.anchorIds.length).toBeGreaterThan(0);
        if (index > 0) expect(step.narration).not.toBe(solution.steps[index - 1].narration);
      });
    }
  });

  it('should show the previous-day states and explain the cooldown source rule', () => {
    const solution = createSolutionRegistry()[0];
    const cooldownDecision = solution.steps[7];
    const result = solution.steps[13];
    const labels = new Map(cooldownDecision.frame.nodes.map((node) => [node.id, node.label]));

    expect(labels.get('hold-2')).toContain('持股 -1');
    expect(labels.get('sold-2')).toContain('今天卖出 2');
    expect(labels.get('rest-2')).toContain('冷冻结束 1');
    expect(cooldownDecision.frame.arrows.map((arrow) => arrow.text).join(' ')).toContain('昨天休息');
    expect(cooldownDecision.narration).toContain('下一天是冷冻期');
    expect(result.narration).toContain('卖出可得 3');
    expect(result.narration).toContain('休息可得 2');
    expect(result.binding.variables.profit).toBe(3);
  });
});
