import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, LogOut } from 'lucide-react';
import { getAuthenticatedUser } from '../services/githubService';
import { GitHubUser } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onSaveToken: (token: string | null) => void;
  user: GitHubUser | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, token, onSaveToken, user }) => {
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputToken(token || '');
      setError('');
    }
  }, [isOpen, token]);

  const handleSave = async () => {
    if (!inputToken.trim()) {
      onSaveToken(null);
      onClose();
      return;
    }

    setVerifying(true);
    setError('');
    try {
      // Verify token by fetching user
      await getAuthenticatedUser(inputToken);
      onSaveToken(inputToken);
      onClose();
    } catch (err) {
      setError('Invalid Token or Network Error');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    onSaveToken(null);
    setInputToken('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-terminal-bg border border-terminal-border rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-slate-900">
          <h2 className="text-terminal-fg font-mono font-semibold flex items-center gap-2">
            <Key size={18} /> Authentication
          </h2>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-fg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {user ? (
            <div className="flex items-center justify-between bg-terminal-accent/10 border border-terminal-accent/30 p-3 rounded">
              <div className="flex items-center gap-3">
                <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-terminal-accent" />
                <div>
                  <p className="text-terminal-fg font-bold">{user.login}</p>
                  <p className="text-xs text-terminal-accent flex items-center gap-1">
                    <ShieldCheck size={12} /> Authenticated
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-400/10 transition"
                title="Logout / Clear Token"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-terminal-dim mb-2 font-mono">GitHub Personal Access Token</label>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-terminal-border text-terminal-fg p-3 rounded focus:outline-none focus:border-terminal-accent font-mono text-sm"
              />
              <p className="text-xs text-terminal-dim mt-2">
                Generate a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-terminal-accent underline">github.com/settings/tokens</a> with `repo` scope to see private repositories.
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm font-mono border-l-2 border-red-500 pl-2">
              Error: {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-terminal-border bg-slate-900 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-terminal-dim hover:text-terminal-fg transition-colors font-mono"
          >
            Cancel
          </button>
          {!user && (
            <button 
              onClick={handleSave}
              disabled={verifying}
              className="px-4 py-2 bg-terminal-accent text-slate-900 font-bold rounded hover:bg-green-400 transition-colors font-mono text-sm disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Save Token'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
