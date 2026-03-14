import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, MessageCircle, Send, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ResponseTag } from "../backend.d";
import { useCampaigns, useCandidates } from "../hooks/useBackend";
import { RESPONSE_TAGS } from "../lib/data";

const MESSAGE_TEMPLATES = [
  {
    id: "interview",
    name: "Interview Invite",
    content:
      "Namaste {name}! Aapko {company} mein {job} ke liye interview ke liye invite kiya ja raha hai. Kripya confirm karein.",
  },
  {
    id: "followup",
    name: "Follow-up",
    content:
      "Namaste {name}! Humne aapke {job} application ke baare mein follow-up karna tha. Kya aap abhi bhi interested hain?",
  },
  {
    id: "offer",
    name: "Offer Letter",
    content:
      "Namaste {name}! Badhai ho! {company} ki taraf se aapko {job} ke liye offer letter bheja ja raha hai.",
  },
];

interface MessageLog {
  id: string;
  candidateName: string;
  phone: string;
  message: string;
  status: "Sent" | "Delivered" | "Failed";
  timestamp: string;
}

export default function WhatsAppPage() {
  const { data: candidates = [] } = useCandidates();
  const { data: campaigns = [] } = useCampaigns();

  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("interview");
  const [customMessage, setCustomMessage] = useState("");
  const [autoFollowup, setAutoFollowup] = useState(false);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [isSending, setIsSending] = useState(false);

  const [statsToday, setStatsToday] = useState({
    sent: 0,
    delivered: 0,
    failed: 0,
  });

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedCampaign !== "all" && c.campaignId !== selectedCampaign)
        return false;
      if (tagFilter !== "all" && c.responseTag !== (tagFilter as ResponseTag))
        return false;
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q))
        return false;
      return true;
    });
  }, [candidates, selectedCampaign, tagFilter, search]);

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendMessages() {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one candidate.");
      return;
    }
    const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    const msgTemplate = customMessage || template?.content || "";
    setIsSending(true);
    const selected = candidates.filter((c) => selectedIds.has(c.id));
    const logs: MessageLog[] = [];
    let delivered = 0;
    let failed = 0;
    for (const c of selected) {
      const status: "Delivered" | "Failed" =
        Math.random() > 0.15 ? "Delivered" : "Failed";
      if (status === "Delivered") delivered++;
      else failed++;
      logs.push({
        id: crypto.randomUUID(),
        candidateName: c.name,
        phone: c.phone,
        message: msgTemplate
          .replace("{name}", c.name)
          .replace("{job}", "")
          .replace("{company}", ""),
        status,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
    }
    setMessageLogs((prev) => [...logs, ...prev]);
    setStatsToday((prev) => ({
      sent: prev.sent + selected.length,
      delivered: prev.delivered + delivered,
      failed: prev.failed + failed,
    }));
    toast.success(
      `Sent to ${selected.length} candidates. Delivered: ${delivered}, Failed: ${failed}`,
    );
    setSelectedIds(new Set());
    setIsSending(false);
  }

  function getTagInfo(tag: ResponseTag) {
    return RESPONSE_TAGS.find((t) => t.value === tag) ?? RESPONSE_TAGS[0];
  }

  // Live message preview
  const activeTemplate = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
  const msgTemplate = customMessage || activeTemplate?.content || "";
  const previewCandidateName =
    filtered.find((c) => selectedIds.has(c.id))?.name ?? "Candidate Name";
  const messagePreview = msgTemplate
    .replace("{name}", previewCandidateName)
    .replace("{job}", "[Job Role]")
    .replace("{company}", "[Company]");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">WhatsApp Messaging</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send bulk WhatsApp messages to candidates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Messages Today",
            value: statsToday.sent,
            icon: MessageCircle,
            color: "text-primary",
          },
          {
            label: "Delivered",
            value: statsToday.delivered,
            icon: CheckCircle2,
            color: "text-green-600",
          },
          {
            label: "Failed",
            value: statsToday.failed,
            icon: XCircle,
            color: "text-red-500",
          },
          {
            label: "Daily Limit",
            value: "500/day",
            icon: Send,
            color: "text-muted-foreground",
          },
        ].map((s) => (
          <Card key={s.label} data-ocid="whatsapp.stats.card">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-44" data-ocid="whatsapp.campaign.select">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-40" data-ocid="whatsapp.tag.select">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {RESPONSE_TAGS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-56"
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="whatsapp.search_input"
        />
      </div>

      {/* Candidate table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Candidates ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="whatsapp.candidates.empty_state"
            >
              No candidates match the current filters.
            </div>
          ) : (
            <Table data-ocid="whatsapp.candidates.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      data-ocid="whatsapp.select_all.checkbox"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, i) => {
                  const tag = getTagInfo(c.responseTag);
                  return (
                    <TableRow
                      key={c.id}
                      data-ocid={`whatsapp.candidates.row.${i + 1}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleOne(c.id)}
                          data-ocid={`whatsapp.candidates.checkbox.${i + 1}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone}
                      </TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(c.score)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message Composer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger data-ocid="whatsapp.template.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Custom Message (overrides template)</Label>
                <Textarea
                  placeholder="Use {name}, {job}, {company} as placeholders…"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  data-ocid="whatsapp.message.textarea"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-1.5" data-ocid="whatsapp.preview.panel">
              <Label>Live Preview</Label>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 min-h-[120px] relative">
                <div className="absolute top-2 right-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-100 text-green-700 border-green-300"
                  >
                    WhatsApp
                  </Badge>
                </div>
                <p className="text-sm text-green-900 whitespace-pre-line leading-relaxed">
                  {messagePreview || (
                    <span className="text-green-400 italic">
                      Preview will appear here…
                    </span>
                  )}
                </p>
                {selectedIds.size > 0 && (
                  <p className="text-[10px] text-green-600 mt-2">
                    Showing preview for: <strong>{previewCandidateName}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-followup"
                checked={autoFollowup}
                onCheckedChange={setAutoFollowup}
                data-ocid="whatsapp.auto_followup.switch"
              />
              <Label htmlFor="auto-followup">Auto Follow-up</Label>
            </div>
            <Button
              onClick={sendMessages}
              disabled={isSending || selectedIds.size === 0}
              data-ocid="whatsapp.send.primary_button"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Selected ({selectedIds.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {messageLogs.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="whatsapp.log.empty_state"
            >
              No messages sent yet.
            </div>
          ) : (
            <Table data-ocid="whatsapp.log.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messageLogs.map((log, i) => (
                  <TableRow
                    key={log.id}
                    data-ocid={`whatsapp.log.row.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {log.candidateName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.phone}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "Delivered"
                            ? "default"
                            : log.status === "Sent"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
