import { useState } from 'react';
import { X, User, GraduationCap } from 'lucide-react';
import '../styles/RoleSelectionModal.css';

export default function RoleSelectionModal({ onClose, onSelectRole }) {
    const [selectedRole, setSelectedRole] = useState(null);

    const handleConfirm = () => {
        if (selectedRole) {
            onSelectRole(selectedRole);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content role-selection-modal">
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <h2>Welcome to Grant Bill Checker</h2>
                <p className="modal-subtitle">Please select your role to continue</p>

                <div className="role-options">
                    <div
                        className={`role-card ${selectedRole === 'faculty' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('faculty')}
                    >
                        <div className="role-icon faculty-icon">
                            <GraduationCap size={48} />
                        </div>
                        <h3>I'm a Faculty</h3>
                        <p>Create grants and review student bills</p>
                    </div>

                    <div
                        className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('student')}
                    >
                        <div className="role-icon student-icon">
                            <User size={48} />
                        </div>
                        <h3>I'm a Student</h3>
                        <p>Upload bills for grant reimbursement</p>
                    </div>
                </div>

                <button
                    className="confirm-btn"
                    onClick={handleConfirm}
                    disabled={!selectedRole}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
