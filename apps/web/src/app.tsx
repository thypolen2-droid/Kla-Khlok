import { GAME_NAME, GAME_VERSION } from "@kla-khlok/shared";

export function App() {
  const path = window.location.pathname;
  const isPlayRoute = path === "/play";

  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="game-title">
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/play">Play</a>
        </nav>
        <p className="eyebrow">ខ្លាឃ្លោក · Foundation</p>
        <h1 id="game-title">{GAME_NAME}</h1>
        <p className="status">
          {isPlayRoute ? "Play route ready" : "Home route ready"} · version {GAME_VERSION}
        </p>
        <p className="description">
          {isPlayRoute
            ? "The playable table will be assembled in the next gameplay jobs."
            : "The game foundation is ready for the shared rules and playable dice jobs."}
        </p>
      </section>
    </main>
  );
}
