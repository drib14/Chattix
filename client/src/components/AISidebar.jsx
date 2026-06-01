import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Search, X, Loader, MessageSquare, ArrowRight, CornerUpLeft } from 'lucide-react';

export default function AISidebar({ className = '', onClose }) {
  const { currentChat, getAIConversationSummary, semanticSearchAPI, showToast } = useApp();
  
  // Summary States
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // Semantic Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Trigger summary generation on mount if a chat is active
  useEffect(() => {
    if (currentChat) {
      handleGenerateSummary();
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [currentChat]);

  // Generate conversation summary via Gemini
  const handleGenerateSummary = async () => {
    if (!currentChat) return;
    setLoadingSummary(true);
    setSummary('');

    const res = await getAIConversationSummary(currentChat._id);
    setLoadingSummary(false);

    if (res.success) {
      setSummary(res.summary);
    } else {
      setSummary('Failed to retrieve summary. Please verify Gemini API connectivity.');
    }
  };

  // Perform semantic search via Gemini
  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !currentChat) return;

    setSearching(true);
    setSearchResults([]);
    showToast('Gemini is searching contextually...', 'info');

    const res = await semanticSearchAPI(currentChat._id, searchQuery);
    setSearching(false);

    if (res.success) {
      setSearchResults(res.results);
      if (res.results.length === 0) {
        showToast('No semantically matching messages found.', 'info');
      } else {
        showToast(`Found ${res.results.length} semantic matches!`, 'success');
      }
    } else {
      showToast('Search query failed.', 'error');
    }
  };

  // Helper to parse dates
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple Markdown-like bullet parsing for the summary text
  const renderFormattedSummary = (rawText) => {
    if (!rawText) return null;
    
    // Split lines
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '4px' }}>{trimmed.replace('###', '').trim()}</h3>;
      }
      if (trimmed.startsWith('##')) {
        return <h2 key={idx} style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '14px', marginBottom: '6px' }}>{trimmed.replace('##', '').trim()}</h2>;
      }
      if (trimmed.startsWith('#')) {
        return <h1 key={idx} style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-purple)', marginTop: '16px', marginBottom: '8px' }}>{trimmed.replace('#', '').trim()}</h1>;
      }
      
      // Bullets
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <ul key={idx} style={{ paddingLeft: '16px', margin: '4px 0' }}>
            <li style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
              {trimmed.substring(1).trim()}
            </li>
          </ul>
        );
      }
      
      // Normal lines
      return trimmed ? (
        <p key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '6px 0' }}>
          {trimmed}
        </p>
      ) : <br key={idx} />;
    });
  };

  return (
    <div className={`ai-sidebar glass-panel ${className}`} style={{ borderLeft: '1px solid var(--glass-border)' }}>
      {/* Header */}
      <div className="ai-sidebar-header">
        <Sparkles size={18} />
        <h2 style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '-0.2px', flex: 1 }}>Gemini AI Assistant</h2>
        <button className="icon-btn" onClick={onClose} title="Close Sidebar"><X size={18} /></button>
      </div>

      <div className="ai-sidebar-body">
        {/* SECTION 1: AI RECAP SUMMARY */}
        <div className="ai-section-box glow-cyan">
          <div className="ai-section-title">
            <Sparkles size={13} style={{ color: 'var(--accent-cyan)' }} />
            Thread Summary
          </div>
          
          {loadingSummary ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px' }}>
              <Loader size={20} className="dot" style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Synthesizing chat thread...</span>
            </div>
          ) : (
            <div>
              <div className="ai-summary-text">
                {renderFormattedSummary(summary)}
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '11px', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '6px' }}
                onClick={handleGenerateSummary}
              >
                Recalculate Summary
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: AI SEMANTIC SEARCH */}
        <div className="ai-section-box">
          <div className="ai-section-title">
            <Search size={13} style={{ color: 'var(--accent-purple)' }} />
            Semantic Search
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
            Search by meaning. E.g., asking "credentials" finds passwords or secrets even if spelling varies.
          </p>

          <form onSubmit={handleSemanticSearch} style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <input
              className="glass-input"
              style={{ flex: 1, fontSize: '12px', padding: '8px 12px', borderRadius: '6px' }}
              type="text"
              placeholder="Query message intent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button
              className="btn-primary"
              type="submit"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', boxShadow: 'none' }}
              disabled={searching}
            >
              {searching ? <Loader size={12} style={{ animation: 'spin 2s linear infinite' }} /> : <ArrowRight size={14} />}
            </button>
          </form>

          {/* Search matches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <span className="typing-text" style={{ fontSize: '11px' }}>Scanning message history context...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((msg) => (
                <div
                  key={msg._id}
                  className="glass-panel"
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    animation: 'scaleUp 0.2s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                      @{msg.sender.username}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineBreak: 'anywhere' }}>
                    {msg.content}
                  </p>
                </div>
              ))
            ) : searchQuery && !searching ? (
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '10px 0' }}>
                No semantic matches found.
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Keyframes inject for spinning loaders */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
