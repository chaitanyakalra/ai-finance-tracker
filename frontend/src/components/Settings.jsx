import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../utils/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function Settings() {
    const navigate = useNavigate();
    const { user, fetchCurrentUser } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false);

    // Sync display name from user when auth loads
    useEffect(() => {
        if (user?.name) {
            setDisplayName(user.name);
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/');
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        try {
            setSaving(true);
            await apiService.updateUserProfile(user.id, { name: displayName });
            await fetchCurrentUser(); // Refresh the user data in context
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your public profile and account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="opacity-60 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email is linked to your Google account and cannot be changed.
                        </p>
                    </div>
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving || displayName === user?.name}
                        className="mt-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security and authentication.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Two-Factor Authentication (MFA)</Label>
                            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                        </div>
                        <Switch />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Button variant="destructive" onClick={handleLogout}>Log out of all devices</Button>
                        <p className="text-xs text-muted-foreground">This will invalidate all active sessions.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>AI Preferences</CardTitle>
                    <CardDescription>Customize how FinanceGuard AI interacts with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Daily Insights</Label>
                            <p className="text-sm text-muted-foreground">Receive daily financial summaries and tips.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Proactive Budget Alerts</Label>
                            <p className="text-sm text-muted-foreground">Get notified when you're approaching budget limits.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Investment Recommendations</Label>
                            <p className="text-sm text-muted-foreground">Allow AI to suggest investment opportunities.</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default Settings;
