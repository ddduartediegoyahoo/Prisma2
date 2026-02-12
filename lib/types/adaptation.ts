export type AdaptationStatus = "pending" | "processing" | "completed" | "error";

export interface Adaptation {
  id: string;
  question_id: string;
  support_id: string;
  adapted_content: string | null;
  bncc_skills: string[] | null;
  bloom_level: string | null;
  bncc_analysis: string | null;
  bloom_analysis: string | null;
  status: AdaptationStatus;
  created_at: string;
}

export interface AdaptationWithSupport extends Adaptation {
  supports: { name: string } | null;
}
