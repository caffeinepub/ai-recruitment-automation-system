import { Button } from "@/components/ui/button";
import { BarChart3, BrainCircuit, Loader2, Phone, Users } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-sidebar flex">
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

      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">
              AI Recruitment
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your recruiter account
            </p>
          </div>
          <Button
            data-ocid="login.submit_button"
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full h-12 text-base"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting...
              </>
            ) : (
              "Sign in with Internet Identity"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New to the platform?{" "}
            <button
              type="button"
              onClick={login}
              className="text-primary hover:underline font-medium"
            >
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
