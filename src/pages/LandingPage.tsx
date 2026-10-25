import React from "react";
import { Hero } from "../components/landing/Hero";
import { ProblemBand } from "../components/landing/ProblemBand";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ConceptCards } from "../components/landing/ConceptCards";
import { OutcomesTable } from "../components/landing/OutcomesTable";

interface LandingPageProps {
  onLaunchLab: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchLab }) => {
  return (
    <main className="min-h-screen">
      <Hero onLaunchLab={onLaunchLab} />
      <ProblemBand />
      <HowItWorks />
      <ConceptCards />
      <OutcomesTable />
    </main>
  );
};
