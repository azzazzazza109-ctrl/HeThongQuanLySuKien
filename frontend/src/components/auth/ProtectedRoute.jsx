import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Đang tải...</div>;
    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.system_role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}