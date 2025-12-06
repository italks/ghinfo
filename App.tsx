import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Command, Settings, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { searchRepositories, getAuthenticatedUser } from './services/githubService';
import { GitHubRepo, GitHubUser, SortOption } from './types';
import RepoCard from './components/RepoCard';
import SettingsModal from './components/SettingsModal';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gh_token'));
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Debounce ref
  // Changed NodeJS.Timeout to number because we are in a browser environment
  const searchTimeout = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial user fetch if token exists
  useEffect(() => {
    if (token) {
      getAuthenticatedUser(token)
        .then(setUser)
        .catch(() => {
          setToken(null);
          localStorage.removeItem('gh_token');
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIndex(-1);

    try {
      const data = await searchRepositories(searchQuery, token);
      setResults(data.items);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Debounced Search Effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = window.setTimeout(() => {
      handleSearch(query);
    }, 600); // 600ms debounce

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, handleSearch]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        window.open(results[selectedIndex].html_url, '_blank');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex]);

  const saveToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('gh_token', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('gh_token');
      setToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-fg font-sans selection:bg-terminal-accent selection:text-slate-900 flex flex-col">
      {/* Header / Nav */}
      <header className="border-b border-terminal-border bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-terminal-accent font-mono font-bold text-xl">
            <ChevronRight strokeWidth={3} />
            <span>ghinfo</span>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-sm font-mono text-terminal-dim hover:text-terminal-fg transition-colors"
          >
            {user ? (
              <span className="flex items-center gap-2">
                <img src={user.avatar_url} className="w-6 h-6 rounded-full border border-terminal-border" alt="" />
                {user.login}
              </span>
            ) : (
              <span>Guest (Rate Limited)</span>
            )}
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full flex flex-col">
        {/* Search Area */}
        <div className="relative mb-8 group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-terminal-accent">
            <ChevronRight size={20} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories..."
            className="w-full bg-slate-950 border border-terminal-border text-lg py-4 pl-12 pr-16 rounded-xl shadow-lg focus:outline-none focus:border-terminal-accent focus:ring-1 focus:ring-terminal-accent transition-all font-mono"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-terminal-dim border border-terminal-border px-2 py-1 rounded bg-slate-900">
            <Command size={10} /> <span>K</span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-4 px-2 text-sm text-terminal-dim font-mono">
          <span>STATUS: {loading ? <span className="text-yellow-400 animate-pulse">FETCHING...</span> : <span className="text-terminal-accent">READY</span>}</span>
          <span>{results.length} RESULTS FOUND</span>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="font-mono text-lg mb-2">Error Encountered</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1 pb-10">
              {results.map((repo, idx) => (
                <RepoCard 
                  key={repo.id}
                  repo={repo}
                  isSelected={idx === selectedIndex}
                  onSelect={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          ) : !loading && query ? (
            <div className="flex flex-col items-center justify-center py-20 text-terminal-dim">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-mono">No repositories found.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-terminal-dim opacity-50">
              <div className="font-mono text-sm space-y-2 text-center">
                <p>Type to search GitHub...</p>
                <p className="text-xs">Use <span className="border border-terminal-dim px-1 rounded">↑</span> <span className="border border-terminal-dim px-1 rounded">↓</span> to navigate</p>
                <p className="text-xs">Press <span className="border border-terminal-dim px-1 rounded">Enter</span> to open</p>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-terminal-accent" size={32} />
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        token={token}
        onSaveToken={saveToken}
        user={user}
      />
    </div>
  );
}

export default App;