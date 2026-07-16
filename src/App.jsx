import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { VideoPlayerProvider } from "./context/VideoPlayerContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RadioPlayer from "./components/RadioPlayer.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import FloatingMiniPlayer from "./components/FloatingMiniPlayer.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const RankingTop20 = lazy(() => import("./pages/RankingTop20.jsx"));
const Top15Videos = lazy(() => import("./pages/Top15Videos.jsx"));
const News = lazy(() => import("./pages/News.jsx"));
const Programs = lazy(() => import("./pages/Programs.jsx"));
const Panel = lazy(() => import("./pages/Panel.jsx"));

function ErrorBoundary({ children }) {
  return <>{children}</>;
}

function PageLoader() {
  return <div className="page" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <p style={{ color: "var(--text-dim)" }}>Cargando…</p>
  </div>;
}

function NotFound() {
  return (
    <div className="page" style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1 className="page__title page__title--xl">404</h1>
      <p className="page__sub">La página que buscas no existe.</p>
      <a href="/" className="btn btn--primary" style={{ marginTop: 20 }}>Volver al inicio</a>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <VideoPlayerProvider>
        <div className="app">
          <CursorGlow />
          <Navbar />
          <main className="app__main">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"             element={<Home />} />
                <Route path="/top-20"       element={<RankingTop20 />} />
                <Route path="/top-15"       element={<Top15Videos />} />
                <Route path="/noticias"     element={<News />} />
                <Route path="/programacion" element={<Programs />} />
                <Route path="/panel"        element={<Panel />} />
                <Route path="*"             element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <RadioPlayer />
          <FloatingMiniPlayer />
        </div>
      </VideoPlayerProvider>
    </ErrorBoundary>
  );
}
