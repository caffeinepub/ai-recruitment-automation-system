import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Loader2, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Settings } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useSaveSettings, useSettings } from "../hooks/useBackend";

export default function SettingsPage() {
  const { data: settings } = useSettings();
  const { actor } = useActor();
  const saveSettings = useSaveSettings();
  const [apiKeys, setApiKeys] = useState<Settings>({
    exotel: "",
    msg91: "",
    gupshup: "",
    sarvamAI: "",
  });
  const [profile, setProfile] = useState({ name: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (settings) setApiKeys(settings);
  }, [settings]);

  async function handleSaveAPI() {
    try {
      await saveSettings.mutateAsync(apiKeys);
      toast.success("API keys saved");
    } catch {
      toast.error("Failed to save");
    }
  }

  async function handleSaveProfile() {
    if (!actor) return;
    setSavingProfile(true);
    try {
      await actor.saveCallerUserProfile({ name: profile.name });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed");
    }
    setSavingProfile(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl" data-ocid="settings.page">
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and integrations
        </p>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Recruiter Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              data-ocid="settings.profile_name.input"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <Button
            data-ocid="settings.save_profile.button"
            size="sm"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" /> Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-0 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4" /> API Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These keys are used to connect to telephony, WhatsApp, and AI
            services.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/40 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Telephony (Exotel)
              </p>
              <div className="space-y-1">
                <Label className="text-sm">Exotel API Key</Label>
                <Input
                  data-ocid="settings.exotel_key.input"
                  type="password"
                  value={apiKeys.exotel}
                  onChange={(e) =>
                    setApiKeys((k) => ({ ...k, exotel: e.target.value }))
                  }
                  placeholder="Enter Exotel API key"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                WhatsApp
              </p>
              <div className="space-y-1">
                <Label className="text-sm">MSG91 Auth Key</Label>
                <Input
                  data-ocid="settings.msg91_key.input"
                  type="password"
                  value={apiKeys.msg91}
                  onChange={(e) =>
                    setApiKeys((k) => ({ ...k, msg91: e.target.value }))
                  }
                  placeholder="Enter MSG91 Auth Key"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Gupshup API Key</Label>
                <Input
                  data-ocid="settings.gupshup_key.input"
                  type="password"
                  value={apiKeys.gupshup}
                  onChange={(e) =>
                    setApiKeys((k) => ({ ...k, gupshup: e.target.value }))
                  }
                  placeholder="Enter Gupshup API Key"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                AI Services
              </p>
              <div className="space-y-1">
                <Label className="text-sm">Sarvam AI API Key</Label>
                <Input
                  data-ocid="settings.sarvam_key.input"
                  type="password"
                  value={apiKeys.sarvamAI}
                  onChange={(e) =>
                    setApiKeys((k) => ({ ...k, sarvamAI: e.target.value }))
                  }
                  placeholder="Enter Sarvam AI Key"
                />
              </div>
            </div>
          </div>

          <Button
            data-ocid="settings.save.button"
            onClick={handleSaveAPI}
            disabled={saveSettings.isPending}
          >
            {saveSettings.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Save className="w-4 h-4 mr-2" /> Save API Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
