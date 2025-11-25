import { useState, useEffect, useRef } from "react";
import { Search, Calendar, DollarSign, Tag, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiService } from "../utils/api";

function SearchModal({ isOpen, onClose, searchQuery }) {
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const dropdownRef = useRef(null);

    const categoryIcons = {
        Food: "🍔",
        Transport: "🚗",
        Shopping: "🛍️",
        Bills: "📄",
        Entertainment: "🎬",
        Others: "📦"
    };

    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);

            try {
                // Fetch all expenses
                const response = await apiService.getRecentExpenses();
                const allExpenses = response.data || [];

                // Filter expenses based on search query
                const filtered = allExpenses.filter(expense => {
                    const searchLower = searchQuery.toLowerCase();
                    return (
                        expense.description?.toLowerCase().includes(searchLower) ||
                        expense.category?.toLowerCase().includes(searchLower) ||
                        expense.amount?.toString().includes(searchLower) ||
                        expense.date?.includes(searchLower)
                    );
                });

                setSearchResults(filtered);
            } catch (error) {
                console.error('Error searching transactions:', error);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        if (isOpen && searchQuery) {
            performSearch();
        }
    }, [searchQuery, isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-2xl z-50 max-h-[500px] overflow-hidden"
            style={{ width: '100%' }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <Search className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                            {searchLoading
                                ? 'Searching...'
                                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                            }
                        </span>
                    </div>
                    {searchQuery && (
                        <span className="text-xs text-muted-foreground">
                            for "{searchQuery}"
                        </span>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {searchLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : searchResults.length > 0 ? (
                    <div className="p-2">
                        {searchResults.map((expense, idx) => (
                            <div
                                key={expense.id || idx}
                                className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                                            <span className="text-lg">{categoryIcons[expense.category] || "📦"}</span>
                                        </div>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">{expense.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Tag className="h-3 w-3 shrink-0" />
                                                <span>{expense.category}</span>
                                                <span>•</span>
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                <span>{expense.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono font-semibold text-foreground ml-4 shrink-0">
                                        <span className="text-xs text-muted-foreground">₹</span>
                                        <span>{expense.amount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">No transactions found</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                            Try searching with different keywords
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchModal;
