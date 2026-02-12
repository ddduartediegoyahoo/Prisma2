export interface AiModel {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  model_id: string;
  enabled: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Support {
  id: string;
  name: string;
  agent_id: string;
  model_id: string | null;
  enabled: boolean;
  created_at: string;
}
