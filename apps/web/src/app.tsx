import { useEffect, useMemo, useState } from "react";
import {
  DIE_FACE_DIRECTIONS,
  DIE_FACE_SYMBOLS,
  GAME_NAME,
  GAME_VERSION,
  createBrowserCryptoSampler,
  createInitialRoundState,
  reduceRound,
} from "@kla-khlok/shared";
import type { RoundState } from "@kla-khlok/shared";
import { DiceTableScene } from "./components/DiceTableScene";

export function App() {
  const path = window.location.pathname;
  const isPlayRoute = path === "/play";
  const sampler = useMemo(() => createBrowserCryptoSampler(), []);
  const dependencies = useMemo(() => ({ sampleOutcome: sampler }), [sampler]);
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

  const lidOpen = round.phase === "SELECTING" || round.phase === "RESULTS";
  const startRoll = () => {
    let next = reduceRound(round, { type: "ARM", actorId: "local" }, dependencies);
    next = reduceRound(next, { type: "SHAKE_START", actorId: "local" }, dependencies);
    setRound(next);
  };
  const stopRoll = () => setRound((current) => reduceRound(current, { type: "STOP", actorId: "local", now: Date.now() }, dependencies));
  const nextRound = () => setRound((current) => reduceRound(current, { type: "NEXT" }, dependencies));

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
        <p className="phase-status" aria-live="polite">Phase: {round.phase} · Round {round.roundNumber}</p>
        <DiceTableScene lidOpen={lidOpen} shaking={round.phase === "SHAKING"} />
        <ul className="face-map" aria-label="Die face mapping debug view">
          {DIE_FACE_DIRECTIONS.map((direction, index) => (
            <li key={direction}>{direction}: {DIE_FACE_SYMBOLS[index]}</li>
          ))}
        </ul>
        {round.phase === "SELECTING" && <button type="button" onClick={startRoll}>Start Shake</button>}
        {round.phase === "SHAKING" && <button type="button" onClick={stopRoll}>Stop Shake</button>}
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
