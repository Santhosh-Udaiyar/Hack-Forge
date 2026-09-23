export type PersonaMode = 
  | 'mentor'
  | 'voice'
  | 'ideation'
  | 'architecture'
  | 'research'
  | 'validator'
  | 'judge'
  | 'pitch';

export type ProjectStatus = 'ideation' | 'in_progress' | 'submitted' | 'judged';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  summary?: string;
  tech_stack: string[];
  track?: string;
  status: ProjectStatus;
  message_count?: number;
  sources_count?: number;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  user_id?: string;
  title: string;
  file_type: 'hackathon_rules' | 'project_spec' | 'technical_doc';
  file_path?: string;
  file_size?: number;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  chunk_count: number;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  project_id: string;
  user_id?: string;
  content: string;
  embedding?: number[];
  page_number?: number;
  char_start?: number;
  char_end?: number;
  similarity?: number;
  doc_title?: string;
  doc_type?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface Citation {
  chunk_id: string;
  citation_number: number;
  score: number; // 0 to 1
  source_doc: string;
  page_number?: number;
  char_start?: number;
  char_end?: number;
  excerpt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  project_id?: string;
  user_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  tokens_used?: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  user_id?: string;
  mode: PersonaMode;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface RubricScores {
  feasibility: number;       // 0 - 5
  originality: number;       // 0 - 5
  technical_depth: number;   // 0 - 5
  ui_ux: number;             // 0 - 5
  rules_compliance: number;  // 0 - 5
  total_score: number;       // 0 - 25
}

export interface JudgeRun {
  id: string;
  project_id: string;
  user_id?: string;
  run_number: 1 | 2;
  prompt_framing: string;
  rubric_scores: RubricScores;
  reasoning: string;
  cited_chunk_ids: string[];
  created_at: string;
}

export interface JudgeVerdict {
  id: string;
  project_id: string;
  user_id?: string;
  final_scores: RubricScores;
  confidence: 'high' | 'low';
  disagreement_delta: number;
  disagreement_notes?: string;
  run_1?: JudgeRun;
  run_2?: JudgeRun;
  created_at: string;
}

export interface ProjectMemory {
  id: string;
  project_id: string;
  user_id?: string;
  summary: string;
  key_facts: {
    tech_stack: string[];
    constraints: string[];
    target_user: string;
    stage: 'ideation' | 'prototyping' | 'building' | 'polishing' | 'pitch_ready';
    core_problem?: string;
    unique_value_prop?: string;
  };
  milestones?: Array<{ title: string; completed: boolean }>;
  updated_at: string;
}

export interface PitchFeedback {
  clarity_score: number; // 0-10
  structure_score: number; // 0-10
  timing_score: number; // 0-10
  delivery_score: number; // 0-10
  key_strengths: string[];
  critical_gaps: string[];
  judge_followup_questions: string[];
  overall_assessment: string;
}
