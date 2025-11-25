import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { API_CONFIG } from "../config/api.config";

function Login() {
    const handleGoogleLogin = () => {
        window.location.href = `${API_CONFIG.BASE_URL}/api/auth/google`;
    };

    const handleDemoLogin = (e) => {
        e.preventDefault();
        // Keep demo login for testing if needed, or remove. 
        // For now, let's make the form submission also trigger Google Login 
        // or just prevent default if we want to enforce Google Auth.
        // The user asked for "Login & Sign Up", usually implies email/password too, 
        // but the backend only shows Google Auth routes.
        // So I will make the form buttons also redirect to Google or show a "Coming Soon" message.
        // But to be safe and follow "connect the same like it was before", 
        // and since LandingPage only had Google Auth, I'll prioritize that.
        handleGoogleLogin();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[100px]" />
            </div>

            <Card className="w-full max-w-md border-muted/50 bg-background/50 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your FinanceGuard AI account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <Button variant="outline" className="w-full py-6" onClick={handleGoogleLogin}>
                            <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Continue with Google
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or sign in with email</span>
                        </div>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4 opacity-50 pointer-events-none">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="name@example.com" disabled />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs text-primary hover:underline disabled">Forgot password?</a>
                            </div>
                            <Input id="password" type="password" disabled />
                        </div>
                        <Button type="submit" className="w-full" disabled>Sign In</Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <a href="#" className="text-primary hover:underline" onClick={handleGoogleLogin}>Sign up</a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;
