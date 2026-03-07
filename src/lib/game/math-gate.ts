// ============================================
// ClassCiv Math Gate
// Decision 88: DM-configurable math problem
// before transactions. Wrong = 15-20% yield reduction.
// ============================================

export type MathDifficulty = "multiply" | "divide" | "ratio" | "percent";

export interface MathProblem {
  question: string;
  correctAnswer: number;
  difficulty: MathDifficulty;
  /** Context values used to generate the problem */
  context: {
    resourceName?: string;
    amount?: number;
    cost?: number;
  };
}

export interface MathGateResult {
  problem: MathProblem;
  studentAnswer: number | null;
  isCorrect: boolean;
  /** 1.0 = full value, 0.80 = 20% reduction */
  yieldMultiplier: number;
  timedOut: boolean;
}

/**
 * Generate a math problem based on difficulty and game context.
 *
 * @param difficulty - Problem type
 * @param resourceName - Name of resource being transacted
 * @param amount - Amount being transacted
 * @param bankAmount - Current bank amount
 */
export function generateMathProblem(
  difficulty: MathDifficulty,
  resourceName: string = "Production",
  amount: number = 40,
  bankAmount: number = 100
): MathProblem {
  switch (difficulty) {
    case "multiply": {
      // Simple multiplication at game scale
      const a = randomInt(3, 12);
      const b = randomInt(2, 9);
      return {
        question: `Your builders produce ${a} units each. With ${b} builders, how many total units are produced?`,
        correctAnswer: a * b,
        difficulty,
        context: { resourceName, amount },
      };
    }

    case "divide": {
      // Division with clean answers
      const total = randomInt(4, 10) * randomInt(2, 8);
      const divisor = randomFactor(total);
      return {
        question: `You have ${total} ${resourceName} to split equally among ${divisor} settlements. How much does each get?`,
        correctAnswer: total / divisor,
        difficulty,
        context: { resourceName, amount: total },
      };
    }

    case "ratio": {
      // Ratios at game scale
      const cost = amount || randomInt(20, 60);
      const remaining = bankAmount - cost;
      return {
        question: `Your trade costs ${cost} ${resourceName}. You have ${bankAmount}. How much will you have left?`,
        correctAnswer: Math.max(0, remaining),
        difficulty,
        context: { resourceName, amount: cost, cost },
      };
    }

    case "percent": {
      // Percentage calculations
      const pct = randomChoice([10, 15, 20, 25, 50]);
      const base = amount || randomInt(40, 120);
      const answer = Math.round(base * (pct / 100));
      return {
        question: `You're losing ${pct}% of your ${base} ${resourceName} to decay. How much do you lose?`,
        correctAnswer: answer,
        difficulty,
        context: { resourceName, amount: base },
      };
    }
  }
}

/**
 * Check a student's answer against the correct answer.
 * Returns the yield multiplier (1.0 for correct, reduced for wrong).
 */
export function checkMathAnswer(
  problem: MathProblem,
  studentAnswer: number | null,
  timedOut: boolean = false
): MathGateResult {
  if (timedOut || studentAnswer === null) {
    return {
      problem,
      studentAnswer,
      isCorrect: false,
      yieldMultiplier: 0.80, // 20% reduction
      timedOut: true,
    };
  }

  const isCorrect = Math.abs(studentAnswer - problem.correctAnswer) < 0.01;

  return {
    problem,
    studentAnswer,
    isCorrect,
    yieldMultiplier: isCorrect ? 1.0 : 0.80, // 20% penalty on wrong
    timedOut: false,
  };
}

// --- Helpers ---

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Find a random factor of n for clean division problems
 */
function randomFactor(n: number): number {
  const factors: number[] = [];
  for (let i = 2; i <= Math.min(n, 12); i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors.length > 0 ? randomChoice(factors) : 2;
}
