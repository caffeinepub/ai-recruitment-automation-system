import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, PhoneCall, RefreshCcw, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Candidate } from "../backend.d";
import { CallStatus, PipelineStage, ResponseTag } from "../backend.d";
import {
  useCampaigns,
  useCandidates,
  useUpdateCandidate,
} from "../hooks/useBackend";
import { CALL_STATUS_MAP, RESPONSE_TAGS, nowNs } from "../lib/data";

const CALL_OUTCOMES = [
  CallStatus.answered,
  CallStatus.noAnswer,
  CallStatus.busy,
  CallStatus.wrongNumber,
];

export default function AICallingPage() {
  const { data: candidates } = useCandidates();
  const { data: campaigns } = useCampaigns();
  const updateCandidate = useUpdateCandidate();

  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [callingIds, setCallingIds] = useState<Set<string>>(new Set());
  const [callFilter, setCallFilter] = useState<"all" | "new" | "shortlisted">(
    "all",
  );
  const [liveCallName, setLiveCallName] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const transcriptTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const campaignCandidates = (candidates ?? []).filter((c) => {
    if (selectedCampaign !== "all" && c.campaignId !== selectedCampaign)
      return false;
    if (callFilter === "new" && c.callAttempts > 0n) return false;
    if (
      callFilter === "shortlisted" &&
      c.responseTag !== ResponseTag.interested
    )
      return false;
    return true;
  });

  const callsMade = campaignCandidates.filter(
    (c) => c.callStatus !== CallStatus.pending,
  ).length;
  const callsAnswered = campaignCandidates.filter(
    (c) => c.callStatus === CallStatus.answered,
  ).length;
  const failed = campaignCandidates.filter(
    (c) =>
      c.callStatus === CallStatus.noAnswer || c.callStatus === CallStatus.busy,
  ).length;

  const total = campaignCandidates.length;
  const progressPct = total > 0 ? Math.round((callsMade / total) * 100) : 0;

  // Cleanup transcript timer on unmount
  useEffect(() => {
    return () => {
      if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    };
  }, []);

  function startLiveCallPanel(name: string) {
    setLiveCallName(name);
    setLiveTranscript("");
    const fullText = `AI: Namaste! Main hiring assistant bol raha hu. Kya aap ${name} ji bol rahe hain?\nCandidate: Haan, main hi bol raha hu.\nAI: Hamare paas ek job opportunity hai...`;
    let idx = 0;
    if (transcriptTimerRef.current) clearInterval(transcriptTimerRef.current);
    transcriptTimerRef.current = setInterval(() => {
      idx += 3;
      setLiveTranscript(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        if (transcriptTimerRef.current)
          clearInterval(transcriptTimerRef.current);
      }
    }, 40);
  }

  async function simulateCall(candidate: Candidate) {
    if (callingIds.has(candidate.id)) return;
    setCallingIds((prev) => {
      const n = new Set(prev);
      n.add(candidate.id);
      return n;
    });
    startLiveCallPanel(candidate.name);

    const calling: Candidate = {
      ...candidate,
      callStatus: CallStatus.calling,
      pipelineStage: PipelineStage.callInitiated,
    };
    await updateCandidate.mutateAsync(calling);

    await new Promise((r) => setTimeout(r, 2000));

    const outcome =
      CALL_OUTCOMES[Math.floor(Math.random() * CALL_OUTCOMES.length)];
    const attempts = candidate.callAttempts + 1n;
    const nextRetry =
      outcome === CallStatus.noAnswer || outcome === CallStatus.busy
        ? nowNs() +
          (attempts === 1n
            ? 2n * 3600n * 1_000_000_000n
            : 24n * 3600n * 1_000_000_000n)
        : undefined;

    const score =
      outcome === CallStatus.answered
        ? BigInt(Math.floor(Math.random() * 5) + 5)
        : candidate.score;
    const responseTag =
      outcome === CallStatus.answered
        ? Math.random() > 0.4
          ? ResponseTag.interested
          : ResponseTag.notInterested
        : outcome === CallStatus.busy
          ? ResponseTag.busy
          : candidate.responseTag;

    const transcript =
      outcome === CallStatus.answered
        ? `AI: Namaste! Main hiring assistant bol raha hu. Kya aap ${candidate.name} ji bol rahe hain?\nCandidate: Haan, main hi bol raha hu.\nAI: Hamare paas ek job opportunity hai. Kya aap interested hain?\nCandidate: ${Math.random() > 0.4 ? "Haan, bataiye" : "Nahi, abhi nahi"}.\nAI: Aapki qualification kya hai?\nCandidate: ${candidate.qualification || "B.Tech"}\nAI: Kab join kar sakte hain?\nCandidate: 1 month mein.\nAI: Bahut achha, humara team aapse contact karega. Thank you!`
        : "";

    const updated: Candidate = {
      ...candidate,
      callStatus: outcome,
      callAttempts: attempts,
      nextRetryAt: nextRetry,
      score,
      responseTag,
      transcript,
      pipelineStage:
        outcome === CallStatus.answered
          ? PipelineStage.callAnswered
          : PipelineStage.callInitiated,
    };
    await updateCandidate.mutateAsync(updated);
    setCallingIds((prev) => {
      const n = new Set(prev);
      n.delete(candidate.id);
      return n;
    });
    // clear live panel when all calls done
    setLiveCallName((prev) => (callingIds.size <= 1 ? "" : prev));
    toast.success(`${candidate.name}: ${CALL_STATUS_MAP[outcome]?.label}`);
  }

  async function callAll() {
    const pending = campaignCandidates.filter(
      (c) =>
        c.callStatus === CallStatus.pending ||
        c.callStatus === CallStatus.noAnswer,
    );
    if (pending.length === 0) {
      toast.info("No candidates to call");
      return;
    }
    toast.info(`Initiating ${pending.length} calls...`);
    for (const c of pending.slice(0, 10)) {
      simulateCall(c);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const statsData = [
    {
      label: "Total in Queue",
      value: total,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Calls Made",
      value: callsMade,
      icon: Phone,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Answered",
      value: callsAnswered,
      icon: PhoneCall,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "No Answer / Busy",
      value: failed,
      icon: RefreshCcw,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ];

  const isCallActive = callingIds.size > 0;

  return (
    <div className="p-6 space-y-4" data-ocid="calling.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">AI Calling</h1>
          <p className="text-muted-foreground text-sm">
            Manage automated calling campaigns
          </p>
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-48" data-ocid="calling.campaign.select">
            <SelectValue placeholder="All campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Live Call Panel */}
      {isCallActive && (
        <Card
          className="border-blue-200 bg-blue-50 shadow-xs"
          data-ocid="calling.live_call.panel"
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-sm font-semibold text-blue-800">
                AI is calling{liveCallName ? `: ${liveCallName}` : "..."}
              </p>
              <Badge
                variant="outline"
                className="text-xs bg-blue-100 text-blue-700 ml-auto"
              >
                {callingIds.size} active
              </Badge>
            </div>
            {liveTranscript && (
              <div className="bg-white/70 rounded-md px-3 py-2 text-xs text-blue-900 font-mono whitespace-pre-line leading-relaxed border border-blue-100 max-h-24 overflow-hidden">
                {liveTranscript}
                <span className="animate-pulse">▌</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-3">
        {statsData.map((s) => (
          <Card key={s.label} className="border-0 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}
              >
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1" data-ocid="calling.progress.panel">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Campaign Progress</span>
            <span>
              {progressPct}% complete ({callsMade}/{total})
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      <div className="flex items-center gap-2">
        {(["all", "new", "shortlisted"] as const).map((f) => (
          <Button
            key={f}
            data-ocid={`calling.filter.${f}.tab`}
            variant={callFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setCallFilter(f)}
          >
            {f === "all"
              ? "All Candidates"
              : f === "new"
                ? "New Only"
                : "Shortlisted"}
          </Button>
        ))}
        <div className="flex-1" />
        <Button data-ocid="calling.call_all.button" size="sm" onClick={callAll}>
          <Phone className="w-3 h-3 mr-1" /> Call All
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignCandidates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="calling.empty_state"
                >
                  No candidates in queue
                </TableCell>
              </TableRow>
            ) : (
              campaignCandidates.map((c, i) => {
                const cs = CALL_STATUS_MAP[c.callStatus];
                const tag = RESPONSE_TAGS.find(
                  (t) => t.value === c.responseTag,
                );
                const isCalling = callingIds.has(c.id);
                return (
                  <TableRow key={c.id} data-ocid={`calling.row.item.${i + 1}`}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone}
                    </TableCell>
                    <TableCell>{String(c.callAttempts)}/3</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${isCalling ? "bg-blue-100 text-blue-700 animate-pulse" : cs?.color}`}
                      >
                        {isCalling ? "Calling..." : cs?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${tag?.color}`}
                      >
                        {tag?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        data-ocid={`calling.call.button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        disabled={
                          isCalling ||
                          Number(c.callAttempts) >= 3 ||
                          c.callStatus === CallStatus.answered
                        }
                        onClick={() => simulateCall(c)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {isCalling
                          ? "Calling"
                          : Number(c.callAttempts) >= 3
                            ? "Max Retries"
                            : "Call"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-1">
        <p className="font-medium">Retry Schedule</p>
        <p className="text-muted-foreground">• Attempt 1 — Immediately</p>
        <p className="text-muted-foreground">• Attempt 2 — After 2 hours</p>
        <p className="text-muted-foreground">• Attempt 3 — Next day</p>
      </div>
    </div>
  );
}
