import React, { useState } from 'react';

export default function HeaderConfirmBanner({ detection, headers, onChangeHeader, onDismiss }) {
  const [showPicker, setShowPicker] = useState(false);
  const { confidence, score, headerIndex, alternatives = [], lines = [] } = detection || {};
  
  if (!detection) return null;
  
  // Get headers either from props or parse from the line
  const displayHeaders = headers || (lines[headerIndex] ? lines[headerIndex].split(/[,\t|;]/).map(h => h.trim()) : []);

  const getConfidenceColor = () => {
    if (confidence === 'high') return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)', text: 'rgb(34, 197, 94)' };
    if (confidence === 'medium') return { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgb(251, 191, 36)', text: 'rgb(251, 191, 36)' };
    return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgb(239, 68, 68)', text: 'rgb(239, 68, 68)' };
  };

  const colors = getConfidenceColor();

  return (
    <>
      <div 
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          animation: 'slideDown 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}>
            {confidence === 'high' ? '✓' : confidence === 'medium' ? '⚡' : '?'}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                Header Row Detected
              </h4>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                borderRadius: '6px',
                background: colors.border,
                color: 'white',
                fontWeight: 600
              }}>
                Row {headerIndex + 1}
              </span>
              <span style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.2)',
                color: colors.text,
                fontWeight: 500
              }}>
                {score}% confidence
              </span>
            </div>
            
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.8 }}>
              {confidence === 'high' && "We're confident this is your header row."}
              {confidence === 'medium' && "This looks like a header row, but you may want to verify."}
              {confidence === 'low' && "Header detection uncertain. Please verify the selection."}
            </p>

            <div style={{ 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: '8px', 
              padding: '10px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ 
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                {lines[headerIndex]?.split(/[,\t|;]/).slice(0, 6).map((header, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    whiteSpace: 'nowrap'
                  }}>
                    {header.trim()}
                  </span>
                ))}
                {lines[headerIndex]?.split(/[,\t|;]/).length > 6 && (
                  <span style={{ opacity: 0.6, padding: '3px 8px' }}>
                    +{lines[headerIndex].split(/[,\t|;]/).length - 6} more
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: `1.5px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Change Header Row
              </button>
              
              {confidence === 'high' && (
                <button
                  onClick={onDismiss}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: 'none',
                    background: 'rgba(0,0,0,0.1)',
                    color: 'inherit',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.15)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
                >
                  Looks Good
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowPicker(false)}
        >
          <div 
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                Select Header Row
              </h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                Choose which row contains your column headers
              </p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {lines.slice(0, 10).map((line, idx) => {
                const isSelected = idx === headerIndex;
                const altScore = alternatives.find(a => a.index === idx)?.score;
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onChangeHeader(idx);
                      setShowPicker(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      marginBottom: '8px',
                      border: isSelected ? `2px solid ${colors.border}` : '1px solid var(--border)',
                      background: isSelected ? colors.bg : 'var(--card)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = 'var(--brand)';
                        e.target.style.background = 'var(--muted)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.background = 'var(--card)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isSelected ? colors.border : 'var(--muted)',
                        color: isSelected ? 'white' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '11px', color: colors.text, fontWeight: 600 }}>
                          CURRENT
                        </span>
                      )}
                      {altScore && (
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'var(--muted)',
                          opacity: 0.7
                        }}>
                          {Math.round(altScore)}% match
                        </span>
                      )}
                    </div>
                    <code style={{ 
                      fontSize: '12px', 
                      fontFamily: 'monospace',
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {line}
                    </code>
                  </button>
                );
              })}
            </div>

            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}