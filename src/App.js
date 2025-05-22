import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LearnYard from "./Pages/LearnYard";
import { ThemeProvider } from './context/ThemeContext';
import Header from "./Components/Common/Header";
import Footer from "./Components/Common/Footer";
import Home from "./Pages/Home";
import AnalyseStock from "./Pages/AnalyseStock";
import WatchList from "./Pages/WatchList";
import About from "./Pages/About";
import Notifications from "./Pages/Notifications";
import Profile from "./Pages/Profile";
import Settings from './Pages/Settings';
import Login from "./Pages/Auth/Login";
import SignUp from "./Pages/Auth/SignUp";
import StockPrediction from './Pages/StockPrediction';
import './styles/App.css';

// Create a new component for the app content
function AppContent() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="app-container">
      {!isAuthPage && <Header username="Murugan010101" />}
      <div className={`content-wrapper ${isAuthPage ? 'auth-page' : ''}`}>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyse-stock" element={<AnalyseStock />} />
            <Route path="/watchlist" element={<WatchList />} />
            <Route path="/about" element={<About />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/stock-prediction" element={<StockPrediction />} />
            <Route path="/learn-yard" element={<LearnYard />} />
          </Routes>
        </main>
      </div>
      {!isAuthPage && <Footer />}
    </div>
  );
}

// Main App component
function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;