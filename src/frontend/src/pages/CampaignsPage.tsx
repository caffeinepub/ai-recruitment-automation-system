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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ChevronRight,
  FileSpreadsheet,
  Link2,
  Loader2,
  Megaphone,
  Pause,
  Phone,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Square,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Campaign, Candidate } from "../backend.d";
import {
  CallStatus,
  CampaignStatus,
  PipelineStage,
  ResponseTag,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useBulkAddCandidates,
  useCampaigns,
  useCandidates,
  useCreateCampaign,
  useDeleteCampaign,
  useJobs,
  useScriptTemplates,
  useUpdateCampaignStatus,
} from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { CAMPAIGN_STATUS_MAP, formatDate, newId, nowNs } from "../lib/data";
import { loadXLSX } from "../lib/xlsxLoader";

interface ParsedRow {
  name: string;
  phone: string;
  city: string;
  qualification: string;
  experience: string;
}

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z]/g, "");
}

function get(obj: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (obj[k]) return obj[k];
  }
  return "";
}

function parseCSVText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[normalizeKey(h)] = vals[idx] ?? "";
    });
    const phone = get(obj, "phone", "phonenumber", "mobile", "mobilenumber");
    const name = get(obj, "name", "candidatename", "fullname");
    if (!phone && !name) continue;
    rows.push({
      name,
      phone,
      city: get(obj, "city", "location"),
      qualification: get(obj, "qualification", "education"),
      experience: get(obj, "experience", "exp"),
    });
  }
  return rows;
}

function parseSheetRows(jsonRows: Record<string, string>[]): ParsedRow[] {
  return jsonRows
    .map((row) => {
      const norm: Record<string, string> = {};
      for (const k of Object.keys(row)) {
        norm[normalizeKey(k)] = String(row[k]);
      }
      const phone = get(norm, "phone", "phonenumber", "mobile", "mobilenumber");
      const name = get(norm, "name", "candidatename", "fullname");
      return {
        name,
        phone,
        city: get(norm, "city", "location"),
        qualification: get(norm, "qualification", "education"),
        experience: get(norm, "experience", "exp"),
      };
    })
    .filter((r) => r.phone || r.name);
}

const CALL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  calling: "Calling",
  answered: "Answered",
  noAnswer: "No Answer",
  busy: "Busy",
  wrongNumber: "Wrong Number",
};

const TAG_LABELS: Record<string, string> = {
  untagged: "Untagged",
  interested: "Interested",
  notInterested: "Not Interested",
  busy: "Busy",
  callLater: "Call Later",
  wrongNumber: "Wrong Number",
};

function tagColor(tag: string): string {
  if (tag === "interested") return "text-green-600 bg-green-50";
  if (tag === "notInterested") return "text-red-600 bg-red-50";
  if (tag === "busy" || tag === "callLater")
    return "text-yellow-600 bg-yellow-50";
  return "text-muted-foreground bg-muted";
}

function callStatusColor(status: string): string {
  if (status === "answered") return "text-green-600";
  if (status === "noAnswer" || status === "wrongNumber") return "text-red-500";
  if (status === "calling") return "text-blue-500";
  return "text-muted-foreground";
}

interface CampaignDetailSheetProps {
  campaign: Campaign | null;
  onClose: () => void;
  jobs: Campaign["jobId"] extends string
    ? { id: string; jobRole: string; companyName: string; location: string }[]
    : never[];
  candidates: Candidate[];
  onStatusChange: (id: string, status: CampaignStatus) => void;
  onDelete: (id: string) => void;
}

function CampaignDetailSheet({
  campaign,
  onClose,
  jobs,
  candidates,
  onStatusChange,
  onDelete,
}: CampaignDetailSheetProps) {
  const campCandidates = campaign
    ? candidates.filter((c) => c.campaignId === campaign.id)
    : [];
  const job = campaign ? jobs.find((j) => j.id === campaign.jobId) : null;
  const statusInfo = campaign
    ? (CAMPAIGN_STATUS_MAP[campaign.status] ?? {
        label: String(campaign.status),
        color: "",
      })
    : null;

  const interested = campCandidates.filter((c) => {
    const tag = (c.responseTag as string) ?? "untagged";
    return tag === "interested";
  }).length;
  const qualified = campCandidates.filter((c) => Number(c.score) >= 7).length;

  return (
    <Sheet
      open={!!campaign}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        data-ocid="campaigns.detail.sheet"
        className="w-full sm:max-w-2xl overflow-y-auto"
        side="right"
      >
        {campaign && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between gap-2 pr-8">
                <div>
                  <SheetTitle className="text-xl">{campaign.name}</SheetTitle>
                  {job && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {job.companyName} &bull; {job.jobRole} &bull;{" "}
                      {job.location}
                    </p>
                  )}
                </div>
                {statusInfo && (
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
            </SheetHeader>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: "Candidates",
                  value: campCandidates.length,
                  icon: Users,
                },
                {
                  label: "Calls Made",
                  value: String(campaign.callsMade),
                  icon: Phone,
                },
                {
                  label: "Calls Answered",
                  value: String(campaign.callsAnswered),
                  icon: Phone,
                },
                { label: "Interested", value: interested, icon: Users },
                { label: "Qualified", value: qualified, icon: Users },
                {
                  label: "Created",
                  value: formatDate(campaign.createdAt),
                  icon: null,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border bg-muted/30 p-3"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {campaign.status === CampaignStatus.draft && (
                <Button
                  data-ocid="campaigns.detail.start.button"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onStatusChange(campaign.id, CampaignStatus.active);
                    onClose();
                  }}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" /> Start Campaign
                </Button>
              )}
              {campaign.status === CampaignStatus.active && (
                <Button
                  data-ocid="campaigns.detail.pause.button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onStatusChange(campaign.id, CampaignStatus.paused);
                    onClose();
                  }}
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
                </Button>
              )}
              {campaign.status === CampaignStatus.paused && (
                <Button
                  data-ocid="campaigns.detail.resume.button"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onStatusChange(campaign.id, CampaignStatus.active);
                    onClose();
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resume
                </Button>
              )}
              {(campaign.status === CampaignStatus.active ||
                campaign.status === CampaignStatus.paused) && (
                <Button
                  data-ocid="campaigns.detail.stop.button"
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  onClick={() => {
                    onStatusChange(campaign.id, CampaignStatus.stopped);
                    onClose();
                  }}
                >
                  <Square className="w-3.5 h-3.5 mr-1.5" /> Stop
                </Button>
              )}
              <Button
                data-ocid="campaigns.detail.delete_button"
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 ml-auto"
                onClick={() => {
                  onDelete(campaign.id);
                  onClose();
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>

            <Separator className="mb-4" />

            {/* Candidates list */}
            <div>
              <p className="text-sm font-semibold mb-3">
                Candidates ({campCandidates.length})
              </p>
              {campCandidates.length === 0 ? (
                <div
                  data-ocid="campaigns.detail.empty_state"
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Users className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No candidates in this campaign yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload candidates from the Candidates page.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-9">Name</TableHead>
                        <TableHead className="text-xs h-9">Phone</TableHead>
                        <TableHead className="text-xs h-9">Status</TableHead>
                        <TableHead className="text-xs h-9">Tag</TableHead>
                        <TableHead className="text-xs h-9 text-right">
                          Score
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campCandidates.map((cand, idx) => {
                        const rawStatus =
                          (cand.callStatus as string) ?? "pending";
                        const rawTag =
                          (cand.responseTag as string) ?? "untagged";
                        return (
                          <TableRow
                            key={cand.id}
                            data-ocid={`campaigns.detail.candidate.item.${idx + 1}`}
                          >
                            <TableCell className="text-xs py-2 font-medium">
                              {cand.name || "—"}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {cand.phone}
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <span className={callStatusColor(rawStatus)}>
                                {CALL_STATUS_LABELS[rawStatus] ?? rawStatus}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${tagColor(rawTag)}`}
                              >
                                {TAG_LABELS[rawTag] ?? rawTag}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs py-2 text-right font-bold">
                              {Number(cand.score) > 0
                                ? Number(cand.score)
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function CampaignsPage() {
  const { identity } = useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const {
    data: campaigns,
    isLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaigns();
  const { data: jobs } = useJobs();
  const { data: scriptTemplates } = useScriptTemplates();
  const { data: candidates } = useCandidates();
  const createCampaign = useCreateCampaign();
  const updateStatus = useUpdateCampaignStatus();
  const deleteCampaign = useDeleteCampaign();
  const bulkAdd = useBulkAddCandidates();

  const [open, setOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    jobId: "",
    scriptTemplateId: "",
    callSchedule: "",
  });

  // Upload state
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploadTab, setUploadTab] = useState("csv");
  const [gsheetUrl, setGsheetUrl] = useState("");
  const [gsheetLoading, setGsheetLoading] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const xlsxFileRef = useRef<HTMLInputElement>(null);

  function resetUploadState() {
    setParsedRows([]);
    setUploadTab("csv");
    setGsheetUrl("");
    setGsheetLoading(false);
    if (csvFileRef.current) csvFileRef.current.value = "";
    if (xlsxFileRef.current) xlsxFileRef.current.value = "";
  }

  function handleCSVFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSVText(text);
      setParsedRows(rows);
      toast.success(`${rows.length} candidates parsed`);
    };
    reader.readAsText(file);
  }

  async function handleExcelFile(file: File) {
    try {
      const XLSX = await loadXLSX();
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, string>>(
          sheet,
          { defval: "" },
        );
        const rows = parseSheetRows(jsonRows);
        setParsedRows(rows);
        toast.success(`${rows.length} candidates parsed`);
      };
      reader.readAsArrayBuffer(file);
    } catch {
      toast.error(
        "Failed to load Excel parser. Check your internet connection.",
      );
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "csv" | "excel",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "excel" || file.name.match(/\.xlsx?$/i)) {
      handleExcelFile(file);
    } else {
      handleCSVFile(file);
    }
  }

  async function handleLoadGSheet() {
    const match = gsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      toast.error("Invalid Google Sheets URL");
      return;
    }
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    setGsheetLoading(true);
    try {
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error("fetch failed");
      const text = await res.text();
      const rows = parseCSVText(text);
      setParsedRows(rows);
      toast.success(`${rows.length} candidates loaded from Google Sheet`);
    } catch {
      toast.error(
        "Could not load Google Sheet. Make sure it is shared publicly (Anyone with the link can view).",
      );
    } finally {
      setGsheetLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.jobId) {
      if (!jobs || jobs.length === 0) {
        toast.error("Please create a job first before creating a campaign");
      } else {
        toast.error("Campaign name and job required");
      }
      return;
    }
    const campaignId = newId();
    const campaign: Campaign = {
      id: campaignId,
      name: form.name,
      jobId: form.jobId,
      scriptTemplateId: form.scriptTemplateId,
      callSchedule: form.callSchedule
        ? BigInt(new Date(form.callSchedule).getTime()) * 1_000_000n
        : nowNs(),
      status: CampaignStatus.draft,
      callsMade: 0n,
      callsAnswered: 0n,
      totalCandidates: 0n,
      interested: 0n,
      qualified: 0n,
      createdAt: nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      await createCampaign.mutateAsync(campaign);

      if (parsedRows.length > 0) {
        const existingPhones = new Set(
          candidates?.map((c) => c.phone.replace(/\s/g, "")) ?? [],
        );
        const toAdd: Candidate[] = [];
        let duplicates = 0;
        for (const row of parsedRows) {
          const phone = row.phone.replace(/\s/g, "");
          if (existingPhones.has(phone)) {
            duplicates++;
            continue;
          }
          existingPhones.add(phone);
          toAdd.push({
            id: newId(),
            name: row.name,
            phone: row.phone,
            city: row.city,
            qualification: row.qualification,
            experience: BigInt(Number.parseInt(row.experience) || 0),
            jobId: form.jobId,
            campaignId,
            callStatus: CallStatus.pending,
            pipelineStage: PipelineStage.uploaded,
            responseTag: ResponseTag.untagged,
            score: 0n,
            callAttempts: 0n,
            notes: "",
            transcript: "",
            createdAt: nowNs(),
            owner: identity!.getPrincipal(),
          });
        }
        if (toAdd.length > 0) {
          await bulkAdd.mutateAsync(toAdd);
        }
        if (duplicates > 0) {
          toast.success(
            `Campaign created with ${toAdd.length} candidates. ${duplicates} duplicates skipped.`,
          );
        } else {
          toast.success(`Campaign created with ${toAdd.length} candidates.`);
        }
      } else {
        toast.success("Campaign created");
      }

      setOpen(false);
      setForm({ name: "", jobId: "", scriptTemplateId: "", callSchedule: "" });
      resetUploadState();
    } catch {
      toast.error("Failed to create campaign");
    }
  }

  async function handleStatus(id: string, status: CampaignStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(
        `Campaign ${CAMPAIGN_STATUS_MAP[status]?.label ?? "updated"}`,
      );
    } catch {
      toast.error("Failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const isSubmitting = createCampaign.isPending || bulkAdd.isPending;
  const isPageLoading = isLoading || isActorFetching || campaigns === undefined;

  return (
    <div className="p-6 space-y-4" data-ocid="campaigns.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            {campaigns?.length ?? 0} campaigns
          </p>
        </div>
        <Button
          data-ocid="campaigns.create_campaign.button"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {isPageLoading ? (
        <div className="space-y-3" data-ocid="campaigns.loading_state">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : campaignsError ? (
        <div
          data-ocid="campaigns.error_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <AlertTriangle className="w-12 h-12 text-destructive/60" />
          <p className="text-muted-foreground font-medium">
            Failed to load campaigns
          </p>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching your campaigns.
          </p>
          <Button
            data-ocid="campaigns.retry.button"
            variant="outline"
            size="sm"
            onClick={() => refetchCampaigns()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <div
          data-ocid="campaigns.empty_state"
          className="flex flex-col items-center justify-center py-20"
        >
          <Megaphone className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No campaigns yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(campaigns ?? []).map((camp, i) => {
            const job = jobs?.find((j) => j.id === camp.jobId);
            const campCandidates =
              candidates?.filter((c) => c.campaignId === camp.id) ?? [];
            const statusInfo = CAMPAIGN_STATUS_MAP[camp.status] ?? {
              label: String(camp.status),
              color: "",
            };
            return (
              <Card
                key={camp.id}
                data-ocid={`campaigns.campaign.item.${i + 1}`}
                className="border shadow-xs cursor-pointer hover:shadow-md hover:border-primary/30 hover:bg-muted/20 transition-all duration-150 group"
                onClick={(e) => {
                  // Prevent opening sheet when clicking action buttons
                  const target = e.target as HTMLElement;
                  if (target.closest("button")) return;
                  setSelectedCampaign(camp);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {camp.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {job && (
                        <p className="text-sm text-muted-foreground">
                          {job.companyName} &bull; {job.jobRole}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {String(camp.callsMade)} calls
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {campCandidates.length} candidates
                        </span>
                        <span className="text-muted-foreground">
                          {formatDate(camp.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {camp.status === CampaignStatus.draft && (
                        <Button
                          data-ocid={`campaigns.start.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatus(camp.id, CampaignStatus.active);
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      )}
                      {camp.status === CampaignStatus.active && (
                        <Button
                          data-ocid={`campaigns.pause.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatus(camp.id, CampaignStatus.paused);
                          }}
                        >
                          <Pause className="w-3 h-3 mr-1" /> Pause
                        </Button>
                      )}
                      {camp.status === CampaignStatus.paused && (
                        <Button
                          data-ocid={`campaigns.resume.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatus(camp.id, CampaignStatus.active);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Resume
                        </Button>
                      )}
                      {(camp.status === CampaignStatus.active ||
                        camp.status === CampaignStatus.paused) && (
                        <Button
                          data-ocid={`campaigns.stop.button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatus(camp.id, CampaignStatus.stopped);
                          }}
                        >
                          <Square className="w-3 h-3 mr-1" /> Stop
                        </Button>
                      )}
                      <Button
                        data-ocid={`campaigns.delete_button.${i + 1}`}
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(camp.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Campaign Detail Sheet */}
      <CampaignDetailSheet
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        jobs={(jobs ?? []) as any}
        candidates={candidates ?? []}
        onStatusChange={handleStatus}
        onDelete={handleDelete}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setForm({
              name: "",
              jobId: "",
              scriptTemplateId: "",
              callSchedule: "",
            });
            resetUploadState();
          }
        }}
      >
        <DialogContent
          data-ocid="campaigns.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Campaign Name *</Label>
              <Input
                data-ocid="campaigns.name.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="June IT Hiring"
              />
            </div>
            <div className="space-y-1">
              <Label>Linked Job *</Label>
              {jobs && jobs.length === 0 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  No jobs found. Please{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    create a job
                  </button>{" "}
                  first before creating a campaign.
                </div>
              ) : (
                <Select
                  value={form.jobId}
                  onValueChange={(v) => setForm((f) => ({ ...f, jobId: v }))}
                >
                  <SelectTrigger data-ocid="campaigns.job.select">
                    <SelectValue placeholder="Select job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs?.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.jobRole} — {j.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1">
              <Label>Calling Script (optional)</Label>
              <Select
                value={form.scriptTemplateId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, scriptTemplateId: v }))
                }
              >
                <SelectTrigger data-ocid="campaigns.script.select">
                  <SelectValue placeholder="Select script template..." />
                </SelectTrigger>
                <SelectContent>
                  {scriptTemplates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Call Schedule</Label>
              <Input
                data-ocid="campaigns.schedule.input"
                type="datetime-local"
                value={form.callSchedule}
                onChange={(e) =>
                  setForm((f) => ({ ...f, callSchedule: e.target.value }))
                }
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Candidate Upload Section */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">
                Upload Candidates (optional)
              </p>
              <p className="text-xs text-muted-foreground">
                Upload a candidate list now or add later from the Candidates
                page.
              </p>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={csvFileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e, "csv")}
            />
            <input
              ref={xlsxFileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e, "excel")}
            />

            <Tabs
              value={uploadTab}
              onValueChange={(v) => {
                setUploadTab(v);
                setParsedRows([]);
              }}
            >
              <TabsList
                data-ocid="campaigns.upload.tab"
                className="w-full grid grid-cols-3"
              >
                <TabsTrigger value="csv" className="text-xs">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  CSV / Excel
                </TabsTrigger>
                <TabsTrigger value="excel" className="text-xs">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  Excel File
                </TabsTrigger>
                <TabsTrigger value="gsheet" className="text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  Google Sheet
                </TabsTrigger>
              </TabsList>

              {/* CSV / Excel tab */}
              <TabsContent value="csv" className="mt-3">
                <button
                  type="button"
                  data-ocid="campaigns.upload.dropzone"
                  onClick={() => csvFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/60 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Click to upload CSV or Excel
                  </span>
                  <span className="text-xs text-muted-foreground">
                    .csv, .xlsx, .xls supported
                  </span>
                </button>
              </TabsContent>

              {/* Excel only tab */}
              <TabsContent value="excel" className="mt-3">
                <button
                  type="button"
                  data-ocid="campaigns.upload_excel.dropzone"
                  onClick={() => xlsxFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/60 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Click to upload Excel file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    .xlsx, .xls supported
                  </span>
                </button>
              </TabsContent>

              {/* Google Sheet tab */}
              <TabsContent value="gsheet" className="mt-3 space-y-3">
                <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    How to share your Google Sheet:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Open your Google Sheet</li>
                    <li>
                      Click <strong>Share</strong> →{" "}
                      <strong>Anyone with the link</strong>
                    </li>
                    <li>
                      Set permission to <strong>Viewer</strong>
                    </li>
                    <li>Copy the link and paste below</li>
                  </ol>
                </div>
                <div className="flex gap-2">
                  <Input
                    data-ocid="campaigns.gsheet_url.input"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={gsheetUrl}
                    onChange={(e) => setGsheetUrl(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    data-ocid="campaigns.gsheet_load.button"
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleLoadGSheet}
                    disabled={!gsheetUrl.trim() || gsheetLoading}
                    className="shrink-0"
                  >
                    {gsheetLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Load"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-green-600">
                  ✓ {parsedRows.length} candidates ready
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs h-8">Name</TableHead>
                        <TableHead className="text-xs h-8">Phone</TableHead>
                        <TableHead className="text-xs h-8">City</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 8).map((row) => (
                        <TableRow key={row.phone || row.name}>
                          <TableCell className="text-xs py-1.5">
                            {row.name || "—"}
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            {row.phone}
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            {row.city || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedRows.length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    +{parsedRows.length - 8} more rows
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              data-ocid="campaigns.cancel.button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="campaigns.save.button"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {parsedRows.length > 0
                ? `Create & Upload ${parsedRows.length} Candidates`
                : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
