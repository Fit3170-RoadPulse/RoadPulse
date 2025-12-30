import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/api";

/**
 * ProtectedRoute component that guards routes requiring authentication
 * Redirects unauthenticated users to the login page
 */
export default function ProtectedRoute({ children }) {
    if (!isAuthenticated()) {
        // Use replace: true to prevent users from going back to protected route
        return <Navigate to="/" replace />;
    }

    return children;
}
