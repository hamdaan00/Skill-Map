import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TimerProvider } from "@/contexts/TimerContext";
import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import Layout from "@/components/Layout";
import JournalDrawer from "@/components/JournalDrawer";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Skills from "@/pages/Skills";
import FocusTimer from "@/pages/FocusTimer";
import Progress from "@/pages/Progress";
import Targets from "@/pages/Targets";
import Challenges from "@/pages/Challenges";
import Journal from "@/pages/Journal";
import Achievements from "@/pages/Achievements";
import Duels from "@/pages/Duels";
import Partner from "@/pages/Partner";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppContent() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalSkillId, setJournalSkillId] = useState("");
  const [journalSkillName, setJournalSkillName] = useState("");

  useEffect(() => {
    setHasUser(!!storage.getUser());
    const handler = () => setHasUser(!!storage.getUser());
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  // Apply saved theme on startup
  useEffect(() => {
    const savedTheme = storage.getTheme();
    if (savedTheme && savedTheme !== "midnight") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  useEffect(() => {
    const handler = (e: CustomEvent<{ skillId: string; skillName: string }>) => {
      setJournalSkillId(e.detail.skillId);
      setJournalSkillName(e.detail.skillName);
      setJournalOpen(true);
    };
    window.addEventListener("open-journal", handler as EventListener);
    return () => window.removeEventListener("open-journal", handler as EventListener);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const user = storage.getUser();
      if (!user?.reminderEnabled || Notification.permission !== "granted") return;
      const now = new Date();
      const [h, m] = user.reminderTime.split(":").map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        new Notification(`Hey ${user.name}! Time to practice your skills. Keep your streak alive!`, {
          icon: "/favicon.ico",
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (hasUser === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasUser) {
    return <Onboarding onComplete={() => setHasUser(true)} />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/skills" component={Skills} />
        <Route path="/timer" component={FocusTimer} />
        <Route path="/progress" component={Progress} />
        <Route path="/targets" component={Targets} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/journal" component={Journal} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/duels" component={Duels} />
        <Route path="/partner" component={Partner} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <JournalDrawer
        open={journalOpen}
        onClose={() => setJournalOpen(false)}
        skillId={journalSkillId}
        skillName={journalSkillName}
      />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TimerProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppContent />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </TimerProvider>
    </ThemeProvider>
  );
}

export default App;
