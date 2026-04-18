import { Navigate } from "react-router-dom";
import { storage } from "@/lib/storage";

interface ProtectedProps {
  children: React.ReactNode;
}

/**
 * Local-only gate.
 *
 * NOTE: This is NOT a security boundary. Smart Credit currently has no
 * authentication backend — there are no accounts, passwords, or sessions.
 * This check only confirms that a local profile exists in this browser so we
 * can route a first-time visitor through onboarding instead of dropping them
 * onto an empty dashboard.
 *
 * All persisted data lives in localStorage on the user's device. Treat anyone
 * with access to this browser profile as fully authorized. A clear disclosure
 * banner is shown on the auth screen and inside the app.
 */
export const ProtectedRoute = ({ children }: ProtectedProps) => {
  const user = storage.getUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};
