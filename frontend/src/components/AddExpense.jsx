import { useState, useEffect } from "react";
import { apiService } from "../utils/api";
import { PlusCircle, Calendar, DollarSign, Tag, FileText, CheckCircle, Loader2, Lightbulb, Users, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function AddExpense() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "Food",
    description: ""
  });

  const [splitExpense, setSplitExpense] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Split options: 'equal' or 'select'
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch groups when split expense is enabled
  useEffect(() => {
    if (splitExpense) {
      fetchGroups();
    } else {
      // Reset when unchecked
      setSelectedGroup("");
      setSplitType('equal');
      setSelectedMembers([]);
      setGroupMembers([]);
    }
  }, [splitExpense]);

  // Fetch group members when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await apiService.getUserGroups();
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      alert("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };


  const fetchGroupMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await apiService.getGroupMembers(selectedGroup);
      const currentUserId = localStorage.getItem('userId');

      // Filter out the current user - they can't owe themselves money!
      const otherMembers = (response.data.members || []).filter(
        member => member.userId !== currentUserId
      );

      setGroupMembers(otherMembers);

      // Pre-select all OTHER members for equal split (excluding yourself)
      if (splitType === 'equal') {
        setSelectedMembers(otherMembers.map(m => m.userId));
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === 'equal') {
      // Select all members
      setSelectedMembers(groupMembers.map(m => m.userId));
    } else if (type === 'full') {
      // Clear selection - user will select ONE person
      setSelectedMembers([]);
    } else {
      // Clear selection for manual selection
      setSelectedMembers([]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (splitExpense && selectedGroup) {
        // Validate member selection for custom split
        if (splitType === 'select' && selectedMembers.length === 0) {
          alert("Please select at least one member to split with");
          setLoading(false);
          return;
        }

        // Validate member selection for full amount
        if (splitType === 'full' && selectedMembers.length !== 1) {
          alert("Please select exactly one person who owes the full amount");
          setLoading(false);
          return;
        }

        // Create shared expense
        await apiService.createSharedExpense({
          groupId: selectedGroup,
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          splitType,
          selectedMembers: (splitType === 'select' || splitType === 'full') ? selectedMembers : []
        });

        const memberText = splitType === 'equal'
          ? 'all group members'
          : splitType === 'full'
            ? '1 person (full amount)'
            : `${selectedMembers.length} selected member(s)`;
        alert(`Shared expense created and split among ${memberText}!`);
      } else {
        // Create regular expense
        await apiService.createExpense({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        });
        alert("Expense added successfully!");
      }

      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "Food",
        description: ""
      });
      setSplitExpense(false);
      setSelectedGroup("");

      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage = error.response?.data?.error || "Failed to add expense";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "Food", emoji: "🍔", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { value: "Transport", emoji: "🚗", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { value: "Shopping", emoji: "🛍️", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { value: "Bills", emoji: "📄", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { value: "Entertainment", emoji: "🎬", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { value: "Others", emoji: "📦", color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" }
  ];

  return (
    <div className="add-expense" data-testid="add-expense-view">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PlusCircle className="h-8 w-8 text-primary" />
            Add New Expense
          </h2>
          <p className="text-muted-foreground">Track your spending and let AI analyze your patterns</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>Enter the details of your transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Amount (₹)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4" /> Category
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <div
                        key={cat.value}
                        className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all hover:scale-105 ${newExpense.category === cat.value
                            ? `${cat.bg} ${cat.border} ring-2 ring-primary ring-offset-2`
                            : "hover:bg-muted"
                          }`}
                        onClick={() => setNewExpense({ ...newExpense, category: cat.value })}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className="font-medium text-sm">{cat.value}</span>
                        {newExpense.category === cat.value && (
                          <CheckCircle className={`ml-auto h-4 w-4 ${cat.color}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Description
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="e.g., Groceries, Uber ride, Movie tickets"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Expense...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Expense
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-5 w-5" /> Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Add expenses regularly for accurate AI insights
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Use descriptive names to track spending better
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Our AI analyzes patterns to help you save money
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;

