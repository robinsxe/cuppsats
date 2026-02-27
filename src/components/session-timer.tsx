"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, Square, Timer, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionTimerProps {
  initialMinutes?: number;
  sessionWordDelta?: number;
  onSessionEnd?: (minutes: number) => void;
}

type TimerState = "idle" | "running" | "paused" | "finished";

const PRESETS = [5, 15, 25, 50] as const;

const STORAGE_KEY = "session-timer";

interface StoredTimer {
  endTime: number;
  totalSeconds: number;
  state: TimerState;
  pausedRemaining?: number;
}

export function SessionTimer({ initialMinutes, sessionWordDelta = 0, onSessionEnd }: SessionTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const totalSecondsRef = useRef<number>(0);
  const hasAutoStarted = useRef(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredTimer = JSON.parse(stored);
        if (data.state === "running") {
          const now = Date.now();
          const rem = Math.max(0, Math.ceil((data.endTime - now) / 1000));
          if (rem > 0) {
            setTotalSeconds(data.totalSeconds);
            totalSecondsRef.current = data.totalSeconds;
            setRemaining(rem);
            endTimeRef.current = data.endTime;
            setTimerState("running");
            return;
          }
        } else if (data.state === "paused" && data.pausedRemaining && data.pausedRemaining > 0) {
          setTotalSeconds(data.totalSeconds);
          totalSecondsRef.current = data.totalSeconds;
          setRemaining(data.pausedRemaining);
          setTimerState("paused");
          return;
        }
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Auto-start from query param
  useEffect(() => {
    if (initialMinutes && initialMinutes > 0 && !hasAutoStarted.current && timerState === "idle") {
      hasAutoStarted.current = true;
      startTimer(initialMinutes * 60);
    }
  }, [initialMinutes, timerState]);

  const persist = useCallback((state: TimerState, endTime: number, total: number, pausedRemaining?: number) => {
    const data: StoredTimer = { endTime, totalSeconds: total, state, pausedRemaining };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const clearPersisted = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const startTimer = useCallback((seconds: number) => {
    const end = Date.now() + seconds * 1000;
    endTimeRef.current = end;
    totalSecondsRef.current = seconds;
    setTotalSeconds(seconds);
    setRemaining(seconds);
    setTimerState("running");
    persist("running", end, seconds);
  }, [persist]);

  // Tick interval
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const rem = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setRemaining(rem);

        if (rem <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerState("finished");
          setShowCelebration(true);
          clearPersisted();
          const totalMin = Math.round(totalSecondsRef.current / 60);
          onSessionEnd?.(totalMin);
        }
      }, 250);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [timerState, clearPersisted, onSessionEnd]);

  const handlePause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemaining(rem);
    setTimerState("paused");
    persist("paused", 0, totalSecondsRef.current, rem);
  }, [persist]);

  const handleResume = useCallback(() => {
    const end = Date.now() + remaining * 1000;
    endTimeRef.current = end;
    setTimerState("running");
    persist("running", end, totalSecondsRef.current);
  }, [remaining, persist]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setRemaining(0);
    setTotalSeconds(0);
    clearPersisted();
  }, [clearPersisted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  // Celebration overlay
  if (showCelebration) {
    const totalMin = Math.round(totalSeconds / 60);
    return (
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-800 dark:text-green-300">
            Bra jobbat!
          </span>
        </div>
        <p className="text-sm text-green-700 dark:text-green-400">
          {totalMin} min{sessionWordDelta !== 0 && (
            <> — {sessionWordDelta > 0 ? "+" : ""}{sessionWordDelta} ord denna session</>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowCelebration(false);
            setTimerState("idle");
            setTotalSeconds(0);
            setRemaining(0);
          }}
        >
          Stäng
        </Button>
      </div>
    );
  }

  // Idle — show preset buttons
  if (timerState === "idle") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Timer:</span>
        {PRESETS.map((min) => (
          <Button
            key={min}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => startTimer(min * 60)}
          >
            {min} min
          </Button>
        ))}
      </div>
    );
  }

  // Running or paused — show countdown
  return (
    <div className="flex items-center gap-3">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 max-w-48">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-mono font-medium tabular-nums min-w-[3.5rem] text-center">
        {formatTime(remaining)}
      </span>
      {timerState === "running" ? (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePause}>
          <Pause className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResume}>
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStop}>
        <Square className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
