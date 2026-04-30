import { Navigate, Outlet, useLocation } from "react-router-dom";

export const AdminGuard = () => {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
};
