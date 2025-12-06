export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: GitHubUser;
  updated_at: string;
  topics: string[];
  private: boolean;
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export enum SortOption {
  BestMatch = '',
  Stars = 'stars',
  Forks = 'forks',
  Updated = 'updated'
}

export interface AIAnalysisResult {
  summary: string;
  useCase: string;
}
