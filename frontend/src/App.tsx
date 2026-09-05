import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./AuthContext";
import Login from "./Login";
import ProfileSetup from "./ProfileSetup";
import Dashboard from "./Dashboard";
import Pricing from "./Pricing";
import Admin from "./Admin";

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!currentUser) return <Navigate to="/login" />;
  if (!userData) return <Navigate to="/setup" />;
  if (adminOnly && userData.plan_tier !== "ADMIN") return <Navigate to="/" />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<ProfileSetup />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {import.meta.env.VITE_ENABLE_ADMIN === 'true' && (
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

