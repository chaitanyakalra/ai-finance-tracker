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
                                        <img src={bill.imageUrl} alt="Bill" className="bill-image" />
                                        
                                        <div className="bill-details">
                                            <div className="bill-info">
                                                <h3>{bill.extractedData?.merchantName || 'Unknown Merchant'}</h3>
                                                <p className="bill-amount">₹{bill.extractedData?.total?.toFixed(2) || '0.00'}</p>
                                                <p className="bill-date">
                                                    {bill.extractedData?.billDate 
                                                        ? new Date(bill.extractedData.billDate).toLocaleDateString()
                                                        : 'No date'}
                                                </p>
                                                <p className="bill-status-text">
                                                    <strong>Processing Status:</strong> {bill.status || 'pending'}
                                                </p>
                                            </div>

                                            {/* Fraud Analysis */}
                                            {bill.status === 'completed' && bill.fraudAnalysis ? (
                                                <div className="fraud-analysis">
                                                    <h4><AlertTriangle size={18} /> Fraud Analysis</h4>
                                                    <div className="fraud-score">
                                                        <span>Risk Score:</span>
                                                        <div className="score-badge" style={{ 
                                                            backgroundColor: getFraudScoreColor(bill.fraudAnalysis.score) 
                                                        }}>
                                                            {bill.fraudAnalysis.score}/100
                                                        </div>
                                                    </div>
                                                    
                                                    {bill.fraudAnalysis.flags?.length > 0 && (
                                                        <div className="flags">
                                                            <strong>⚠️ Flags:</strong>
                                                            {bill.fraudAnalysis.flags.map((flag, idx) => (
                                                                <span key={idx} className="flag">{flag}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="validations">
                                                        <span className={bill.fraudAnalysis.validations?.gstValid ? 'valid' : 'invalid'}>
                                                            GST: {bill.fraudAnalysis.validations?.gstValid ? '✓' : '✗'}
                                                        </span>
                                                        <span className={bill.fraudAnalysis.validations?.mathValid ? 'valid' : 'invalid'}>
                                                            Math: {bill.fraudAnalysis.validations?.mathValid ? '✓' : '✗'}
                                                        </span>
                                                        <span className={bill.fraudAnalysis.validations?.dateValid ? 'valid' : 'invalid'}>
                                                            Date: {bill.fraudAnalysis.validations?.dateValid ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="fraud-analysis processing">
                                                    <Loader className="spinner" size={20} />
                                                    <p>Analyzing bill for fraud detection...</p>
                                                    <small>This usually takes 10-30 seconds</small>
                                                </div>
                                            )}

                                            {/* Approval Actions */}
                                            <div className="approval-actions">
                                                {bill.approvalStatus === 'pending' ? (
                                                    <>
                                                        <button 
                                                            className="approve-btn"
                                                            onClick={() => handleApproveBill(bill.billId)}
                                                        >
                                                            <CheckCircle size={18} />
                                                            Approve
                                                        </button>
                                                        <button 
                                                            className="reject-btn"
                                                            onClick={() => handleRejectBill(bill.billId)}
                                                        >
                                                            <XCircle size={18} />
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className={`status-badge ${bill.approvalStatus}`}>
                                                        {bill.approvalStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rejection Reason Input */}
                                            {rejectingBillId === bill.billId && (
                                                <div className="rejection-form">
                                                    <textarea
                                                        placeholder="Enter rejection reason..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                    />
                                                    <div className="rejection-actions">
                                                        <button onClick={() => setRejectingBillId(null)}>Cancel</button>
                                                        <button onClick={submitRejection}>Submit Rejection</button>
                                                    </div>
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
        </div>
    );
}
