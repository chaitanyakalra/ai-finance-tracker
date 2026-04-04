import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const toastShownRef = useRef(false);

    const isAuthenticatedFallback = !loading && (isAuthenticated || !!localStorage.getItem("authToken"));

    useEffect(() => {
        if (!loading && isAuthenticated && adminOnly && user?.role !== 'admin' && !toastShownRef.current) {
            toastShownRef.current = true;
            toast.error("Access denied. Admin role required.");
        }
    }, [loading, isAuthenticated, adminOnly, user]);

    if (loading) {
        return null;
    }

    if (!isAuthenticatedFallback) {
        return <Navigate to="/" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
