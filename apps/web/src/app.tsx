import { useEffect, useMemo, useState } from "react";
import {
  DIE_FACE_DIRECTIONS,
  DIE_FACE_SYMBOLS,
  GAME_NAME,
  GAME_VERSION,
  MotionProcessor,
  createBrowserCryptoSampler,
  createInitialRoundState,
  reduceRound,
} from "@kla-khlok/shared";
import type { RoundState } from "@kla-khlok/shared";
import { DiceTableScene } from "./components/DiceTableScene";
import { AudioService } from "./audio/AudioService";
import { PackEditor } from "./components/PackEditor";

export function App() {
  const path = window.location.pathname;
  const isPlayRoute = path === "/play";
  const sampler = useMemo(() => createBrowserCryptoSampler(), []);
  const dependencies = useMemo(() => ({ sampleOutcome: sampler }), [sampler]);
  const motionProcessor = useMemo(() => new MotionProcessor(), []);
  const audio = useMemo(() => new AudioService(), []);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionStatus, setMotionStatus] = useState("Motion not enabled");
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [muted, setMuted] = useState(false);
  const [round, setRound] = useState<RoundState>(() => {
    let initial = createInitialRoundState(["local"]);
    initial = reduceRound(initial, { type: "START_MATCH" }, dependencies);
    initial = reduceRound(initial, { type: "SET_SELECTION", playerId: "local", selection: "s0" }, dependencies);
    return reduceRound(initial, { type: "READY", playerId: "local" }, dependencies);
  });

  useEffect(() => {
    if (round.phase !== "SETTLING" && round.phase !== "REVEALING") return;
    const timer = window.setInterval(() => {
      setRound((current) => reduceRound(current, { type: "TICK", now: Date.now() }, dependencies));
    }, 50);
    return () => window.clearInterval(timer);
  }, [dependencies, round.phase]);

  useEffect(() => {
    if (!motionEnabled) return;
    const onMotion = (event: DeviceMotionEvent) => {
      const result = motionProcessor.push({
        timestamp: Number.isFinite(event.timeStamp) ? event.timeStamp : performance.now(),
        acceleration: event.acceleration
          ? { x: event.acceleration.x, y: event.acceleration.y, z: event.acceleration.z }
          : null,
        accelerationIncludingGravity: event.accelerationIncludingGravity
          ? { x: event.accelerationIncludingGravity.x, y: event.accelerationIncludingGravity.y, z: event.accelerationIncludingGravity.z }
          : null,
      });
      if (result.valid) setMotionIntensity(result.intensity);
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [motionEnabled, motionProcessor]);

  useEffect(() => {
    audio.setMuted(muted);
  }, [audio, muted]);

  useEffect(() => {
    if (round.phase === "SHAKING") {
      audio.startRattle(motionIntensity);
    } else {
      audio.stopRattle();
    }
    if (round.phase === "RESULTS") {
      audio.playReveal();
      audio.vibrate(35);
    }
  }, [audio, motionIntensity, round.phase]);

  useEffect(() => () => audio.dispose(), [audio]);

  const lidOpen = round.phase === "SELECTING" || round.phase === "RESULTS";
  const startRoll = () => {
    void audio.unlock();
    setRound((current) => {
      if (current.phase !== "SELECTING") return current;
      let next = reduceRound(current, { type: "ARM", actorId: "local" }, dependencies);
      next = reduceRound(next, { type: "SHAKE_START", actorId: "local" }, dependencies);
      return next;
    });
  };
  const stopRoll = () => setRound((current) => (
    current.phase === "SHAKING"
      ? reduceRound(current, { type: "STOP", actorId: "local", now: Date.now() }, dependencies)
      : current
  ));
  const nextRound = () => setRound((current) => reduceRound(current, { type: "NEXT" }, dependencies));

  const enableMotion = async () => {
    await audio.unlock();
    if (!("DeviceMotionEvent" in window)) {
      setMotionStatus("Motion unavailable — use button controls");
      return;
    }
    const deviceMotion = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (deviceMotion.requestPermission) {
      try {
        const permission = await deviceMotion.requestPermission();
        if (permission !== "granted") {
          setMotionStatus("Motion denied — button controls remain available");
          return;
        }
      } catch {
        setMotionStatus("Motion permission failed — button controls remain available");
        return;
      }
    }
    setMotionEnabled(true);
    setMotionStatus("Motion ready");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        startRoll();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        stopRoll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="game-title">
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/play">Play</a>
        </nav>
        <p className="eyebrow">ខ្លាឃ្លោក · Foundation</p>
        <h1 id="game-title">{GAME_NAME}</h1>
        <p className="status">{isPlayRoute ? "Play route ready" : "Home route ready"} · version {GAME_VERSION}</p>
        <p className="description">
          {isPlayRoute ? "One local demo seat is ready to test the authoritative roll lifecycle." : "The game foundation is ready for the shared rules and playable dice jobs."}
        </p>
        <p className="phase-status" aria-live="polite">Phase: {round.phase} · Round {round.roundNumber} · Motion {Math.round(motionIntensity * 100)}%</p>
        <DiceTableScene lidOpen={lidOpen} shaking={round.phase === "SHAKING"} revealOutcome={round.latestResult?.outcome ?? null} />
        <ul className="face-map" aria-label="Die face mapping debug view">
          {DIE_FACE_DIRECTIONS.map((direction, index) => (
            <li key={direction}>{direction}: {DIE_FACE_SYMBOLS[index]}</li>
          ))}
        </ul>
        <PackEditor />
        {round.phase === "SELECTING" && <button type="button" onClick={startRoll}>Tap to Start</button>}
        {round.phase === "SHAKING" && <button type="button" onClick={stopRoll}>Stop Shake</button>}
        {!motionEnabled && <button type="button" onClick={enableMotion}>Enable Motion</button>}
        <button type="button" onClick={() => setMuted((current) => !current)}>{muted ? "Unmute" : "Mute"}</button>
        <p className="motion-status" aria-live="polite">{motionStatus}</p>
        {round.phase !== "RESULTS" && round.phase !== "MATCH_FINISHED" && (
          <button
            className="hold-control"
            type="button"
            disabled={round.phase !== "SELECTING" && round.phase !== "SHAKING"}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              startRoll();
            }}
            onPointerUp={stopRoll}
            onPointerCancel={stopRoll}
          >
            Hold to Shake
          </button>
        )}
        {(round.phase === "SETTLING" || round.phase === "REVEALING") && <p className="phase-status">Settling… reveal is locked to the original outcome.</p>}
        {round.phase === "RESULTS" && (
          <>
            <p className="result-status" aria-live="polite">Result: {round.latestResult?.outcome.join(" · ")} · Points: {round.latestResult?.pointsDelta.local ?? 0}</p>
            <button type="button" onClick={nextRound}>Next Round</button>
          </>
        )}
      </section>
    </main>
  );
}
