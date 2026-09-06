with open("frontend/src/Dashboard.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("refreshUserData(token!)", "refreshUserData()")
c = c.replace("transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }", "transition: { duration: 0.6 }")
c = c.replace("import { Mic, Play, Trash2, History, CreditCard, LogOut, Download, Sparkles, Settings2, Globe, Disc3, Volume2, User, PlayCircle, Loader2 } from \"lucide-react\";", "import { Mic, History, CreditCard, LogOut, Download, Sparkles, Settings2, Globe, Disc3, Volume2, User, PlayCircle, Loader2 } from \"lucide-react\";")
c = c.replace("import { motion, AnimatePresence } from \"framer-motion\";", "import { motion } from \"framer-motion\";")

with open("frontend/src/Dashboard.tsx", "w", encoding="utf-8") as f:
    f.write(c)
