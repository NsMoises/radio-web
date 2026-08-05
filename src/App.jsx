import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoPlayerProvider } from "./context/VideoPlayerContext.jsx";
import { StreamProvider } from "./context/StreamContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RadioPlayer from "./components/RadioPlayer.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import FloatingMiniPlayer from "./components/FloatingMiniPlayer.jsx";
import DarkGradientBg from "./components/DarkGradientBg.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const RankingTop20 = lazy(() => import("./pages/RankingTop20.jsx"));
const Candidatos = lazy(() => import("./pages/Candidatos.jsx"));
const Top15Videos = lazy(() => import("./pages/Top15Videos.jsx"));
const Cine = lazy(() => import("./pages/Cine.jsx"));
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

function PageShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"             element={<PageShell><Home /></PageShell>} />
        <Route path="/top-20"       element={<PageShell><RankingTop20 /></PageShell>} />
        <Route path="/candidatos"   element={<PageShell><Candidatos /></PageShell>} />
        <Route path="/top-15"       element={<PageShell><Top15Videos /></PageShell>} />
        <Route path="/cine"         element={<PageShell><Cine /></PageShell>} />
        <Route path="/noticias"     element={<PageShell><News /></PageShell>} />
        <Route path="/programacion" element={<PageShell><Programs /></PageShell>} />
        <Route path="/panel"        element={<PageShell><Panel /></PageShell>} />
        <Route path="*"             element={<PageShell><NotFound /></PageShell>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <VideoPlayerProvider>
        <StreamProvider>
        <div className="app">
          <DarkGradientBg />
          <CursorGlow />
          <Navbar />
          <main className="app__main">
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </main>
          <Footer />
          <RadioPlayer />
          <FloatingMiniPlayer />
        </div>
        </StreamProvider>
      </VideoPlayerProvider>
    </ErrorBoundary>
  );
}
