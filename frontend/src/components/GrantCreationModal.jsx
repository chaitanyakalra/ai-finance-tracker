import { useState } from 'react';
import { X, Mail, DollarSign, Loader } from 'lucide-react';
import { apiService } from '../utils/api';
import '../styles/GrantCreationModal.css';

export default function GrantCreationModal({ onClose, onGrantCreated }) {
    const [studentEmail, setStudentEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!studentEmail || !amount) {
            setError('Please fill in all fields');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.createGrant({
                studentEmail,
                amount: amountNum
            });

            onGrantCreated(response.data.grant);
            onClose();
        } catch (err) {
            console.error('Create grant error:', err);
            setError(err.response?.data?.error || 'Failed to create grant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content grant-creation-modal">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2>Create Grant</h2>
                <p className="modal-subtitle">Award a grant to a student for bill reimbursement</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <Mail size={18} />
                            Student Email
                        </label>
                        <input
                            type="email"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="student@university.edu"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <DollarSign size={18} />
                            Grant Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="10000"
                            min="1"
                            step="0.01"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="spinner" size={18} />
                                    Creating...
                                </>
                            ) : (
                                'Create Grant'
                            )}
                        </button>
                    </div>
                </form>

                <div className="grant-info">
                    <p><strong>Note:</strong> An invitation email will be sent to the student with a link to accept the grant.</p>
                </div>
            </div>
        </div>
    );
}
