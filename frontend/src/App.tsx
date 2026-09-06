import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./AuthContext";
import Login from "./Login";
import ProfileSetup from "./ProfileSetup";
import Dashboard from "./Dashboard";
import Pricing from "./Pricing";
import Admin from "./Admin";
import Home from "./Home";
import axios from "axios";

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { currentUser, userData, loading, apiError } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-cinebg flex items-center justify-center"><div className="w-8 h-8 border-4 border-cineaccent border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!currentUser) return <Navigate to="/login" />;
  
  if (apiError) {
    return (
      <div className="min-h-screen bg-cinebg flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md">
          <h2 className="text-red-400 font-bold text-xl mb-2">API Connection Failed</h2>
          <p className="text-cinemuted text-sm mb-4">{apiError}</p>
          <a href={axios.defaults.baseURL + "/health"} target="_blank" rel="noreferrer" className="inline-block bg-white text-cinebg font-medium px-4 py-2 rounded-lg text-sm">
            Click here to bypass SSL warning
          </a>
        </div>
      </div>
    );
  }

  if (!userData) return <div className="min-h-screen bg-cinebg text-white flex items-center justify-center">Error loading user profile.</div>;
  if (adminOnly && userData.role !== "ADMIN") return <Navigate to="/studio" />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/studio" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {import.meta.env.VITE_ENABLE_ADMIN === "true" && (
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

