import { Routes, Route } from "react-router-dom";
import { VideoPlayerProvider } from "./context/VideoPlayerContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RadioPlayer from "./components/RadioPlayer.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import FloatingMiniPlayer from "./components/FloatingMiniPlayer.jsx";
import Home from "./pages/Home.jsx";
import RankingTop20 from "./pages/RankingTop20.jsx";
import Top15Videos from "./pages/Top15Videos.jsx";
import News from "./pages/News.jsx";
import Programs from "./pages/Programs.jsx";
import Panel from "./pages/Panel.jsx";

export default function App() {
  return (
    <VideoPlayerProvider>
      <div className="app">
        <CursorGlow />
        <Navbar />
        <main className="app__main">
          <Routes>
            <Route path="/"             element={<Home />} />
            <Route path="/top-20"       element={<RankingTop20 />} />
            <Route path="/top-15"       element={<Top15Videos />} />
            <Route path="/noticias"     element={<News />} />
            <Route path="/programacion" element={<Programs />} />
            <Route path="/panel"          element={<Panel />} />
          </Routes>
        </main>
        <Footer />
        <RadioPlayer />
        <FloatingMiniPlayer />
      </div>
    </VideoPlayerProvider>
  );
}
