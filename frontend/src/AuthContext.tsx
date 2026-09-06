import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import axios from "axios";

// Configure axios base url to hit FastAPI running locally or from VITE_API_URL for Vercel
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:8000" : "");

type UserData = {
  id: string;
  name: string;
  age: number;
  phone_number: string;
  credits: number;
  role: string;
  plan_tier: string;
  profile_completed: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  loading: boolean;
  token: string | null;
  apiError: string | null;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const refreshUserData = async (currentToken: string = token!) => {
    if (!currentToken) return;
    try {
      setApiError(null);
      // Append timestamp to prevent aggressive browser caching of GET requests
      const res = await axios.get(`/api/users/me?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${currentToken}`,
          "Cache-Control": "no-cache"
        }
      });
      setUserData(res.data);
    } catch (error) {
      console.error("Error fetching user data", error);
      setApiError("Failed to connect to API. Please ensure the backend is running and SSL warnings are bypassed.");
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const currentToken = await user.getIdToken();
        setToken(currentToken);
        setCurrentUser(user);
        await refreshUserData(currentToken);
      } else {
        setCurrentUser(null);
        setUserData(null);
        setToken(null);
        setApiError(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, setUserData, loading, token, apiError, refreshUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

