import { BarChart3, BrainCircuit, Loader2, Phone, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const loginRef = useRef(login);
  loginRef.current = login;

  // Auto-trigger login on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      loginRef.current();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">AI Recruitment</span>
        </div>
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Automate Your
            <br />
            <span className="text-sidebar-primary">Hiring Pipeline</span>
          </h1>
          <p className="text-sidebar-foreground/70 text-lg">
            AI-powered calling campaigns, candidate screening, and WhatsApp
            follow-ups — all in one platform.
          </p>
          <div className="space-y-4">
            {[
              { icon: Phone, text: "Automated AI calling campaigns" },
              { icon: Users, text: "Smart candidate screening & scoring" },
              { icon: BarChart3, text: "Real-time recruitment analytics" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
                  <Icon className="w-4 h-4 text-sidebar-primary" />
                </div>
                <span className="text-sidebar-foreground/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sidebar-foreground/40 text-sm">
          India&apos;s AI-first recruitment platform
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">
              AI Recruitment
            </span>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="w-9 h-9 text-primary" />
              </div>
              {isLoggingIn && (
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isLoggingIn ? "Connecting..." : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {isLoggingIn
                  ? "Opening secure login window..."
                  : "Sign in to access your recruiter dashboard"}
              </p>
            </div>

            <button
              type="button"
              data-ocid="login.submit_button"
              onClick={login}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-xs text-muted-foreground">
              Secured by Internet Identity &bull; No password required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
