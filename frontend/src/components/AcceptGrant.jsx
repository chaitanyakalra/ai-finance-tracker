import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import '../styles/AcceptGrant.css';

// Get backend URL from env and append /api
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_BASE_URL = `${BACKEND_URL}/api`;

export default function AcceptGrant() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [grant, setGrant] = useState(null);
    const [error, setError] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;
        acceptInvitation();
        
        return () => clearTimeout(window.redirectTimeout);
    }, []);

    const acceptInvitation = async () => {
        const token = searchParams.get('token');

        console.log('Accept Grant - Token:', token);
        console.log('Accept Grant - API URL:', `${API_BASE_URL}/invitations/accept?token=${token}`);

        if (!token) {
            setStatus('error');
            setError('Invalid invitation link. No token provided.');
            return;
        }

        try {
            // Call public endpoint (no auth required)
            const response = await axios.get(`${API_BASE_URL}/invitations/accept?token=${token}`);
            console.log('Accept Grant - Success:', response.data);
            setGrant(response.data.grant);
            setStatus('success');

            // Redirect to dashboard after 5 seconds (increased from 3)
            setTimeout(() => {
                navigate('/');
            }, 5000);
        } catch (err) {
            console.error('Accept invitation error:', err);
            console.error('Error response:', err.response?.data);
            
            // Check if user needs to sign up first
            if (err.response?.data?.requiresSignup) {
                // Store token to retry after login
                localStorage.setItem('pendingGrantToken', token);
                
                setStatus('requiresSignup');
                setStudentEmail(err.response.data.studentEmail);
                setError(err.response.data.error);
            } else {
                setStatus('error');
                setError(err.response?.data?.error || 'Failed to accept invitation. The link may have expired.');
            }
        }
    };

    console.log('AcceptGrant Render - Status:', status, 'Grant:', grant, 'Error:', error);

    return (
        <div className="accept-grant-page">
            <div className="accept-grant-card">
                {status === 'loading' && (
                    <div className="status-content">
                        <Loader className="spinner" size={64} />
                        <h2>Processing Invitation...</h2>
                        <p>Please wait while we activate your grant</p>
                    </div>
                )}

                {status === 'success' && grant && (
                    <div className="status-content success">
                        <CheckCircle size={64} color="#10b981" />
                        <h2>🎉 Grant Accepted!</h2>
                        <p>Your grant has been successfully activated</p>
                        
                        <div className="grant-summary">
                            <div className="summary-item">
                                <span className="label">Faculty:</span>
                                <span className="value">{grant.facultyName}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Grant Amount:</span>
                                <span className="value amount">₹{grant.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>

                        <p className="redirect-message">Redirecting to your dashboard...</p>
                    </div>
                )}

                {status === 'requiresSignup' && (
                    <div className="status-content error">
                        <XCircle size={64} color="#f59e0b" />
                        <h2>Account Required</h2>
                        <p className="error-message">{error}</p>
                        <p>Please sign up or log in with: <strong>{studentEmail}</strong></p>
                        <button onClick={() => navigate('/')} className="home-btn">
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="status-content error">
                        <XCircle size={64} color="#ef4444" />
                        <h2>Failed to Accept Grant</h2>
                        <p className="error-message">{error}</p>
                        <button onClick={() => navigate('/')} className="home-btn">
                            Go to Home
                        </button>
                    </div>
                )}

                {/* Fallback for unhandled status */}
                {!['loading', 'success', 'requiresSignup', 'error'].includes(status) && (
                    <div className="status-content error">
                        <p>Unknown Status: {status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
