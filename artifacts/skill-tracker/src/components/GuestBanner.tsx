import { useState } from "react";
import { X, CloudOff } from "lucide-react";

interface GuestBannerProps {
  onCreateAccount: () => void;
}

export default function GuestBanner({ onCreateAccount }: GuestBannerProps) {
  const [dismissed, setDismissed] = useState(
    sessionStorage.getItem("pst_banner_dismissed") === "true"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("pst_banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div
      style={{
        background: "rgba(251,191,36,0.06)",
        borderBottom: "1px solid rgba(251,191,36,0.18)",
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 16,
        paddingRight: 12,
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <CloudOff style={{ width: 13, height: 13, color: "#d97706", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#d97706", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          You're using SkillMap as a guest. Create a free account to sync across devices.
        </span>
        <button
          onClick={onCreateAccount}
          style={{
            fontSize: 12,
            color: "#00d4ff",
            textDecoration: "underline",
            whiteSpace: "nowrap",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            flexShrink: 0,
          }}
        >
          Create Account
        </button>
      </div>
      <button
        onClick={handleDismiss}
        style={{ color: "rgba(217,119,6,0.5)", background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
        aria-label="Dismiss"
      >
        <X style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
}
