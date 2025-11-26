import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Loader, DollarSign } from 'lucide-react';
import { apiService } from '../utils/api';
import '../styles/StudentDashboard.css';

export default function StudentDashboard() {
    const [grant, setGrant] = useState(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedBills, setUploadedBills] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGrantAndBills();
    }, []);

    const loadGrantAndBills = async () => {
        try {
            // Check for pending grant token from magic link
            const pendingToken = localStorage.getItem('pendingGrantToken');
            if (pendingToken) {
                console.log('Found pending grant token, attempting to accept...');
                try {
                    await apiService.acceptInvitation(pendingToken);
                    localStorage.removeItem('pendingGrantToken');
                    console.log('Pending grant accepted successfully');
                    // Show success message or notification here if needed
                } catch (err) {
                    console.error('Failed to accept pending grant:', err);
                    // Keep token if it's a temporary error, or remove if invalid?
                    // For now, remove to prevent infinite loops if broken
                    localStorage.removeItem('pendingGrantToken');
                }
            }

            // Load active grant
            const grantResponse = await apiService.getActiveGrant();
            setGrant(grantResponse.data.grant);

            // Load bills
            const billsResponse = await apiService.getUserBills({ limit: 50 });
            console.log(billsResponse);
            setUploadedBills(billsResponse.data.bills || []);
        } catch (error) {
            console.error('Load grant and bills error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    }, []);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/')
        );
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadBills = async () => {
        if (files.length === 0) return;
        
        if (!grant || !grant._id) {
            alert('No active grant found. Please contact your faculty.');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('bills', file);
            });
            
            // Add grant ID to link bills to the grant
            formData.append('grantId', grant._id);

            const response = await apiService.uploadBills(formData);
            const data = response.data;

            setFiles([]);

            // Poll for results
            if (data.results) {
                data.results.forEach(result => {
                    if (result.success) {
                        pollBillAnalysis(result.billId);
                    }
                });
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload bills. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const pollBillAnalysis = async (billId) => {
        const maxAttempts = 30;
        let attempts = 0;

        const poll = async () => {
            try {
                const response = await apiService.getBillAnalysis(billId);
                const bill = response.data;

                if (bill.status === 'completed' || bill.status === 'failed') {
                    setUploadedBills(prev => {
                        const existing = prev.find(b => b.billId === billId);
                        if (existing) {
                            return prev.map(b => b.billId === billId ? bill : b);
                        }
                        return [bill, ...prev];
                    });
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(poll, 1000);
                } else {
                    setUploadedBills(prev => [bill, ...prev]);
                }
            } catch (error) {
                console.error('Poll error:', error);
            }
        };

        poll();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle size={20} color="#10b981" />;
            case 'rejected':
                return <XCircle size={20} color="#ef4444" />;
            default:
                return <Clock size={20} color="#f59e0b" />;
        }
    };

    if (loading) {
        return (
            <div className="student-dashboard loading">
                <Loader className="spinner" size={48} />
                <p>Loading your grant...</p>
            </div>
        );
    }

    if (!grant) {
        return (
            <div className="student-dashboard no-grant">
                <h2>No Active Grant</h2>
                <p>You don't have an active grant yet. Please check your email for an invitation from your faculty.</p>
            </div>
        );
    }

    return (
        <div className="student-dashboard">
            <div className="dashboard-header">
                <h1>🎓 Student Dashboard</h1>
            </div>

            {/* Grant Details Card */}
            <div className="grant-details-card">
                <div className="grant-header">
                    <div>
                        <h2>Your Grant</h2>
                        <p className="faculty-name">From: {grant.facultyId?.name || 'Faculty'}</p>
                    </div>
                    <div className="grant-status">
                        <span className={`status-badge ${grant.status}`}>{grant.status}</span>
                    </div>
                </div>

                <div className="grant-amounts">
                    <div className="amount-box total">
                        <DollarSign size={24} />
                        <div>
                            <span className="label">Total Grant</span>
                            <span className="value">₹{grant.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="amount-box used">
                        <DollarSign size={24} />
                        <div>
                            <span className="label">Used</span>
                            <span className="value">₹{grant.usedAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="amount-box remaining">
                        <DollarSign size={24} />
                        <div>
                            <span className="label">Remaining</span>
                            <span className="value">₹{grant.remainingAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="grant-progress">
                    <div className="progress-info">
                        <span>{((grant.usedAmount / grant.totalAmount) * 100).toFixed(1)}% Used</span>
                    </div>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(grant.usedAmount / grant.totalAmount) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <h2>Upload Bills</h2>
                <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <Upload size={48} />
                    <h3>Drag & Drop Bills Here</h3>
                    <p>or click to browse</p>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                </div>

                {files.length > 0 && (
                    <div className="selected-files">
                        <h3>Selected Files ({files.length})</h3>
                        <div className="file-list">
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    <FileText size={20} />
                                    <span>{file.name}</span>
                                    <button onClick={() => removeFile(index)} className="remove-btn">
                                        <XCircle size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={uploadBills}
                            disabled={uploading}
                            className="upload-btn"
                        >
                            {uploading ? (
                                <>
                                    <Loader className="spinner" size={20} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Upload {files.length} Bill{files.length > 1 ? 's' : ''}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Uploaded Bills */}
            {uploadedBills.length > 0 && (
                <div className="bills-section">
                    <h2>Your Bills</h2>
                    <div className="bills-grid">
                        {uploadedBills.map((bill) => (
                            <div key={bill.billId} className="student-bill-card">
                                <img src={bill.imageUrl} alt="Bill" className="bill-thumbnail" />
                                <div className="bill-info">
                                    <h3>{bill.extractedData?.merchantName || 'Unknown Merchant'}</h3>
                                    <p className="bill-amount">₹{bill.extractedData?.total?.toFixed(2) || '0.00'}</p>
                                    <p className="bill-date">
                                        {bill?.uploadedAt
                                            ? new Date(bill.uploadedAt).toLocaleDateString()
                                            : 'Date not detected'}
                                    </p>
                                    <div className="bill-status">
                                        {getStatusIcon(bill.approvalStatus)}
                                        <span className={`status-text ${bill.approvalStatus}`}>
                                            {bill.approvalStatus === 'approved' ? 'Approved' :
                                             bill.approvalStatus === 'rejected' ? 'Rejected' :
                                             'Pending Review'}
                                        </span>
                                    </div>
                                    {bill.approvalStatus === 'rejected' && bill.rejectionReason && (
                                        <div className="rejection-reason">
                                            <strong>Reason:</strong> {bill.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
