import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Auth Callback Component
 * Handles the OAuth callback from Google and stores tokens
 */
function AuthCallback() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Completing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Starting authentication callback...');
        console.log('🔐 AuthCallback: Current URL:', window.location.href);
        
        // Get tokens from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('accessToken');
        const refreshToken = urlParams.get('refreshToken');
        const userId = urlParams.get('userId');
        const error = urlParams.get('error');

        console.log('🔐 AuthCallback: URL Params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUserId: !!userId,
          hasError: !!error,
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length,
          userId: userId
        });

        // Check for errors
        if (error) {
          console.error('🔐 AuthCallback: Error in URL params:', error);
          setStatus('error');
          setMessage(getErrorMessage(error));
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }

        // Check if tokens are present
        if (!accessToken || !refreshToken || !userId) {
          console.error('🔐 AuthCallback: Missing tokens!', {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken,
            userId: !!userId
          });
          setStatus('error');
          setMessage('Authentication failed. Missing tokens.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
          return;
        }

        console.log('🔐 AuthCallback: Tokens received, storing in localStorage...');
        
        // Store tokens in localStorage
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', userId);

        // Verify tokens were stored
        const storedToken = localStorage.getItem('authToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUserId = localStorage.getItem('userId');
        
        console.log('🔐 AuthCallback: Tokens stored! Verification:', {
          authTokenStored: !!storedToken,
          refreshTokenStored: !!storedRefreshToken,
          userIdStored: !!storedUserId,
          authTokenLength: storedToken?.length,
          authTokenPreview: storedToken ? `${storedToken.substring(0, 20)}...` : 'null'
        });

        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          console.log('🔐 AuthCallback: Redirecting to dashboard...');
          navigate('/dashboard');
        }, 1500);
      } catch (error) {
        console.error('🔐 AuthCallback: Error occurred:', error);
        setStatus('error');
        setMessage('An error occurred during authentication.');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  const getErrorMessage = (error) => {
    const errorMessages = {
      no_code: 'No authorization code received from Google.',
      oauth_not_configured: 'OAuth is not properly configured on the server.',
      authentication_failed: 'Authentication failed. Please try again.',
    };
    return errorMessages[error] || 'An unknown error occurred.';
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        {status === 'processing' && (
          <>
            <Loader2 className="auth-spinner" />
            <h2>Authenticating...</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="auth-success-icon" />
            <h2>Success!</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="auth-error-icon" />
            <h2>Authentication Failed</h2>
            <p>{message}</p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/')}
              style={{ marginTop: '1rem' }}
            >
              Go Back
            </button>
          </>
        )}
      </div>

      <style>{`
        .auth-callback-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .auth-callback-card {
          background: white;
          border-radius: 1rem;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 100%;
        }

        .auth-spinner {
          width: 48px;
          height: 48px;
          margin: 0 auto 1.5rem;
          color: #667eea;
          animation: spin 1s linear infinite;
        }

        .auth-success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          color: #10b981;
        }

        .auth-error-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          color: #ef4444;
        }

        .auth-callback-card h2 {
          margin: 0 0 0.5rem;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .auth-callback-card p {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default AuthCallback;

