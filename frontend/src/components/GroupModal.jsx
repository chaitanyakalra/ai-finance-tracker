import { useState } from "react";
import { Users, Mail, Loader2, UserPlus, Check, AlertCircle, Copy } from "lucide-react";
import { apiService } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

function GroupModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1); // 1: Create Group, 2: Add Members
    const [groupName, setGroupName] = useState("");
    const [createdGroup, setCreatedGroup] = useState(null);
    const [memberEmail, setMemberEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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
            toast.success(`Group "${groupName}" created successfully!`);
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

        try {
            const response = await apiService.addMemberByEmail(
                createdGroup.id,
                memberEmail.trim()
            );
            setAddedMembers([...addedMembers, response.data.addedUser]);
            toast.success(`${response.data.addedUser.email} added successfully!`);
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
        setAddedMembers([]);
        onClose();
    };

    const handleSkipAddMembers = () => {
        handleClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-6 w-6 text-primary" />
                        {step === 1 ? "Create New Group" : "Add Members"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Create a group to split expenses with friends, family, or roommates."
                            : `Add members to "${createdGroup?.name}" to start sharing expenses.`}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <form onSubmit={handleCreateGroup} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="groupName">Group Name</Label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="groupName"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="e.g., Family Expenses, Trip to Goa"
                                            className="pl-9"
                                            autoFocus
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading || !groupName.trim()}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create Group
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6 py-2"
                        >
                            <div className="flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="rounded-full bg-green-500/10 p-3">
                                    <Check className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-lg">Group Created Successfully!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Group ID: <span className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">{createdGroup?.id?.slice(0, 8)}...</span>
                                </p>
                            </div>

                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="memberEmail">Add Member by Email</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="memberEmail"
                                                type="email"
                                                value={memberEmail}
                                                onChange={(e) => setMemberEmail(e.target.value)}
                                                placeholder="friend@example.com"
                                                className="pl-9"
                                                disabled={loading}
                                            />
                                        </div>
                                        <Button type="submit" disabled={loading || !memberEmail.trim()}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </form>

                            {addedMembers.length > 0 && (
                                <div className="space-y-3">
                                    <Label>Added Members ({addedMembers.length})</Label>
                                    <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {addedMembers.map((member, idx) => (
                                            <Card key={idx} className="bg-muted/50 border-none">
                                                <CardContent className="p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                                {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium leading-none">{member.name || "User"}</span>
                                                            <span className="text-xs text-muted-foreground">{member.email}</span>
                                                        </div>
                                                    </div>
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="sm:justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleSkipAddMembers}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    I'll add members later
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleClose}
                                    className="min-w-[100px]"
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}

export default GroupModal;
