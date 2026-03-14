import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Phone,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "calling", label: "AI Calling", icon: Phone },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "interview", label: "Interview", icon: Calendar },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "submission", label: "Submission", icon: Send },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  active: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ active, onNavigate, open, onToggle }: Props) {
  const { clear, identity } = useInternetIdentity();
  const principalShort = identity?.getPrincipal().toText().slice(0, 8) ?? "...";

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 relative",
        open ? "w-56" : "w-16",
      )}
    >
      <div className="flex items-center gap-3 p-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <BrainCircuit className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {open && (
          <span className="font-display font-bold text-sm truncate">
            AI Recruitment
          </span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            data-ocid={`nav.${id}.link`}
            onClick={() => onNavigate(id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active === id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            title={!open ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {open && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        {/* User section */}
        {open ? (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                R
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                Recruiter
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate font-mono">
                {principalShort}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1 mb-1">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                R
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={clear}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title={!open ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground z-10"
      >
        {open ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
