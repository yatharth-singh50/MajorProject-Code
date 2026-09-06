import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";

function Splash() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg">
      <ShieldCheck size={34} className="animate-pulse-soft text-brand" strokeWidth={1.6} />
    </div>
  );
}

function Gate({ children }) {
  const { loading } = useAuth();
  if (loading) return <Splash />;
  return children;
}

function Router() {
  return (
    <BrowserRouter>
      <Gate>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route
              path="*"
              element={
                <div className="flex h-[70vh] flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="font-serif text-2xl text-text">Nothing here</p>
                  <p className="text-sm text-text-faint">That page doesn't exist in this prototype.</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </Gate>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
