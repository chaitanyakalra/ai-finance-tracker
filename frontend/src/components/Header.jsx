import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, User, LogOut, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { apiService } from "../utils/api";
import SearchModal from "./SearchModal";

function Header({ setShowGroupModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGroupsDropdown, setShowGroupsDropdown] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    setIsAuthenticated(!!authToken);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');

    // Update authentication state
    setIsAuthenticated(false);
    navigate('/');
  };

  // Get page title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/add-expense': return 'Expenses';
      case '/bill-upload': return 'Bill Upload';
      case '/chat': return 'AI Assistant';
      // case '/budgets': return 'Budgets';
      case '/settings': return 'Settings';
      default: return 'FinanceGuard';
    }
  };

  const handleCreateGroup = () => {
    setShowGroupModal(true);
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await apiService.getUserGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroupsDropdown = () => {
    if (!showGroupsDropdown) {
      fetchGroups();
    } else {
      setSelectedGroup(null);
    }
    setShowGroupsDropdown(!showGroupsDropdown);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
  };

  const handleBackToList = () => {
    setSelectedGroup(null);
    setNewMemberEmail('');
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedGroup) return;

    setAddingMember(true);
    try {
      await apiService.addGroupMember(selectedGroup.id, { email: newMemberEmail });
      setNewMemberEmail('');
      // Refresh group data
      const response = await apiService.getUserGroups();
      setGroups(response.data || []);
      const updatedGroup = response.data.find(g => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
      }
      alert('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteGroup = async (e, groupId) => {
    e.stopPropagation(); // Prevent opening the group details
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    try {
      await apiService.deleteGroup(groupId);
      // Refresh groups list
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setShowSearchModal(true);
    } else {
      setShowSearchModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 px-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-4 lg:gap-x-6">
            {/* Search Bar */}
            <div className="hidden md:block relative max-w-md w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="w-full bg-muted/50 pl-9 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {/* Search Dropdown */}
              <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                searchQuery={searchQuery}
              />
            </div>
            {isAuthenticated && (
              <div className="header-actions">
                <button
                  className="my-groups-button"
                  onClick={toggleGroupsDropdown}
                  title="My Groups"
                >
                  <Users size={18} />
                  <span>My Groups</span>
                </button>
                <button
                  className="create-group-button"
                  onClick={handleCreateGroup}
                  title="Create Group"
                >
                  <Users size={18} />
                  <span>Create Group</span>
                </button>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* My Groups Modal - Moved outside header for proper z-index */}
      {showGroupsDropdown && (
        <div className="modal-overlay" onClick={() => setShowGroupsDropdown(false)}>
          <div className="modal-content group-modal my-groups-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={24} />
                My Groups
              </h2>
              <button className="modal-close" onClick={() => setShowGroupsDropdown(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingGroups ? (
                <div className="dropdown-loading">Loading groups...</div>
              ) : selectedGroup ? (
                // Group Details View
                <div className="group-details-view">
                  <button className="back-button" onClick={handleBackToList}>
                    ← Back to Groups
                  </button>
                  <div className="group-details-header">
                    <div className="group-detail-icon">
                      <Users size={32} />
                    </div>
                    <div>
                      <h3>{selectedGroup.name}</h3>
                      <p>{selectedGroup.members?.length || 0} members</p>
                    </div>
                  </div>

                  <div className="members-section">
                    <h4>Members</h4>
                    <div className="members-list">
                      {selectedGroup.members?.map((member, index) => (
                        <div key={index} className="member-item">
                          <div className="member-avatar">
                            {member.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="member-details">
                            <div className="member-email">{member.email}</div>
                            <div className="member-role">{member.userId === selectedGroup.createdBy ? 'Admin' : 'Member'}</div>
                          </div>
                        </div>
                      )) || []}
                    </div>
                  </div>

                  <div className="add-member-section">
                    <h4>Add New Member</h4>
                    <div className="add-member-form">
                      <input
                        type="email"
                        placeholder="Enter member email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                      />
                      <button
                        onClick={handleAddMember}
                        disabled={!newMemberEmail.trim() || addingMember}
                        className="modal-button modal-button-primary"
                      >
                        {addingMember ? 'Adding...' : 'Add Member'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : groups.length > 0 ? (
                // Groups List View
                <div className="groups-list">
                  {groups.map(group => (
                    <div key={group.id} className="group-item-card" onClick={() => handleGroupClick(group)}>
                      <div className="group-item-content">
                        <div className="group-item-icon">
                          <Users size={20} />
                        </div>
                        <div className="group-item-info">
                          <div className="group-item-name">{group.name}</div>
                          <div className="group-item-members">{group.members?.length || 0} members</div>
                        </div>
                      </div>
                      {group.createdBy === localStorage.getItem('userId') && (
                        <button
                          className="delete-group-button"
                          onClick={(e) => handleDeleteGroup(e, group.id)}
                          title="Delete Group"
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dropdown-empty">
                  <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No groups yet</p>
                  <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Create your first group to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
