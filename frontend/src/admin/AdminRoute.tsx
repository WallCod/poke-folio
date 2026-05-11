import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "@/lib/auth";

export const AdminRoute = () => {
  const location = useLocation();
  const session = getSession();
  if (!session?.token || session.role !== "admin") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <Outlet />;
};
