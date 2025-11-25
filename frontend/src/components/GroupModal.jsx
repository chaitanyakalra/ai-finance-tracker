import { useState } from "react";
import { X, Users, Mail, Loader2, UserPlus, Check, AlertCircle } from "lucide-react";
import { apiService } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";

function GroupModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1); // 1: Create Group, 2: Add Members
    const [groupName, setGroupName] = useState("");
    const [createdGroup, setCreatedGroup] = useState(null);
    const [memberEmail, setMemberEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [addedMembers, setAddedMembers] = useState([]);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            setError("Group name is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await apiService.createGroup(groupName.trim());
            setCreatedGroup(response.data);
            setSuccess(`Group "${groupName}" created successfully!`);
            setStep(2);
        } catch (err) {
            console.error("Error creating group:", err);
            setError(err.response?.data?.error || "Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!memberEmail.trim()) {
            setError("Email is required");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await apiService.addMemberByEmail(
                createdGroup.id,
                memberEmail.trim()
            );
            setAddedMembers([...addedMembers, response.data.addedUser]);
            setSuccess(`${response.data.addedUser.email} added successfully!`);
            setMemberEmail("");
        } catch (err) {
            console.error("Error adding member:", err);
            setError(err.response?.data?.error || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setGroupName("");
        setCreatedGroup(null);
        setMemberEmail("");
        setError("");
        setSuccess("");
        setAddedMembers([]);
        onClose();
    };

    const handleSkipAddMembers = () => {
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <motion.div
                className="modal-content group-modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3 }}
            >
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <Users className="modal-icon" />
                        <h2>{step === 1 ? "Create New Group" : "Add Members"}</h2>
                    </div>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                onSubmit={handleCreateGroup}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="form-group">
                                    <label htmlFor="groupName">
                                        <Users size={18} />
                                        Group Name
                                    </label>
                                    <input
                                        id="groupName"
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="e.g., Family Expenses, Team Budget"
                                        className="form-input"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="alert alert-success">
                                        <Check size={18} />
                                        <span>{success}</span>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleClose}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || !groupName.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="spinning" size={18} />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Users size={18} />
                                                Create Group
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="group-created-info">
                                    <div className="success-badge">
                                        <Check size={24} />
                                    </div>
                                    <h3>Group Created!</h3>
                                    <p className="group-name-display">{createdGroup?.name}</p>
                                    <p className="help-text">
                                        Now you can add members to your group by entering their email addresses.
                                    </p>
                                </div>

                                <form onSubmit={handleAddMember}>
                                    <div className="form-group">
                                        <label htmlFor="memberEmail">
                                            <Mail size={18} />
                                            Member Email
                                        </label>
                                        <input
                                            id="memberEmail"
                                            type="email"
                                            value={memberEmail}
                                            onChange={(e) => setMemberEmail(e.target.value)}
                                            placeholder="member@example.com"
                                            className="form-input"
                                            disabled={loading}
                                        />
                                    </div>

                                    {error && (
                                        <div className="alert alert-error">
                                            <AlertCircle size={18} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="alert alert-success">
                                            <Check size={18} />
                                            <span>{success}</span>
                                        </div>
                                    )}

                                    {addedMembers.length > 0 && (
                                        <div className="added-members-list">
                                            <h4>
                                                <UserPlus size={16} />
                                                Added Members ({addedMembers.length})
                                            </h4>
                                            {addedMembers.map((member, idx) => (
                                                <div key={idx} className="member-item">
                                                    <div className="member-avatar">
                                                        {member.name?.charAt(0) || member.email.charAt(0)}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{member.name || "User"}</span>
                                                        <span className="member-email">{member.email}</span>
                                                    </div>
                                                    <Check size={16} className="member-check" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleSkipAddMembers}
                                            disabled={loading}
                                        >
                                            Done
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading || !memberEmail.trim()}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="spinning" size={18} />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={18} />
                                                    Add Member
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

export default GroupModal;
