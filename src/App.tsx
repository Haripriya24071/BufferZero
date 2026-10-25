import React, { useState, useEffect } from "react";
import { Navbar } from "./components/ui/Navbar";
import { Footer } from "./components/ui/Footer";
import { LandingPage } from "./pages/LandingPage";
import { LabPage } from "./pages/LabPage";

export const App: React.FC = () => {
  // Hash routing or view state: supports #/lab for direct bookmarking
  const getInitialView = (): "landing" | "lab" => {
    if (window.location.hash === "#/lab") return "lab";
    return "landing";
  };

  const [currentView, setCurrentView] = useState<"landing" | "lab">(getInitialView);

  // Sync hash with current view
  const navigateTo = (view: "landing" | "lab") => {
    setCurrentView(view);
    window.location.hash = view === "lab" ? "#/lab" : "#/";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#/lab") {
        setCurrentView("lab");
      } else {
        setCurrentView("landing");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F0] text-[#171717]">
      <Navbar currentView={currentView} onNavigate={navigateTo} />

      <div className="flex-1">
        {currentView === "landing" ? (
          <LandingPage onLaunchLab={() => navigateTo("lab")} />
        ) : (
          <LabPage />
        )}
      </div>

      {currentView === "landing" && (
        <Footer onLaunchLab={() => navigateTo("lab")} />
      )}
    </div>
  );
};

export default App;
