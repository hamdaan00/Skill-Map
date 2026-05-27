import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard, TrendingUp, Target, Trophy, Settings,
  Menu, X, Zap, Flag, Swords, BookOpen, Timer, Layers, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import TimerPill from "@/components/TimerPill";
import { sound } from "@/lib/sound";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/skills", icon: Layers, label: "Skills" },
  { href: "/timer", icon: Timer, label: "Focus Timer" },
  { href: "/progress", icon: TrendingUp, label: "Progress" },
  { href: "/targets", icon: Target, label: "Targets" },
  { href: "/challenges", icon: Flag, label: "Challenges" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/duels", icon: Swords, label: "Duels" },
  { href: "/partner", icon: Users, label: "Partner" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = () => {
    sound.navClick();
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    location === href || (location === "/" && href === "/dashboard");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar shrink-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
            Skill Map
          </span>
        </div>

        <div className="px-3 pt-3">
          <TimerPill />
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  isActive(href)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Skill Map</span>
        </div>
        <div className="flex items-center gap-2">
          <TimerPill />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-sidebar-foreground p-1 rounded-lg hover:bg-sidebar-accent"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sidebar-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Skill Map</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {navItems.map(({ href, icon: Icon, label }) => (
                  <Link key={href} href={href}>
                    <div
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                        isActive(href)
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
