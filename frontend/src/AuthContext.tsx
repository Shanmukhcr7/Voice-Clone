import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import axios from "axios";

// Configure axios base url to hit FastAPI running locally or from VITE_API_URL for Vercel
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:8000" : "");

type UserData = {
  id: string;
  name: string;
  phone_number: string;
  credits: number;
  plan_tier: string;
};

type AuthContextType = {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  token: string | null;
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

  const refreshUserData = async (currentToken: string = token!) => {
    if (!currentToken) return;
    try {
      const res = await axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUserData(res.data);
    } catch (error) {
      console.error("Error fetching user data", error);
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
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, token, refreshUserData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

