import { createPortal } from 'react-dom';

export default function TestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="settings-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '20px',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      <div 
        className="settings-modal-content"
        style={{
          width: '90vw',
          maxHeight: '80vh',
          height: '80vh',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          backgroundColor: '#1C1B1F',
          color: '#E6E1E5',
          padding: '20px',
          borderRadius: '0',
          border: '1px solid #49454F',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Test Modal - Scroll Test</h3>
          <button 
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#E6E1E5',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <p>This is a test modal to check if scrolling works properly on mobile.</p>
          <p>Scroll down to see if you can reach the bottom content.</p>
        </div>
        
        {/* Add lots of content to force scrolling */}
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ 
            padding: '10px', 
            margin: '5px 0', 
            backgroundColor: i % 2 === 0 ? '#2D2D2D' : '#3D3D3D',
            borderRadius: '4px'
          }}>
            <h4>Section {i + 1}</h4>
            <p>This is test content for section {i + 1}. It should be scrollable on mobile devices.</p>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#6750A4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Test Button {i + 1}
            </button>
          </div>
        ))}
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#6750A4', 
          color: 'white', 
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <h3>🎯 Bottom Content - Can you see this?</h3>
          <p>If you can see this content, scrolling is working properly!</p>
          <button 
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#6750A4',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
