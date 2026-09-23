import { RubricScores } from "@/types";

export interface RubricCriterion {
  id: keyof Omit<RubricScores, "total_score">;
  label: string;
  weight: number; // 0-5
  description: string;
  rubricGuide: {
    poor: string;       // 1 pt
    acceptable: string; // 3 pts
    excellent: string;  // 5 pts
  };
}

export const OFFICIAL_HACKATHON_RUBRIC: RubricCriterion[] = [
  {
    id: "feasibility",
    label: "Feasibility & Viability",
    weight: 5,
    description: "Realistic execution, practical deployment feasibility, and clear real-world utility within constraints.",
    rubricGuide: {
      poor: "Impractical, ignores basic deployment realities, or completely unbounded scope.",
      acceptable: "Reasonable hackathon MVP with clear boundaries and realistic assumptions.",
      excellent: "Production-grade resilience, edge-ready architecture, and clear commercial or social viability.",
    },
  },
  {
    id: "originality",
    label: "Originality & Innovation",
    weight: 5,
    description: "Novelty of approach, creative problem solving, and distinct differentiation from existing tools.",
    rubricGuide: {
      poor: "Generic clone of a standard tutorial or well-worn product.",
      acceptable: "Interesting twist or domain adaptation of existing techniques.",
      excellent: "Breakthrough angle, highly creative integration of AI modalities, or pioneering workflow.",
    },
  },
  {
    id: "technical_depth",
    label: "Technical Depth & Complexity",
    weight: 5,
    description: "Architecture rigor, data pipeline sophistication, low latency, and mastery of technical stack.",
    rubricGuide: {
      poor: "Trivial wrapper with no backend logic or error resilience.",
      acceptable: "Solid multi-tier implementation with functioning APIs and clean state management.",
      excellent: "Complex multimodal pipelines, vector search with HNSW, real-time streaming, and robust failover.",
    },
  },
  {
    id: "ui_ux",
    label: "UI/UX Polish & Usability",
    weight: 5,
    description: "Intuitive user experience, aesthetic polish, dark-mode ergonomics, and smooth interactive demo flows.",
    rubricGuide: {
      poor: "Cluttered, broken layout, unintuitive navigation, or unstyled default HTML.",
      acceptable: "Clean functional interface with responsive controls and standard layout.",
      excellent: "State-of-the-art glassmorphic aesthetics, micro-animations, instant feedback, and seamless UX.",
    },
  },
  {
    id: "rules_compliance",
    label: "Rules & Track Alignment",
    weight: 5,
    description: "Strict adherence to hackathon track themes, sponsor requirements, and team eligibility guidelines.",
    rubricGuide: {
      poor: "Mismatched track, violation of time/team rules, or missing required sponsor components.",
      acceptable: "Satisfies all basic eligibility rules and aligns with the selected track.",
      excellent: "Flawless track alignment, maximum leverage of sponsor capabilities, and zero compliance risks.",
    },
  },
];

export function calculateTotalScore(scores: Omit<RubricScores, "total_score">): number {
  return (
    (scores.feasibility || 0) +
    (scores.originality || 0) +
    (scores.technical_depth || 0) +
    (scores.ui_ux || 0) +
    (scores.rules_compliance || 0)
  );
}
