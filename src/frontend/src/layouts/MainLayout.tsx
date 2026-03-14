import { useState } from "react";
import AICallingPage from "../pages/AICallingPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import CampaignsPage from "../pages/CampaignsPage";
import CandidatesPage from "../pages/CandidatesPage";
import ClientSubmissionPage from "../pages/ClientSubmissionPage";
import DashboardPage from "../pages/DashboardPage";
import InterviewPage from "../pages/InterviewPage";
import JobsPage from "../pages/JobsPage";
import PipelinePage from "../pages/PipelinePage";
import SettingsPage from "../pages/SettingsPage";
import TemplatesPage from "../pages/TemplatesPage";
import WhatsAppPage from "../pages/WhatsAppPage";
import Sidebar from "./Sidebar";

interface Props {
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export default function MainLayout({ activeSection, setActiveSection }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function renderPage() {
    switch (activeSection) {
      case "dashboard":
        return <DashboardPage setActiveSection={setActiveSection} />;
      case "jobs":
        return <JobsPage />;
      case "campaigns":
        return <CampaignsPage />;
      case "candidates":
        return <CandidatesPage />;
      case "calling":
        return <AICallingPage />;
      case "pipeline":
        return <PipelinePage />;
      case "interview":
        return <InterviewPage />;
      case "whatsapp":
        return <WhatsAppPage />;
      case "submission":
        return <ClientSubmissionPage />;
      case "templates":
        return <TemplatesPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage setActiveSection={setActiveSection} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        active={activeSection}
        onNavigate={setActiveSection}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 overflow-auto">{renderPage()}</main>
    </div>
  );
}
