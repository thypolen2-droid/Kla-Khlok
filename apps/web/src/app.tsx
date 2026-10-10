import { useEffect, useMemo, useRef, useState } from "react";
import {
  DIE_FACE_DIRECTIONS,
  DIE_FACE_SYMBOLS,
  GAME_NAME,
  GAME_VERSION,
  MotionProcessor,
  SYMBOL_IDS,
  createBrowserCryptoSampler,
  createInitialRoundState,
  reduceRound,
} from "@kla-khlok/shared";
import type { RoundState } from "@kla-khlok/shared";
import { DiceTableScene } from "./components/DiceTableScene";
import { AudioService } from "./audio/AudioService";
import { PackEditor } from "./components/PackEditor";
import { loadRoundState, saveRoundState } from "./storage/roundPersistence";

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
  const [imageUrls, setImageUrls] = useState<Partial<Record<import("@kla-khlok/shared").SymbolId, string>>>({});
  const [seatMessage, setSeatMessage] = useState("One local seat is ready.");
  const seatCounter = useRef(1);
  const [round, setRound] = useState<RoundState>(() => {
    let initial = createInitialRoundState(["local"]);
    initial = reduceRound(initial, { type: "START_MATCH" }, dependencies);
    initial = reduceRound(initial, { type: "SET_SELECTION", playerId: "local", selection: "s0" }, dependencies);
    initial = reduceRound(initial, { type: "READY", playerId: "local" }, dependencies);
    return loadRoundState(initial);
  });

  useEffect(() => saveRoundState(round), [round]);

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
  const resetSeats = (playerIds: readonly string[]) => {
    let next = createInitialRoundState(playerIds, playerIds[0], round.scoringEnabled);
    next = reduceRound(next, { type: "START_MATCH" }, dependencies);
    setRound(next);
  };
  const addSeat = () => {
    if (round.phase !== "SELECTING" || round.players.length >= 8) return;
    seatCounter.current += 1;
    resetSeats([...round.players.map((player) => player.playerId), `player-${seatCounter.current}`]);
    setSeatMessage("New seat added. Each seat must pick a symbol and confirm ready.");
  };
  const removeSeat = () => {
    if (round.phase !== "SELECTING" || round.players.length <= 1) return;
    resetSeats(round.players.slice(0, -1).map((player) => player.playerId));
    setSeatMessage("Last seat removed and selections reset for the remaining seats.");
  };
  const chooseSeatSymbol = (playerId: string, symbolId: import("@kla-khlok/shared").SymbolId) => {
    setRound((current) => {
      try { return reduceRound(current, { type: "SET_SELECTION", playerId, selection: symbolId }, dependencies); }
      catch { return current; }
    });
  };
  const confirmSeat = (playerId: string) => {
    setRound((current) => {
      try { return reduceRound(current, { type: "READY", playerId }, dependencies); }
      catch { return current; }
    });
  };
  const toggleDiceOnly = () => {
    if (round.phase !== "SELECTING") return;
    setRound((current) => ({ ...current, scoringEnabled: !current.scoringEnabled }));
  };
  const newMatch = () => {
    let next = createInitialRoundState(round.players.map((player) => player.playerId), round.hostPlayerId, round.scoringEnabled);
    next = reduceRound(next, { type: "START_MATCH" }, dependencies);
    setRound(next);
    setSeatMessage("New match started. Seats and pack were preserved; pick and confirm again.");
  };
  const symbolBoard = (
    <div className="symbol-board" aria-label="Six symbol board">
      {SYMBOL_IDS.map((symbolId) => (
        <div className="symbol-card" key={symbolId}>
          <span>{symbolId}</span>
          <span className="symbol-card-image" style={imageUrls[symbolId] ? { backgroundImage: `url(${imageUrls[symbolId]})` } : undefined}>{imageUrls[symbolId] ? "" : symbolId}</span>
        </div>
      ))}
    </div>
  );

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
        <section className="score-panel" aria-labelledby="score-panel-title">
          <div className="seat-panel-heading"><h2 id="score-panel-title">Scoreboard</h2><span>{round.history.length}/10 rounds</span></div>
          <div className="score-list">
            {round.players.map((player) => <span key={player.playerId}>{player.playerId}: <strong>{player.score}</strong></span>)}
          </div>
          {round.latestResult && <p className="storage-status">{round.latestResult.winnerIds.length > 0 ? `Round winners: ${round.latestResult.winnerIds.join(", ")}` : "No-match round — no player scored."}</p>}
          {round.history.length > 0 && <ol className="history-list" aria-label="Round history">{round.history.slice().reverse().map((result) => <li key={result.roundId}>Round {result.roundNumber}: {result.outcome.join(" · ")} · {result.winnerIds.length ? result.winnerIds.join(", ") : "no match"}</li>)}</ol>}
          {round.phase === "SELECTING" && <button type="button" onClick={toggleDiceOnly}>{round.scoringEnabled ? "Enable dice-only mode" : "Disable dice-only mode"}</button>}
        </section>
        <DiceTableScene imageUrls={imageUrls} lidOpen={lidOpen} shaking={round.phase === "SHAKING"} revealOutcome={round.latestResult?.outcome ?? null} />
        <section className="seat-panel" aria-labelledby="seat-panel-title">
          <div className="seat-panel-heading">
            <h2 id="seat-panel-title">Local seats</h2>
            <span>{round.players.length}/8</span>
          </div>
          <p className="editor-help">Pass the device around: every seat chooses one symbol, then confirms ready.</p>
          <p className="storage-status" aria-live="polite">{seatMessage}</p>
          <div className="seat-list">
            {round.players.map((player, index) => (
              <div className="seat-card" key={player.playerId}>
                <strong>{index === 0 ? "Host" : `Seat ${index + 1}`}</strong>
                <span>{player.ready ? `Ready · ${player.selection}` : "Pick a symbol"}</span>
                <div className="seat-symbols">
                  {SYMBOL_IDS.map((symbolId) => (
                    <button key={symbolId} type="button" disabled={round.phase !== "SELECTING" || player.ready} aria-pressed={player.selection === symbolId} onClick={() => chooseSeatSymbol(player.playerId, symbolId)}>{symbolId}</button>
                  ))}
                </div>
                <button type="button" disabled={round.phase !== "SELECTING" || player.ready || !player.selection} onClick={() => confirmSeat(player.playerId)}>Confirm ready</button>
              </div>
            ))}
          </div>
          {round.phase === "SELECTING" && <div className="seat-actions"><button type="button" disabled={round.players.length >= 8} onClick={addSeat}>Add seat</button><button type="button" disabled={round.players.length <= 1} onClick={removeSeat}>Remove seat</button></div>}
        </section>
        <ul className="face-map" aria-label="Die face mapping debug view">
          {DIE_FACE_DIRECTIONS.map((direction, index) => (
            <li key={direction}>{direction}: {DIE_FACE_SYMBOLS[index]}</li>
          ))}
        </ul>
        {symbolBoard}
        <PackEditor onSlotImageChange={(slotId, previewUrl) => setImageUrls((current) => ({ ...current, [slotId]: previewUrl }))} />
        {round.phase === "SELECTING" && <button type="button" disabled={round.players.some((player) => !player.selection || !player.ready)} onClick={startRoll}>Tap to Start</button>}
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
            <button type="button" onClick={newMatch}>New Match</button>
          </>
        )}
        {round.phase === "MATCH_FINISHED" && <button type="button" onClick={newMatch}>New Match</button>}
      </section>
    </main>
  );
}
