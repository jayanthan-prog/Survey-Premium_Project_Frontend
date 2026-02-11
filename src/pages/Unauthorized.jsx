import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          @keyframes shadow {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.2); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.2; }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          .animate-shadow { animation: shadow 4s ease-in-out infinite; }
        `}
      </style>

      {/* Animated Illustration */}
      <div style={styles.imageWrapper}>
        <div className="animate-float">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V12C3 18 12 22 12 22C12 22 21 18 21 12V7L12 2Z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1"/>
            <circle cx="12" cy="11" r="3" stroke="#EF4444" strokeWidth="2"/>
            <path d="M12 14V17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Subtle shadow underneath the floating icon */}
        <div className="animate-shadow" style={styles.shadow}></div>
      </div>

      <h1 style={styles.title}>Access Restricted</h1>
      <p style={styles.message}>
        You don't have the permissions required to enter this zone.
      </p>

      <button onClick={() => navigate('/')} style={styles.button}>
        Return to Safety
      </button>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    fontFamily: "'-apple-system', 'Segoe UI', Roboto, sans-serif",
    textAlign: 'center',
    padding: '0 20px',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  shadow: {
    width: '100px',
    height: '15px',
    background: '#000',
    borderRadius: '50%',
    marginTop: '10px',
    filter: 'blur(8px)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  message: {
    fontSize: '1.1rem',
    color: '#6b7280',
    maxWidth: '400px',
    lineHeight: '1.5',
    margin: '0 0 30px 0',
  },
  button: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#111827',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};