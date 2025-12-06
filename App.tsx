import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { searchRepositories, getAuthenticatedUser } from './services/githubService';
import { GitHubRepo, GitHubUser } from './types';
import RepoCard from './components/RepoCard';
import SettingsModal from './components/SettingsModal';

type LineType = 'input' | 'output' | 'error' | 'component' | 'system';

interface TerminalLine {
  id: string;
  type: LineType;
  content: React.ReactNode;
  timestamp: number;
}

function App() {
  // Terminal State
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gh_token'));
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial Boot
  useEffect(() => {
    addSystemLine(
      <div className="mb-4">
        <pre className="text-terminal-accent font-bold leading-tight">
{`
   _____ _____ _____ _   _ ______ ____  
  / ____/ ____|_   _| \\ | |  ____/ __ \\ 
 | (___| (___   | | |  \\| | |__ | |  | |
  \\___ \\\\___ \\  | | | . \` |  __|| |  | |
  ____) |___) |_| |_| |\\  | |   | |__| |
 |_____/_____/|_____|_| \\_|_|    \\____/ 
`}
        </pre>
        <p className="mt-2 text-terminal-fg">v1.0.0 -- Node.js GitHub Explorer</p>
        <p className="text-terminal-dim">Type <span className="text-white font-bold">help</span> to see available commands.</p>
        <p className="text-terminal-dim">Try <span className="text-white font-bold">ssinfo react</span> to search.</p>
        <div className="w-full h-px bg-terminal-border my-4"></div>
      </div>
    );
  }, []);

  // Auth Effect
  useEffect(() => {
    if (token) {
      getAuthenticatedUser(token)
        .then((u) => {
          setUser(u);
          addSystemLine(`Logged in as ${u.login}`);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('gh_token');
          addErrorLine("Session expired. Please login again.");
        });
    }
  }, [token]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus Input
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    window.addEventListener('click', focusInput);
    return () => window.removeEventListener('click', focusInput);
  }, []);

  const addLine = (type: LineType, content: React.ReactNode) => {
    setLines(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: Date.now()
    }]);
  };

  const addSystemLine = (content: React.ReactNode) => addLine('system', content);
  const addErrorLine = (content: string) => addLine('error', content);

  const handleCommand = async (cmdString: string) => {
    const trimmed = cmdString.trim();
    if (!trimmed) return;

    // Add to input history
    addLine('input', trimmed);
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputValue('');

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argsString = args.join(' ');

    setIsProcessing(true);

    try {
      switch (command) {
        case 'help':
          addSystemLine(
            <div className="space-y-1 text-terminal-dim">
              <p><span className="text-terminal-accent font-bold">ssinfo &lt;query&gt;</span>  Search repositories (e.g., 'ssinfo react')</p>
              <p><span className="text-terminal-accent font-bold">login</span>           Open authentication settings</p>
              <p><span className="text-terminal-accent font-bold">logout</span>          Clear authentication token</p>
              <p><span className="text-terminal-accent font-bold">clear</span>           Clear terminal history</p>
              <p><span className="text-terminal-accent font-bold">whoami</span>          Show current user</p>
            </div>
          );
          break;

        case 'clear':
          setLines([]);
          break;

        case 'whoami':
          if (user) {
            addSystemLine(`User: ${user.login} (${user.html_url})`);
          } else {
            addSystemLine("Not logged in. Guest mode.");
          }
          break;

        case 'login':
          setIsSettingsOpen(true);
          break;

        case 'logout':
          setToken(null);
          setUser(null);
          localStorage.removeItem('gh_token');
          addSystemLine("Logged out successfully.");
          break;

        case 'ssinfo':
          if (!argsString) {
            addErrorLine("Usage: ssinfo <query>");
            break;
          }
          await executeSearch(argsString);
          break;

        default:
          addErrorLine(`Command not found: ${command}. Type 'help' for available commands.`);
      }
    } catch (err: any) {
      addErrorLine(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSearch = async (query: string) => {
    addSystemLine(<span className="animate-pulse text-yellow-400">Searching GitHub for "{query}"...</span>);
    
    try {
      const data = await searchRepositories(query, token);
      
      if (data.items.length === 0) {
        addSystemLine("No repositories found.");
      } else {
        addLine('component', (
          <div className="mt-2 mb-4">
             <div className="text-terminal-dim text-xs mb-2">FOUND {data.total_count} RESULTS (Showing Top {data.items.length})</div>
            {data.items.map((repo, idx) => (
              <RepoCard key={repo.id} repo={repo} index={idx + 1} />
            ))}
          </div>
        ));
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      } else {
        setInputValue('');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-fg font-mono p-4 md:p-8 selection:bg-terminal-accent selection:text-slate-900 cursor-text" onClick={() => inputRef.current?.focus()}>
      <div className="max-w-4xl mx-auto">
        {/* Terminal Output */}
        <div className="space-y-1">
          {lines.map((line) => (
            <div key={line.id} className="break-words">
              {line.type === 'input' && (
                <div className="flex items-start gap-2 text-terminal-fg">
                  <span className="text-terminal-accent shrink-0 font-bold">
                    {user ? `${user.login}@ssinfo:~$` : 'guest@ssinfo:~$'}
                  </span>
                  <span>{line.content}</span>
                </div>
              )}
              {line.type === 'error' && (
                <div className="text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} /> {line.content}
                </div>
              )}
              {line.type === 'system' && (
                <div className="text-terminal-dim">
                  {line.content}
                </div>
              )}
              {line.type === 'component' && (
                <div className="w-full">
                  {line.content}
                </div>
              )}
            </div>
          ))}
          
          {/* Active Input Line */}
          <div className="flex items-start gap-2 text-terminal-fg pt-1">
            <span className="text-terminal-accent shrink-0 font-bold">
              {user ? `${user.login}@ssinfo:~$` : 'guest@ssinfo:~$'}
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none outline-none p-0 text-terminal-fg font-mono caret-terminal-accent"
                autoComplete="off"
                spellCheck={false}
                disabled={isProcessing}
              />
            </div>
            {isProcessing && <Loader2 className="animate-spin text-terminal-accent" size={16} />}
          </div>
        </div>

        <div ref={bottomRef} />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        token={token}
        onSaveToken={(t) => {
          if (t) {
            setToken(t);
            localStorage.setItem('gh_token', t);
          } else {
            setToken(null);
            localStorage.removeItem('gh_token');
          }
        }}
        user={user}
      />
    </div>
  );
}

export default App;