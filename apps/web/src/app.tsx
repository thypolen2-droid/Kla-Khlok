import { GAME_NAME, GAME_VERSION } from "@kla-khlok/shared";

export function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="game-title">
        <p className="eyebrow">ខ្លាឃ្លោក · Foundation</p>
        <h1 id="game-title">{GAME_NAME}</h1>
        <p className="status">Scaffold ready · version {GAME_VERSION}</p>
        <p className="description">
          The game foundation is ready for the shared rules and playable dice jobs.
        </p>
      </section>
    </main>
  );
}
