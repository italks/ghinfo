import { SearchResponse, SortOption, GitHubUser } from '../types';

const BASE_URL = 'https://api.github.com';

export const searchRepositories = async (
  query: string,
  token: string | null,
  sort: SortOption = SortOption.BestMatch,
  page: number = 1
): Promise<SearchResponse> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const queryParams = new URLSearchParams({
    q: query,
    page: page.toString(),
    per_page: '10',
  });

  if (sort) {
    queryParams.append('sort', sort);
  }

  const response = await fetch(`${BASE_URL}/search/repositories?${queryParams.toString()}`, {
    headers
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Rate limit exceeded. Please add a Personal Access Token in settings.");
    }
    if (response.status === 401) {
      throw new Error("Invalid Personal Access Token.");
    }
    throw new Error(`GitHub API Error: ${response.statusText}`);
  }

  return response.json();
};

export const getAuthenticatedUser = async (token: string): Promise<GitHubUser> => {
  const response = await fetch(`${BASE_URL}/user`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (!response.ok) {
     throw new Error("Failed to fetch user");
  }

  return response.json();
};
