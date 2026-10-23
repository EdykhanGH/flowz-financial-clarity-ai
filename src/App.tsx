import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { FullScreenLoader } from "./components/ui";
import AppShell from "./components/AppShell";
import Welcome from "./pages/Welcome";
import AuthPage from "./pages/AuthPage";
import Setup from "./pages/Setup";
import DayPage from "./pages/DayPage";
import Notebook from "./pages/Notebook";
import MonthPage from "./pages/MonthPage";
import Budgets from "./pages/Budgets";
import Owed from "./pages/Owed";
import SettingsPage from "./pages/SettingsPage";
import Statements from "./pages/Statements";
import BankMatch from "./pages/BankMatch";

function RequireSetup({ children }: { children: ReactNode }) {
  const { session, settings, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (!settings) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, settings, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to={settings ? "/today" : "/setup"} replace />;
  return <>{children}</>;
}

function SetupRoute() {
  const { session, settings, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/signin" replace />;
  if (settings) return <Navigate to="/today" replace />;
  return <Setup />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Welcome /></PublicOnly>} />
      <Route path="/signin" element={<PublicOnly><AuthPage mode="signin" /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><AuthPage mode="signup" /></PublicOnly>} />
      <Route path="/setup" element={<SetupRoute />} />
      <Route element={<RequireSetup><AppShell /></RequireSetup>}>
        <Route path="/today" element={<DayPage />} />
        <Route path="/day/:date" element={<DayPage />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="/month" element={<MonthPage />} />
        <Route path="/month/:month" element={<MonthPage />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/owed" element={<Owed />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/bank" element={<BankMatch />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
