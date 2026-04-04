import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, User, LogOut, Users, ChevronDown, X, ArrowLeft, Mail, Crown, Trash2, Plus, ShieldCheck, UserCheck, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
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
  const { user, isAdmin, isAnalyst, isViewer } = useAuth();
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
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Role Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                   {isAdmin && (
                     <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 gap-1 px-2">
                       <Crown size={12} /> Admin
                     </Badge>
                   )}
                   {isAnalyst && (
                     <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20 gap-1 px-2">
                       <ShieldCheck size={12} /> Analyst
                     </Badge>
                   )}
                   {isViewer && (
                     <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20 gap-1 px-2">
                       <Eye size={12} /> Viewer
                     </Badge>
                   )}
                   <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                     {user?.name || user?.email?.split('@')?.[0] || 'User'}
                   </span>
                </div>

                <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* My Groups Modal - Moved outside header for proper z-index */}
     {/* My Groups Modal - Sleek Design */}
{showGroupsDropdown && (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    onClick={() => setShowGroupsDropdown(false)}
  >
    <div 
      className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Users size={20} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedGroup ? selectedGroup.name : 'My Groups'}
          </h2>
        </div>
        <button
          onClick={() => setShowGroupsDropdown(false)}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-red-50 hover:text-red-500 transition-all text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Modal Body */}
      <div className="overflow-y-auto max-h-[calc(85vh-6rem)] px-8 py-6">
        {loadingGroups ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-5"></div>
            <p className="text-gray-500">Loading groups...</p>
          </div>
        ) : selectedGroup ? (
          // Group Details View
          <div className="space-y-7 animate-in slide-in-from-right duration-300">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all hover:-translate-x-1"
            >
              <ArrowLeft size={16} />
              Back to Groups
            </button>

            {/* Group Header Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-7 shadow-xl shadow-indigo-500/30">
              <div className="flex items-center gap-5">
                <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white">
                  <Users size={36} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">{selectedGroup.name}</h3>
                  <p className="text-white/90 flex items-center gap-2 text-base">
                    <Users size={16} />
                    {selectedGroup.members?.length || 0} member{selectedGroup.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Members</h4>
              <div className="space-y-3">
                {selectedGroup.members?.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-2xl transition-all"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-indigo-500/20">
                      {member.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-base">{member.email}</p>
                      {member.userId === selectedGroup.createdBy ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold mt-1 shadow-sm">
                          <Crown size={12} />
                          Admin
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 mt-1 block">Member</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Member Section */}
            <div className="border-t border-gray-100 pt-7">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Add New Member</h4>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    placeholder="Enter member email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-black focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base"
                  />
                </div>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim() || addingMember}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                >
                  <Plus size={16} />
                  {addingMember ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        ) : groups.length > 0 ? (
          // Groups List View
          <div className="grid gap-4">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className="group relative flex items-center gap-4 p-5 bg-white border-2 border-gray-100 hover:border-indigo-400 rounded-2xl transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
                  <Users size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Users size={14} />
                    {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {group.createdBy === localStorage.getItem('userId') && (
                  <button
                    onClick={(e) => handleDeleteGroup(e, group.id)}
                    className="opacity-0 group-hover:opacity-100 w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all hover:scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <ChevronDown className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all -rotate-90" size={20} />
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
              <Users size={56} className="text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No groups yet</h3>
            <p className="text-base text-gray-500 max-w-sm mb-7 leading-relaxed">
              Create your first group to start collaborating with others on shared expenses
            </p>
            <button
              onClick={handleCreateGroup}
              className="px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
            >
              <Plus size={18} />
              Create Your First Group
            </button>
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
