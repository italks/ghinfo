import React, { useState } from 'react';
import { Star, GitFork, Calendar, ExternalLink, Sparkles, Terminal } from 'lucide-react';
import { GitHubRepo } from '../types';
import { analyzeRepo } from '../services/geminiService';

interface RepoCardProps {
  repo: GitHubRepo;
  index: number;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, index }) => {
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
    <div className="mb-4 pl-2 border-l-2 border-terminal-border hover:border-terminal-accent transition-colors group">
      <div className="flex items-baseline gap-2">
        <span className="text-terminal-dim font-mono text-sm">[{index}]</span>
        <a 
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-lg text-blue-400 hover:text-blue-300 hover:underline font-semibold"
        >
          {repo.full_name}
        </a>
        {repo.private && <span className="text-xs border border-yellow-600 text-yellow-500 px-1 rounded">Private</span>}
      </div>

      <div className="pl-8 mt-1">
        <p className="text-terminal-fg text-sm opacity-90">
          {repo.description || "No description provided."}
        </p>

        {/* AI Analysis Section */}
        {analysis && (
          <div className="mt-2 p-2 bg-indigo-950/30 border-l-2 border-indigo-500 text-sm text-indigo-200 animate-in fade-in slide-in-from-top-1 font-mono">
            <div className="flex items-start gap-2">
              <Sparkles size={14} className="mt-1 shrink-0 text-indigo-400" />
              <div>
                <p><span className="text-indigo-400 font-bold">SUMMARY:</span> {analysis.summary}</p>
                <p><span className="text-indigo-400 font-bold">USE CASE:</span> {analysis.useCase}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-terminal-dim font-mono">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-terminal-accent"></span>
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star size={12} /> {repo.stargazers_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork size={12} /> {repo.forks_count.toLocaleString()}
          </span>
          <span>
            UPDATED: {formattedDate}
          </span>

          <button 
            onClick={handleAIAnalyze}
            disabled={loadingAI || !!analysis}
            className={`
              ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wider transition-colors
              ${analysis 
                ? 'border-transparent text-indigo-400 cursor-default' 
                : 'border-terminal-dim hover:border-indigo-500 hover:text-indigo-400 cursor-pointer'
              }
            `}
          >
            {loadingAI ? <span className="animate-pulse">Analyzing...</span> : analysis ? 'Analyzed' : '[ AI ANALYZE ]'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;