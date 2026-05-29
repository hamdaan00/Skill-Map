import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Volume2, VolumeX, ChevronLeft } from "lucide-react";
import { storage, Skill } from "@/lib/storage";
import { calcSessionXP } from "@/lib/xp";
import { calculateStreak } from "@/lib/badges";
import { sound } from "@/lib/sound";

const WAVE_TYPES = [
  { id: "Ocean Waves",   label: "Ocean Waves",   emoji: "🌊", colorA: "#00d4ff", colorB: "#0047ab", desc: "Deep rolling ocean" },
  { id: "Rain Storm",    label: "Rain Storm",    emoji: "🌧️", colorA: "#94a3b8", colorB: "#334155", desc: "Steady rainfall" },
  { id: "Fire Crackle",  label: "Fire Crackle",  emoji: "🔥", colorA: "#f97316", colorB: "#92400e", desc: "Crackling campfire" },
  { id: "Space Drift",   label: "Space Drift",   emoji: "🌌", colorA: "#8b5cf6", colorB: "#1e1b4b", desc: "Deep space tones" },
  { id: "Lo-Fi Waves",   label: "Lo-Fi Waves",   emoji: "🎵", colorA: "#fbbf24", colorB: "#78350f", desc: "Warm chord tones" },
  { id: "Mountain Wind", label: "Mountain Wind", emoji: "🏔️", colorA: "#2dd4bf", colorB: "#134e4a", desc: "Wind through trees" },
];

const MOODS = ["😴", "😐", "😊", "💪", "🔥"];

/* ─── Audio engine ──────────────────────────────────────── */
function createWaveSound(type: string, ctx: AudioContext): AudioNode[] {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(ctx.destination);
  const nodes: AudioNode[] = [masterGain];

  switch (type) {
    case "Ocean Waves": {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 4;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = 500; filter.Q.value = 0.5;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15; lfoGain.gain.value = 0.3; lfo.type = "sine";
      lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
      source.connect(filter); filter.connect(masterGain);
      lfo.start(0); source.start(0);
      nodes.push(source, filter, lfo, lfoGain);
      break;
    }
    case "Rain Storm": {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass"; highpass.frequency.value = 1200;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass"; lowpass.frequency.value = 8000;
      source.connect(highpass); highpass.connect(lowpass); lowpass.connect(masterGain);
      source.start(0);
      nodes.push(source, highpass, lowpass);
      break;
    }
    case "Fire Crackle": {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastSample = 0;
      for (let i = 0; i < bufferSize; i++) {
        lastSample = (Math.random() * 2 - 1) * 0.5 + lastSample * 0.5;
        data[i] = lastSample;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; filter.frequency.value = 800; filter.Q.value = 0.3;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 3.5; lfo.type = "sawtooth"; lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain); lfoGain.connect(masterGain.gain);
      source.connect(filter); filter.connect(masterGain);
      lfo.start(0); source.start(0);
      nodes.push(source, filter, lfo, lfoGain);
      break;
    }
    case "Space Drift": {
      const freqs = [55, 82.5, 110, 165];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq; gain.gain.value = 0.08;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sine"; lfo.frequency.value = 0.05 + i * 0.02; lfoGain.gain.value = 0.06;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(0); lfo.start(0);
        nodes.push(osc, gain, lfo, lfoGain);
      });
      break;
    }
    case "Lo-Fi Waves": {
      const chordFreqs = [130.81, 164.81, 196.00, 246.94];
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle"; osc.frequency.value = freq; gain.gain.value = 0.06;
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();
        tremolo.type = "sine"; tremolo.frequency.value = 4.5; tremoloGain.gain.value = 0.02;
        tremolo.connect(tremoloGain); tremoloGain.connect(gain.gain);
        osc.connect(gain); gain.connect(masterGain);
        osc.start(0); tremolo.start(0);
        nodes.push(osc, gain, tremolo, tremoloGain);
      });
      break;
    }
    case "Mountain Wind": {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass"; bandpass.frequency.value = 600; bandpass.Q.value = 1.5;
      const highshelf = ctx.createBiquadFilter();
      highshelf.type = "highshelf"; highshelf.frequency.value = 3000; highshelf.gain.value = -6;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine"; lfo.frequency.value = 0.08; lfoGain.gain.value = 300;
      lfo.connect(lfoGain); lfoGain.connect(bandpass.frequency);
      const volLfo = ctx.createOscillator();
      const volLfoGain = ctx.createGain();
      volLfo.type = "sine"; volLfo.frequency.value = 0.12; volLfoGain.gain.value = 0.15;
      volLfo.connect(volLfoGain); volLfoGain.connect(masterGain.gain);
      source.connect(bandpass); bandpass.connect(highshelf); highshelf.connect(masterGain);
      source.start(0); lfo.start(0); volLfo.start(0);
      nodes.push(source, bandpass, highshelf, lfo, lfoGain, volLfo, volLfoGain);
      break;
    }
    default: break;
  }

  return nodes;
}

/* ─── Wave visualizer ───────────────────────────────────── */
function WaveVisualizer({ colorA, colorB, playing }: { colorA: string; colorB: string; playing: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number>(0);

  const generatePath = (w: number, h: number, amp: number, freq: number, phase: number) => {
    let d = `M 0 ${h}`;
    for (let x = 0; x <= w; x += 4) {
      const y = h / 2 + amp * Math.sin((x / w) * freq * Math.PI * 2 + phase);
      d += ` L ${x} ${y}`;
    }
    return d + ` L ${w} ${h} Z`;
  };

  useEffect(() => {
    if (!playing) return;
    const animate = () => {
      phaseRef.current += 0.025;
      const svg = svgRef.current;
      if (!svg) return;
      const w = svg.clientWidth || 800, h = svg.clientHeight || 200;
      const paths = svg.querySelectorAll("path");
      paths[0]?.setAttribute("d", generatePath(w, h, h * 0.18, 2.5, phaseRef.current));
      paths[1]?.setAttribute("d", generatePath(w, h, h * 0.13, 3.2, phaseRef.current * 0.7 + 1));
      paths[2]?.setAttribute("d", generatePath(w, h, h * 0.09, 4.0, phaseRef.current * 0.5 + 2));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, colorA]);

  return (
    <svg ref={svgRef} className="absolute bottom-0 left-0 right-0 w-full" style={{ height: 200 }} preserveAspectRatio="none">
      <path fill={colorA + "30"} /><path fill={colorA + "20"} /><path fill={colorA + "15"} />
    </svg>
  );
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

interface StudyWavesProps { onExit: () => void; }

export default function StudyWaves({ onExit }: StudyWavesProps) {
  const skills = storage.getSkills();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(skills[0] || null);
  const [waveType, setWaveType] = useState(WAVE_TYPES[0]);
  const [volume, setVolume] = useState(0.6);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mood, setMood] = useState(2);
  const [muted, setMuted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const activeNodesRef = useRef<AudioNode[]>([]);
  const activeCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAllAudio = useCallback(() => {
    activeNodesRef.current.forEach(node => {
      try { (node as AudioBufferSourceNode).stop(0); } catch {}
      try { node.disconnect(); } catch {}
    });
    activeNodesRef.current = [];
    if (activeCtxRef.current) {
      try { activeCtxRef.current.close(); } catch {}
      activeCtxRef.current = null;
    }
  }, []);

  const startAudio = useCallback((type: string, vol: number) => {
    stopAllAudio();
    setTimeout(() => {
      const ctx = new AudioContext();
      const nodes = createWaveSound(type, ctx);
      // Apply volume to masterGain (nodes[0])
      (nodes[0] as GainNode).gain.value = vol;
      activeCtxRef.current = ctx;
      activeNodesRef.current = nodes;
    }, 100);
  }, [stopAllAudio]);

  // Sync volume to masterGain in real time
  useEffect(() => {
    if (activeNodesRef.current.length > 0) {
      (activeNodesRef.current[0] as GainNode).gain.value = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Play/pause
  useEffect(() => {
    if (playing) {
      startAudio(waveType.id, muted ? 0 : volume);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      stopAllAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, waveType.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " && !showSummary) { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === "Escape") handleExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSummary]);

  const handleStop = () => { setPlaying(false); setShowSummary(true); };

  const handleExit = () => {
    setPlaying(false);
    if (elapsed > 10) setShowSummary(true);
    else onExit();
  };

  const handleWaveSelect = (w: typeof WAVE_TYPES[0]) => {
    if (w.id === waveType.id) {
      // Toggle off current wave
      setPlaying(false);
    } else {
      setWaveType(w);
      if (playing) startAudio(w.id, muted ? 0 : volume);
    }
  };

  const handleLogSession = () => {
    if (!selectedSkill || elapsed < 10) { onExit(); return; }
    const mins = Math.round(elapsed / 60);
    const sessions = storage.getSessions();
    const streak = calculateStreak(sessions);
    const xpEarned = calcSessionXP(mins, mood + 1, streak, false);
    const newSession = {
      id: crypto.randomUUID(),
      skillId: selectedSkill.id,
      date: new Date().toISOString().split("T")[0],
      duration: mins,
      notes: `Study Waves session (${waveType.label})`,
      progress: selectedSkill.progress,
      loggedAt: new Date().toISOString(),
      mood: mood + 1,
      xpEarned,
    };
    storage.setSessions([...sessions, newSession]);
    const allSkills = storage.getSkills().map(s =>
      s.id === selectedSkill.id ? { ...s, lastPracticed: newSession.date, xp: (s.xp || 0) + xpEarned } : s
    );
    storage.setSkills(allSkills);
    sound.logSession();
    onExit();
  };

  const wave = waveType;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(160deg, #0a0f1e 0%, ${wave.colorB}88 100%)` }}
    >
      <WaveVisualizer colorA={wave.colorA} colorB={wave.colorB} playing={playing} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-5">
        <button onClick={handleExit} className="flex items-center gap-2 text-sm font-medium transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
          <ChevronLeft className="w-4 h-4" /> Exit Waves
        </button>
        <div className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: wave.colorA }}>
          {wave.emoji} {wave.label} · {fmt(elapsed)}
        </div>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Skill selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl">{selectedSkill ? "🎯" : "🌊"}</div>
          <select
            value={selectedSkill?.id || ""}
            onChange={e => setSelectedSkill(skills.find(s => s.id === e.target.value) || null)}
            className="text-xl font-bold text-center bg-transparent border-none outline-none cursor-pointer"
            style={{ color: "white", fontFamily: "'Sora', sans-serif" }}
          >
            <option value="" style={{ background: "#0a0f1e" }}>— Select a skill —</option>
            {skills.map(s => <option key={s.id} value={s.id} style={{ background: "#0a0f1e" }}>{s.name}</option>)}
          </select>
          {selectedSkill && (
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {selectedSkill.dailyTarget || "No daily target set"}
            </span>
          )}
        </div>

        {/* Timer */}
        <div
          className="text-7xl font-bold tabular-nums"
          style={{
            fontFamily: "'Sora', sans-serif",
            color: playing ? wave.colorA : "rgba(255,255,255,0.4)",
            textShadow: playing ? `0 0 40px ${wave.colorA}60` : "none",
            transition: "all 0.5s",
          }}
        >
          {fmt(elapsed)}
        </div>

        {/* Mood picker */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>How are you feeling?</span>
          <div className="flex gap-3">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMood(i)}
                className="text-2xl transition-all rounded-xl p-1.5"
                style={{
                  background: mood === i ? `${wave.colorA}25` : "transparent",
                  border: `2px solid ${mood === i ? wave.colorA : "transparent"}`,
                  transform: mood === i ? "scale(1.2)" : "scale(1)",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
            style={{ background: `linear-gradient(135deg, ${wave.colorA}, ${wave.colorB})`, boxShadow: `0 0 30px ${wave.colorA}50` }}
          >
            {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
          </button>
          {(playing || elapsed > 0) && (
            <button
              onClick={handleStop}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Square className="w-4 h-4 text-white" />
            </button>
          )}
          <button onClick={() => setMuted(m => !m)} className="p-2 rounded-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-24"
            style={{ accentColor: wave.colorA }}
          />
        </div>

        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Space = pause/resume · Esc = exit</span>
      </div>

      {/* Wave type selector */}
      <div className="relative z-10 pb-8 px-6">
        <div className="flex gap-3 overflow-x-auto pb-2 justify-center flex-wrap">
          {WAVE_TYPES.map(w => (
            <button
              key={w.id}
              onClick={() => handleWaveSelect(w)}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl shrink-0 transition-all"
              style={{
                background: waveType.id === w.id ? `${w.colorA}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${waveType.id === w.id ? w.colorA : "rgba(255,255,255,0.1)"}`,
                minWidth: 90,
              }}
            >
              <span className="text-xl">{w.emoji}</span>
              <span className="text-xs font-medium" style={{ color: waveType.id === w.id ? w.colorA : "rgba(255,255,255,0.6)" }}>
                {w.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Summary */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🌊</div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Session Complete</h3>
              </div>
              <div className="space-y-3">
                {[
                  ["Duration", fmt(elapsed)],
                  ["Skill", selectedSkill?.name || "—"],
                  ["Environment", `${wave.emoji} ${wave.label}`],
                  ["Mood", MOODS[mood]],
                  ["XP Earned", selectedSkill ? `+${calcSessionXP(Math.round(elapsed / 60), mood + 1, 0, false)} XP` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onExit}
                  className="flex-1 h-11 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                >
                  Discard
                </button>
                <button
                  onClick={handleLogSession}
                  className="flex-1 h-11 rounded-xl text-sm font-bold text-[#0a0f1e]"
                  style={{ background: `linear-gradient(135deg, ${wave.colorA}, ${wave.colorB})`, boxShadow: `0 0 20px ${wave.colorA}40` }}
                >
                  Log Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
