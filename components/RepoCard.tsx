import React, { useState } from 'react';
import { Star, GitFork, Calendar, ExternalLink, Sparkles, Terminal } from 'lucide-react';
import { GitHubRepo } from '../types';
import { analyzeRepo } from '../services/geminiService';

interface RepoCardProps {
  repo: GitHubRepo;
  isSelected: boolean;
  onSelect: () => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, isSelected, onSelect }) => {
  const [analysis, setAnalysis] = useState<{ summary: string; useCase: string } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleAIAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analysis) return; // Already analyzed
    
    setLoadingAI(true);
    try {
      const result = await analyzeRepo(repo);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const formattedDate = new Date(repo.updated_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      onClick={onSelect}
      className={`
        group relative p-4 mb-3 border rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-terminal-accent bg-terminal-accent/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
          : 'border-terminal-border bg-slate-900/50 hover:border-terminal-dim'
        }
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-terminal-accent hidden md:block">
          <Terminal size={20} />
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className={`font-mono text-lg font-semibold flex items-center gap-2 ${isSelected ? 'text-terminal-accent' : 'text-terminal-fg'}`}>
            {repo.full_name}
            {repo.private && <span className="text-xs border border-yellow-600 text-yellow-500 px-1 rounded ml-2">Private</span>}
          </h3>
          <p className="text-terminal-dim text-sm mt-1 line-clamp-2">
            {repo.description || "No description provided."}
          </p>
        </div>
        <div className="ml-4 flex flex-col items-end gap-2">
           <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs flex items-center gap-1 text-terminal-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
          >
            OPEN <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* AI Analysis Section */}
      {analysis && (
        <div className="mt-3 p-3 bg-slate-950/80 border border-indigo-500/30 rounded text-sm text-indigo-200 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-1 shrink-0 text-indigo-400" />
            <div>
              <p className="font-semibold text-indigo-400">AI Insight:</p>
              <p>{analysis.summary}</p>
              <p className="text-xs mt-1 opacity-75">Target: {analysis.useCase}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-terminal-dim font-mono">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star size={14} /> {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={14} /> {repo.forks_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {formattedDate}
        </span>

        <button 
          onClick={handleAIAnalyze}
          disabled={loadingAI || !!analysis}
          className={`
            ml-auto flex items-center gap-1 px-2 py-1 rounded border transition-colors
            ${analysis 
              ? 'border-indigo-500/50 text-indigo-400 cursor-default' 
              : 'border-terminal-border hover:border-indigo-500 hover:text-indigo-400 text-terminal-dim'
            }
          `}
        >
          <Sparkles size={12} />
          {loadingAI ? 'Analyzing...' : analysis ? 'Analyzed' : 'AI Explain'}
        </button>
      </div>
    </div>
  );
};

export default RepoCard;
