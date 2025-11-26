import { useState, useEffect } from 'react';
import { Users, DollarSign, CheckCircle, XCircle, AlertTriangle, Loader, FileText } from 'lucide-react';
import { apiService } from '../utils/api';
import GrantCreationModal from './GrantCreationModal';
import '../styles/FacultyDashboard.css';

export default function FacultyDashboard() {
    const [grants, setGrants] = useState([]);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [studentBills, setStudentBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingBillId, setRejectingBillId] = useState(null);
    const [viewingBill, setViewingBill] = useState(null);

    useEffect(() => {
        loadGrants();
    }, []);

    // Auto-refresh bills if there are pending ones
    useEffect(() => {
        if (!selectedGrant) return;

        const hasPendingBills = studentBills.some(bill => bill.status === 'pending');
        
        if (hasPendingBills) {
            const interval = setInterval(() => {
                console.log('Auto-refreshing bills...');
                loadStudentBills(selectedGrant._id, selectedGrant.studentId?._id);
            }, 5000); // Refresh every 5 seconds

            return () => clearInterval(interval);
        }
    }, [selectedGrant, studentBills]);

    const loadGrants = async () => {
        try {
            const response = await apiService.getMyGrants();
            setGrants(response.data.grants || []);
        } catch (error) {
            console.error('Load grants error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudentBills = async (grantId, studentId) => {
        try {
            const response = await apiService.getGrantBills(grantId);
            console.log('Grant bills:', response.data.bills);
            setStudentBills(response.data.bills);
        } catch (error) {
            console.error('Load student bills error:', error);
            setStudentBills([]);
        }
    };

    const handleGrantClick = (grant) => {
        setSelectedGrant(grant);
        if (grant.studentId) {
            loadStudentBills(grant._id, grant.studentId._id);
        }
    };

    const handleApproveBill = async (billId) => {
        if (!confirm('Are you sure you want to approve this bill?')) return;

        try {
            await apiService.approveBill(billId);
            alert('Bill approved successfully!');
            loadStudentBills(selectedGrant._id, selectedGrant.studentId._id);
            loadGrants(); // Refresh grant balances
        } catch (error) {
            console.error('Approve bill error:', error);
            alert(error.response?.data?.error || 'Failed to approve bill');
        }
    };

    const handleRejectBill = async (billId) => {
        setRejectingBillId(billId);
    };

    const submitRejection = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            await apiService.rejectBill(rejectingBillId, rejectionReason);
            alert('Bill rejected successfully!');
            setRejectingBillId(null);
            setRejectionReason('');
            loadStudentBills(selectedGrant._id, selectedGrant.studentId._id);
        } catch (error) {
            console.error('Reject bill error:', error);
            alert(error.response?.data?.error || 'Failed to reject bill');
        }
    };

    const getFraudScoreColor = (score) => {
        if (score < 30) return '#10b981';
        if (score < 60) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="faculty-dashboard loading">
                <Loader className="spinner" size={48} />
                <p>Loading grants...</p>
            </div>
        );
    }



    const BillDetailsModal = ({ bill, onClose }) => {
        if (!bill) return null;

        const analysis = bill.fraudAnalysis || {};
        const aiData = analysis.aiAnalysis || {};
        // Handle legacy string format if necessary
        const aiAssessment = typeof aiData === 'string' ? aiData : aiData.overallAssessment;

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content bill-details-modal" onClick={e => e.stopPropagation()}>
                    <button className="close-btn" onClick={onClose}><XCircle size={24} /></button>
                    
                    <div className="modal-header">
                        <h2>Bill Analysis Details</h2>
                        <div className={`status-badge ${bill.approvalStatus}`}>
                            {bill.approvalStatus.toUpperCase()}
                        </div>
                    </div>

                    <div className="modal-body">
                        <div className="bill-image-section">
                            <img src={bill.imageUrl} alt="Bill" />
                        </div>

                        <div className="analysis-section">
                            {/* Fraud Score Header */}
                            <div className="score-card" style={{ 
                                borderColor: getFraudScoreColor(analysis.score),
                                backgroundColor: `${getFraudScoreColor(analysis.score)}10`
                            }}>
                                <div className="score-value" style={{ color: getFraudScoreColor(analysis.score) }}>
                                    {analysis.score}
                                </div>
                                <div className="score-label">
                                    <span>Fraud Risk Score</span>
                                    <small>{analysis.score < 30 ? 'Low Risk' : analysis.score < 60 ? 'Medium Risk' : 'High Risk'}</small>
                                </div>
                            </div>

                            {/* AI Assessment */}
                            <div className="detail-group">
                                <h3>🤖 AI Assessment</h3>
                                <p className="ai-text">{aiAssessment || 'No detailed assessment available.'}</p>
                            </div>

                            {/* Flags */}
                            {analysis.flags?.length > 0 && (
                                <div className="detail-group">
                                    <h3>⚠️ Risk Flags</h3>
                                    <div className="tags">
                                        {analysis.flags.map((flag, i) => (
                                            <span key={i} className="tag flag">{flag.replace(/_/g, ' ')}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Findings */}
                            {typeof aiData === 'object' && (
                                <>
                                    {aiData.visualTampering?.detected && (
                                        <div className="detail-group warning">
                                            <h3>👁️ Visual Tampering</h3>
                                            <p>{aiData.visualTampering.details}</p>
                                        </div>
                                    )}

                                    {aiData.logicalIssues?.length > 0 && (
                                        <div className="detail-group">
                                            <h3>🧠 Logical Inconsistencies</h3>
                                            <ul>
                                                {aiData.logicalIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {aiData.formatIssues?.length > 0 && (
                                        <div className="detail-group">
                                            <h3>bad_format Format Issues</h3>
                                            <ul>
                                                {aiData.formatIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Extracted Data Summary */}
                            <div className="detail-group">
                                <h3>📝 Extracted Data</h3>
                                <div className="data-grid">
                                    <div className="data-item">
                                        <label>Merchant</label>
                                        <span>{bill.extractedData?.merchantName || 'N/A'}</span>
                                    </div>
                                    <div className="data-item">
                                        <label>Date</label>
                                        <span>{bill.extractedData?.billDate ? new Date(bill.extractedData.billDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="data-item">
                                        <label>Total</label>
                                        <span>₹{bill.extractedData?.total?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="modal-actions">
                                {bill.approvalStatus === 'pending' && (
                                    <>
                                        <button className="approve-btn" onClick={() => { handleApproveBill(bill.billId); onClose(); }}>
                                            <CheckCircle size={18} /> Approve
                                        </button>
                                        <button className="reject-btn" onClick={() => { handleRejectBill(bill.billId); onClose(); }}>
                                            <XCircle size={18} /> Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="faculty-dashboard">
            <div className="dashboard-header">
                <h1>📚 Faculty Dashboard</h1>
                <button className="create-grant-btn" onClick={() => setShowGrantModal(true)}>
                    + Create New Grant
                </button>
            </div>

            <div className="dashboard-content">
                {/* Grants List */}
                <div className="grants-section">
                    <h2>Your Grants ({grants.length})</h2>
                    {grants.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <p>No grants created yet</p>
                            <button onClick={() => setShowGrantModal(true)}>Create Your First Grant</button>
                        </div>
                    ) : (
                        <div className="grants-list">
                            {grants.map(grant => (
                                <div
                                    key={grant._id}
                                    className={`grant-card ${selectedGrant?._id === grant._id ? 'selected' : ''}`}
                                    onClick={() => handleGrantClick(grant)}
                                >
                                    <div className="grant-header">
                                        <div className="student-info">
                                            <h3>{grant.studentId?.name || grant.studentEmail}</h3>
                                            <span className={`status-badge ${grant.status}`}>{grant.status}</span>
                                        </div>
                                    </div>
                                    <div className="grant-amounts">
                                        <div className="amount-item">
                                            <span className="label">Total</span>
                                            <span className="value">₹{grant.totalAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="amount-item">
                                            <span className="label">Used</span>
                                            <span className="value used">₹{grant.usedAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="amount-item">
                                            <span className="label">Remaining</span>
                                            <span className="value remaining">₹{grant.remainingAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="grant-progress">
                                        <div
                                            className="progress-bar"
                                            style={{ width: `${(grant.usedAmount / grant.totalAmount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bills Review Section */}
                {selectedGrant && (
                    <div className="bills-section">
                        <h2>Bills from {selectedGrant.studentId?.name || selectedGrant.studentEmail}</h2>
                        {studentBills.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={48} />
                                <p>No bills uploaded yet</p>
                            </div>
                        ) : (
                            <div className="bills-list">
                                {studentBills.map(bill => (
                                    <div key={bill.billId} className="bill-approval-card">
                                        <img src={bill.imageUrl} alt="Bill" className="bill-image" onClick={() => setViewingBill(bill)} />
                                        
                                        <div className="bill-details">
                                            <div className="bill-info">
                                                <h3>{bill.extractedData?.merchantName || 'Unknown Merchant'}</h3>
                                                <p className="bill-amount">₹{bill.extractedData?.total?.toFixed(2) || '0.00'}</p>
                                                <p className="bill-date">
                                                    {bill.extractedData?.billDate 
                                                        ? new Date(bill.extractedData.billDate).toLocaleDateString()
                                                        : 'No date'}
                                                </p>
                                            </div>

                                            <div className="bill-status-row">
                                                <div className={`status-badge ${bill.approvalStatus}`}>
                                                    {bill.approvalStatus}
                                                </div>
                                                {bill.fraudAnalysis && (
                                                    <div className="risk-badge" style={{ color: getFraudScoreColor(bill.fraudAnalysis.score) }}>
                                                        Risk: {bill.fraudAnalysis.score}/100
                                                    </div>
                                                )}
                                            </div>

                                            <button className="view-analysis-btn" onClick={() => setViewingBill(bill)}>
                                                <FileText size={16} /> View Full Analysis
                                            </button>

                                            {/* Quick Actions */}
                                            {bill.approvalStatus === 'pending' && (
                                                <div className="approval-actions">
                                                    <button className="approve-btn icon-only" onClick={() => handleApproveBill(bill.billId)} title="Approve">
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button className="reject-btn icon-only" onClick={() => handleRejectBill(bill.billId)} title="Reject">
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showGrantModal && (
                <GrantCreationModal
                    onClose={() => setShowGrantModal(false)}
                    onGrantCreated={(grant) => {
                        loadGrants();
                        setShowGrantModal(false);
                    }}
                />
            )}

            {viewingBill && (
                <BillDetailsModal 
                    bill={viewingBill} 
                    onClose={() => setViewingBill(null)} 
                />
            )}

            {/* Rejection Modal (keep existing logic but maybe style it better) */}
            {rejectingBillId && (
                <div className="modal-overlay">
                    <div className="modal-content rejection-modal">
                        <h3>Reject Bill</h3>
                        <textarea
                            placeholder="Enter reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setRejectingBillId(null)}>Cancel</button>
                            <button className="reject-confirm-btn" onClick={submitRejection}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
