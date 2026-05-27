import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TimerProvider } from "@/contexts/TimerContext";
import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import Tutorial from "@/components/Tutorial";
import JournalDrawer from "@/components/JournalDrawer";
import AuthPage from "@/pages/AuthPage";
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
import StudyWaves from "@/pages/StudyWaves";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

type AppState = "loading" | "auth" | "onboarding" | "app" | "waves";

function AppContent() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalSkillId, setJournalSkillId] = useState("");
  const [journalSkillName, setJournalSkillName] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    async function init() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = storage.getUser();
          if (!user) {
            const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Learner";
            storage.setUser({ name, avatar: "🧑‍💻", reminderTime: "08:00", reminderEnabled: false, theme: "dark" });
          }
          setAppState("app");
          return;
        }
        supabase.auth.onAuthStateChange((event, sess) => {
          if (event === "SIGNED_IN" && sess?.user) {
            const user = storage.getUser();
            if (!user) {
              const name = sess.user.user_metadata?.name || sess.user.email?.split("@")[0] || "Learner";
              storage.setUser({ name, avatar: "🧑‍💻", reminderTime: "08:00", reminderEnabled: false, theme: "dark" });
            }
            localStorage.removeItem("pst_is_guest");
            setAppState("app");
          } else if (event === "SIGNED_OUT") {
            setAppState("auth");
          }
        });
      }

      const hasUser = !!storage.getUser();
      if (hasUser) {
        setAppState("app");
      } else {
        setAppState(supabase ? "auth" : "onboarding");
      }
    }
    init();
  }, []);

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
    const handler = () => setAppState("waves");
    window.addEventListener("open-study-waves", handler);
    return () => window.removeEventListener("open-study-waves", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("pst_tutorial_done");
      setShowTutorial(true);
    };
    window.addEventListener("replay-tutorial", handler);
    return () => window.removeEventListener("replay-tutorial", handler);
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

  // Trigger tutorial for first-time users when they reach the app
  useEffect(() => {
    if (appState === "app" && !localStorage.getItem("pst_tutorial_done")) {
      // Small delay so the app UI renders first
      const t = setTimeout(() => setShowTutorial(true), 600);
      return () => clearTimeout(t);
    }
  }, [appState]);

  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (appState === "waves") {
    return <StudyWaves onExit={() => setAppState("app")} />;
  }

  if (appState === "auth") {
    return <AuthPage onAuth={() => {
      const hasUser = !!storage.getUser();
      setAppState(hasUser ? "app" : "onboarding");
    }} />;
  }

  if (appState === "onboarding") {
    return <Onboarding onComplete={() => setAppState("app")} />;
  }

  const handleRequestAuth = () => {
    localStorage.removeItem("pst_is_guest");
    setAppState("auth");
  };

  return (
    <>
      <Layout onRequestAuth={handleRequestAuth}>
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
      {showTutorial && <Tutorial onDone={() => setShowTutorial(false)} />}
    </>
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
