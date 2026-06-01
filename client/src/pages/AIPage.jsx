import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, CheckSquare, Calendar, Compass, Loader, RefreshCw } from 'lucide-react';

export default function AIPage() {
  const {
    currentChat,
    getAIConversationSummary,
    extractAIActions,
    fetchAIInsights,
    showToast
  } = useApp();

  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [actionList, setActionList] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const loadAIData = async () => {
    if (!currentChat) return;

    // Load recap summary
    setLoadingSummary(true);
    const sumRes = await getAIConversationSummary(currentChat._id);
    setLoadingSummary(false);
    if (sumRes?.success) setSummary(sumRes.summary);

    // Load extracted tasks & deadlines
    setLoadingActions(true);
    const actRes = await extractAIActions(currentChat._id);
    setLoadingActions(false);
    if (actRes?.success) setActionList(actRes.actions);

    // Load Insights
    setLoadingInsights(true);
    const insRes = await fetchAIInsights(currentChat._id);
    setLoadingInsights(false);
    if (insRes?.success) setInsights(insRes.insights);
  };

  useEffect(() => {
    if (currentChat) {
      loadAIData();
    }
  }, [currentChat]);

  // Task completed simulation
  const handleToggleTask = (idx) => {
    setActionList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
    );
    showToast('Task state updated!', 'success');
  };

  // Simple Markdown Parsing Helper for AI summary output
  const renderMarkdown = (text) => {
    if (!text) return <span style={{ color: 'var(--text-muted)' }}>Select a conversation room in the sidebar to synchronize AI Workspace.</span>;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginTop: '10px', marginBottom: '4px' }}>{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '12px', marginBottom: '6px' }}>{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-purple)', marginTop: '15px', marginBottom: '8px' }}>{trimmed.replace('#', '').trim()}</h2>;
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <ul key={idx} style={{ paddingLeft: '15px', margin: '4px 0' }}>
            <li style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{trimmed.substring(1).trim()}</li>
          </ul>
        );
      }
      return trimmed ? <p key={idx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '4px 0' }}>{trimmed}</p> : <br key={idx} />;
    });
  };

  return (
    <div className="hub-page glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '25px', animation: 'scaleUp 0.25s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
        <Sparkles className="text-cyan-glowing" size={24} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Chattix AI Workspace</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Review automatically extracted appointments, team metrics, daily summaries, and insight reports.</p>
        </div>
      </div>

      {!currentChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', padding: '50px 0' }}>
          <Sparkles size={40} style={{ opacity: 0.2, animation: 'pulse 2s infinite' }} />
          <h3 style={{ fontSize: '16px', color: 'white' }}>No Active Chat Session</h3>
          <p style={{ fontSize: '12px', maxWidth: '300px', textAlign: 'center', lineHeight: '1.5' }}>
            Choose a private or group chat thread in the left-hand chats list first to load Chattix AI analysis tools for that conversation context.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* LEFT COLUMN: SUMMARY & INSIGHT REPORTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* THREAD RECAP SUMMARY */}
            <div className="ai-section-box glow-cyan" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--accent-cyan)" /> Synthesized Chat Thread Recap
                </h3>
                <button className="icon-btn" title="Recalculate AI Summary" onClick={loadAIData} disabled={loadingSummary}>
                  <RefreshCw size={13} style={{ animation: loadingSummary ? 'spin 2s linear infinite' : 'none' }} />
                </button>
              </div>

              {loadingSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: '8px' }}>
                  <Loader size={20} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Synthesizing thread metadata...</span>
                </div>
              ) : (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)', minHeight: '100px' }}>
                  {renderMarkdown(summary)}
                </div>
              )}
            </div>

            {/* PLATFORM INSIGHTS */}
            <div className="ai-section-box" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={16} color="var(--accent-purple)" /> Communication Dynamics Insights
                </h3>
              </div>

              {loadingInsights ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: '8px' }}>
                  <Loader size={20} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Analyzing chat logs...</span>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  {renderMarkdown(insights)}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTION ITEMS EXTRACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="ai-section-box glow-purple" style={{ margin: 0, padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} color="var(--accent-purple)" /> AI Extracted Action Items & Reminders
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 15px 0' }}>
                Our background AI engine scans the active room for explicit tasks, appointments, and deadlines, extracting them automatically below:
              </p>

              {loadingActions ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', gap: '8px' }}>
                  <Loader size={20} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-purple)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting actions...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '350px' }}>
                  {actionList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '30px 0' }}>
                      No tasks or appointments detected in recent conversation.
                    </div>
                  ) : (
                    actionList.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleTask(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          background: item.completed ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)',
                          border: item.completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--glass-border)',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          transition: 'all 0.15s ease-out'
                        }}
                      >
                        <div style={{ marginTop: '2px', width: '16px', height: '16px', border: item.completed ? '1px solid #10b981' : '1px solid var(--text-muted)', borderRadius: '4px', background: item.completed ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.completed && <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>✓</span>}
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '500', color: item.completed ? 'var(--text-muted)' : 'white' }}>{item.content}</span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ fontSize: '9.5px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: '3px' }}>
                              Assignee: <strong>{item.assignee}</strong>
                            </span>
                            <span style={{ fontSize: '9.5px', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)', padding: '1px 5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar size={8} /> {item.dueDate !== 'N/A' ? item.dueDate : 'No Date'}
                            </span>
                            <span style={{ fontSize: '9.5px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '3px' }}>
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
