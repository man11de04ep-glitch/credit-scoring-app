import { Navigate } from "react-router-dom";
import { storage } from "@/lib/storage";

interface ProtectedProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedProps) => {
  const user = storage.getUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};
