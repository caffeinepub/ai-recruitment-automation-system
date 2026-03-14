import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Interview } from "../backend.d";
import { InterviewStatus, PipelineStage } from "../backend.d";
import {
  useCandidates,
  useInterviews,
  useScheduleInterview,
  useUpdateCandidate,
  useUpdateInterview,
} from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatDateTime, newId, nowNs, scoreLabel } from "../lib/data";

const STATUS_COLORS: Record<InterviewStatus, string> = {
  [InterviewStatus.scheduled]: "bg-blue-100 text-blue-700",
  [InterviewStatus.confirmed]: "bg-green-100 text-green-700",
  [InterviewStatus.completed]: "bg-muted text-muted-foreground",
  [InterviewStatus.cancelled]: "bg-red-100 text-red-700",
};

export default function InterviewPage() {
  const { identity } = useInternetIdentity();
  const { data: interviews, isLoading } = useInterviews();
  const { data: candidates } = useCandidates();
  const scheduleInterview = useScheduleInterview();
  const updateInterview = useUpdateInterview();
  const updateCandidate = useUpdateCandidate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    candidateId: "",
    companyName: "",
    date: "",
    location: "",
  });

  const candidate = candidates?.find((c) => c.id === form.candidateId);
  const waPreview =
    form.candidateId && form.companyName && form.date
      ? `Namaste ${candidate?.name ?? "[Name]"}\n\nAapka interview ${form.companyName} me schedule hua hai.\n\nDate: ${form.date}\nLocation: ${form.location || "[Location]"}\n\nPlease confirm.`
      : null;

  async function handleSchedule() {
    if (!form.candidateId || !form.companyName || !form.date) {
      toast.error("Please fill all required fields");
      return;
    }
    const cand = candidates?.find((c) => c.id === form.candidateId);
    const interview: Interview = {
      id: newId(),
      candidateId: form.candidateId,
      jobId: cand?.jobId ?? "",
      companyName: form.companyName,
      date: BigInt(new Date(form.date).getTime()) * 1_000_000n,
      location: form.location,
      status: InterviewStatus.scheduled,
      whatsappSent: false,
      createdAt: nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      await scheduleInterview.mutateAsync(interview);
      if (cand) {
        await updateCandidate.mutateAsync({
          ...cand,
          pipelineStage: PipelineStage.interviewScheduled,
          interviewDate: interview.date,
          interviewLocation: form.location,
        });
      }
      toast.success("Interview scheduled");
      setOpen(false);
      setForm({ candidateId: "", companyName: "", date: "", location: "" });
    } catch {
      toast.error("Failed to schedule");
    }
  }

  async function handleStatusUpdate(
    interview: Interview,
    status: InterviewStatus,
  ) {
    await updateInterview.mutateAsync({ ...interview, status });
    toast.success(`Interview marked as ${status}`);
  }

  async function handleSendWhatsApp(interview: Interview) {
    const cand = candidates?.find((c) => c.id === interview.candidateId);
    const msg = `Namaste ${cand?.name ?? ""}, Aapka interview ${interview.companyName} me schedule hua hai. Date: ${formatDateTime(interview.date)}, Location: ${interview.location}. Please confirm.`;
    await updateInterview.mutateAsync({ ...interview, whatsappSent: true });
    toast.success(`WhatsApp sent to ${cand?.name}: ${msg.substring(0, 50)}...`);
  }

  return (
    <div className="p-6 space-y-4" data-ocid="interview.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Interviews</h1>
          <p className="text-muted-foreground text-sm">
            {interviews?.length ?? 0} scheduled
          </p>
        </div>
        <Button
          data-ocid="interview.schedule.button"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : interviews?.length === 0 ? (
        <div
          data-ocid="interview.empty_state"
          className="flex flex-col items-center justify-center py-20"
        >
          <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No interviews scheduled yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews!.map((interview, i) => {
            const cand = candidates?.find(
              (c) => c.id === interview.candidateId,
            );
            const sl = cand ? scoreLabel(cand.score) : null;
            return (
              <Card
                key={interview.id}
                data-ocid={`interview.item.${i + 1}`}
                className="border-0 shadow-xs"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {cand?.name ?? "Unknown"}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[interview.status]}`}
                        >
                          {interview.status.charAt(0).toUpperCase() +
                            interview.status.slice(1)}
                        </Badge>
                        {interview.whatsappSent && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> WhatsApp
                            Sent
                          </Badge>
                        )}
                      </div>
                      {/* Phone + Score below candidate name */}
                      {cand && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cand.phone}
                          </span>
                          {sl && (
                            <span className={`font-semibold ${sl.color}`}>
                              Score: {String(cand.score)}/10 ({sl.label})
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-sm font-medium">
                        {interview.companyName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(interview.date)}
                        </span>
                        {interview.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {interview.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!interview.whatsappSent && (
                        <Button
                          data-ocid={`interview.whatsapp.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => handleSendWhatsApp(interview)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                        </Button>
                      )}
                      {interview.status === InterviewStatus.scheduled && (
                        <Button
                          data-ocid={`interview.confirm.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusUpdate(
                              interview,
                              InterviewStatus.confirmed,
                            )
                          }
                        >
                          Confirm
                        </Button>
                      )}
                      {interview.status !== InterviewStatus.completed &&
                        interview.status !== InterviewStatus.cancelled && (
                          <Button
                            data-ocid={`interview.complete.button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusUpdate(
                                interview,
                                InterviewStatus.completed,
                              )
                            }
                          >
                            Mark Done
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-ocid="interview.dialog">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Candidate *</Label>
              <Select
                value={form.candidateId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, candidateId: v }))
                }
              >
                <SelectTrigger data-ocid="interview.candidate.select">
                  <SelectValue placeholder="Select candidate..." />
                </SelectTrigger>
                <SelectContent>
                  {candidates
                    ?.filter(
                      (c) =>
                        c.responseTag === "interested" ||
                        c.pipelineStage === "qualified",
                    )
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Company Name *</Label>
              <Input
                data-ocid="interview.company.input"
                value={form.companyName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, companyName: e.target.value }))
                }
                placeholder="Infosys"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date & Time *</Label>
                <Input
                  data-ocid="interview.date.input"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  data-ocid="interview.location.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Bengaluru Office"
                />
              </div>
            </div>
            {waPreview && (
              <div className="space-y-1">
                <Label className="text-xs">WhatsApp Preview</Label>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm whitespace-pre-line text-green-800">
                  {waPreview}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="interview.cancel.button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="interview.save.button"
              onClick={handleSchedule}
              disabled={scheduleInterview.isPending}
            >
              {scheduleInterview.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
