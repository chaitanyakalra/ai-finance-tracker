import { useState } from "react";
import { apiService } from "../utils/api";
import { PlusCircle, Calendar, DollarSign, Tag, FileText, CheckCircle, Loader2, Lightbulb } from "lucide-react";
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });

      toast.success("Expense added successfully!");

      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "Food",
        description: ""
      });

      // Navigate to dashboard after successful addition
      setTimeout(() => navigate("/dashboard"), 1000);

    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
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

