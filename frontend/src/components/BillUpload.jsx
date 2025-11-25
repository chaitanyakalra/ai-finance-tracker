import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import RoleSelectionModal from './RoleSelectionModal';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';
import { apiService } from '../utils/api';
import '../styles/BillUpload.css';

export default function BillUpload() {
    const [userRole, setUserRole] = useState(null); // 'faculty' or 'student'
    const [loading, setLoading] = useState(true);
    const [showRoleModal, setShowRoleModal] = useState(false);

    useEffect(() => {
        detectUserRole();
    }, []);

    const detectUserRole = async () => {
        try {
            // Try to get user's grants to determine role
            const response = await apiService.getMyGrants();
            const role = response.data.role; // 'faculty' or 'student'
            
            if (role) {
                setUserRole(role);
            } else {
                // No role set, show modal
                setShowRoleModal(true);
            }
        } catch (error) {
            console.error('Detect role error:', error);
            // If error, assume first-time user
            setShowRoleModal(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSelection = async (role) => {
        try {
            // Save role to backend
            await apiService.setUserRole(role);
            
            // Update local state
            setUserRole(role);
            setShowRoleModal(false);
        } catch (error) {
            console.error('Set role error:', error);
            alert('Failed to set role. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="bill-upload-container loading">
                <Loader className="spinner" size={48} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <>
            {showRoleModal && (
                <RoleSelectionModal
                    onClose={() => setShowRoleModal(false)}
                    onSelectRole={handleRoleSelection}
                />
            )}

            {userRole === 'faculty' && <FacultyDashboard />}
            {userRole === 'student' && <StudentDashboard />}
            
            {!userRole && !showRoleModal && (
                <div className="bill-upload-container">
                    <h2>Please select your role to continue</h2>
                    <button onClick={() => setShowRoleModal(true)}>Select Role</button>
                </div>
            )}
        </>
    );
}
