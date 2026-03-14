import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Upload, UserCircle2, Users } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Campaign, Candidate, Job } from "../backend.d";
import { CallStatus, PipelineStage, ResponseTag } from "../backend.d";
import {
  useAddCandidate,
  useBulkAddCandidates,
  useCampaigns,
  useCandidates,
  useJobs,
  useUpdateCandidate,
} from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  CALL_STATUS_MAP,
  PIPELINE_STAGES,
  RESPONSE_TAGS,
  newId,
  nowNs,
  scoreLabel,
} from "../lib/data";
import { loadXLSX } from "../lib/xlsxLoader";

function CandidateProfile({
  candidate,
  jobs,
  campaigns,
  onSave,
}: {
  candidate: Candidate;
  jobs: Job[];
  campaigns: Campaign[];
  onSave: (c: Candidate) => void;
}) {
  const [c, setC] = useState(candidate);
  const [saving, setSaving] = useState(false);
  const job = jobs.find((j) => j.id === c.jobId);
  const campaign = campaigns.find((cp) => cp.id === c.campaignId);
  const sl = scoreLabel(c.score);
  const cs = CALL_STATUS_MAP[c.callStatus];
  const tag = RESPONSE_TAGS.find((t) => t.value === c.responseTag);

  async function save() {
    setSaving(true);
    await onSave(c);
    setSaving(false);
  }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Name</p>
          <p className="font-medium">{c.name}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Phone</p>
          <p className="font-medium">{c.phone}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">City</p>
          <p>{c.city}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Qualification</p>
          <p>{c.qualification}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Experience</p>
          <p>{String(c.experience)} yrs</p>
        </div>
        {job && (
          <div>
            <p className="text-muted-foreground text-xs">Job</p>
            <p>{job.jobRole}</p>
          </div>
        )}
        {campaign && (
          <div>
            <p className="text-muted-foreground text-xs">Campaign</p>
            <p>{campaign.name}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Call Status</p>
          <Badge variant="outline" className={`text-xs ${cs?.color}`}>
            {cs?.label}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Score</p>
          <span className={`font-bold text-lg ${sl.color}`}>
            {String(c.score)}/10
          </span>
          <span className={`text-xs ml-1 ${sl.color}`}>({sl.label})</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tag</p>
          <Badge variant="outline" className={`text-xs ${tag?.color}`}>
            {tag?.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Response Tag</Label>
        <Select
          value={c.responseTag}
          onValueChange={(v) =>
            setC((prev) => ({ ...prev, responseTag: v as ResponseTag }))
          }
        >
          <SelectTrigger
            data-ocid="candidate_profile.tag.select"
            className="h-8 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESPONSE_TAGS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Pipeline Stage</Label>
        <Select
          value={c.pipelineStage}
          onValueChange={(v) =>
            setC((prev) => ({ ...prev, pipelineStage: v as PipelineStage }))
          }
        >
          <SelectTrigger
            data-ocid="candidate_profile.stage.select"
            className="h-8 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {c.transcript && (
        <div className="space-y-1">
          <Label className="text-xs">AI Transcript</Label>
          <Textarea
            value={c.transcript}
            readOnly
            rows={4}
            className="text-xs bg-muted/40"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Recruiter Notes</Label>
        <Textarea
          data-ocid="candidate_profile.notes.textarea"
          value={c.notes}
          onChange={(e) => setC((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="Add notes..."
          className="text-sm"
        />
      </div>

      <Button
        data-ocid="candidate_profile.save.button"
        onClick={save}
        disabled={saving}
        size="sm"
        className="w-full"
      >
        {saving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />} Save
        Changes
      </Button>
    </div>
  );
}

export default function CandidatesPage() {
  const { identity } = useInternetIdentity();
  const { data: candidates, isLoading } = useCandidates();
  const { data: campaigns } = useCampaigns();
  const { data: jobs } = useJobs();
  const addCandidate = useAddCandidate();
  const bulkAdd = useBulkAddCandidates();
  const updateCandidate = useUpdateCandidate();

  const [addOpen, setAddOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(
    null,
  );
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [search, setSearch] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    city: "",
    qualification: "",
    experience: "",
    campaignId: "",
  });
  type CsvRow = {
    name: string;
    phone: string;
    city: string;
    qualification: string;
    experience: bigint;
    jobId: string;
    campaignId: string;
    interviewDate?: bigint;
    interviewLocation?: string;
    nextRetryAt?: bigint;
  };
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const results: CsvRow[] = [];
    let dups = 0;
    const existingPhones = new Set(candidates?.map((c) => c.phone) ?? []);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ?? "";
      });
      const phone = row.phone || row["phone number"] || "";
      if (existingPhones.has(phone)) {
        dups++;
        continue;
      }
      if (!phone) continue;
      existingPhones.add(phone);
      results.push({
        name: row.name || row["candidate name"] || "",
        phone,
        city: row.city || "",
        qualification: row.qualification || "",
        experience: row.experience
          ? BigInt(Math.round(Number.parseFloat(row.experience)))
          : 0n,
        jobId: "",
        campaignId: "",
      });
    }
    setDuplicates(dups);
    setCsvData(results);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    if (name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (ev) => parseCSV(ev.target?.result as string);
      reader.readAsText(file);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const arrayBuffer = ev.target?.result as ArrayBuffer;
          const XLSX = await loadXLSX();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonRows = XLSX.utils.sheet_to_json<Record<string, string>>(
            sheet,
            {
              defval: "",
              raw: false,
            },
          );

          const existingPhones = new Set(candidates?.map((c) => c.phone) ?? []);
          const results: CsvRow[] = [];
          let dups = 0;

          for (const row of jsonRows) {
            // Normalize keys to lowercase
            const normalized: Record<string, string> = {};
            for (const key of Object.keys(row)) {
              normalized[key.trim().toLowerCase()] = String(
                row[key] ?? "",
              ).trim();
            }

            const phone =
              normalized.phone ||
              normalized["phone number"] ||
              normalized.mobile ||
              normalized["mobile number"] ||
              "";

            if (!phone) continue;
            if (existingPhones.has(phone)) {
              dups++;
              continue;
            }
            existingPhones.add(phone);

            const expRaw =
              normalized.experience ||
              normalized.exp ||
              normalized["experience (years)"] ||
              "";

            results.push({
              name:
                normalized.name ||
                normalized["candidate name"] ||
                normalized["full name"] ||
                "",
              phone,
              city: normalized.city || normalized.location || "",
              qualification:
                normalized.qualification ||
                normalized.qual ||
                normalized.education ||
                "",
              experience: expRaw
                ? BigInt(Math.round(Number.parseFloat(expRaw)))
                : 0n,
              jobId: "",
              campaignId: "",
            });
          }

          setDuplicates(dups);
          setCsvData(results);

          if (results.length === 0 && dups === 0) {
            toast.error(
              "No valid candidates found. Ensure columns: name, phone, city, qualification, experience",
            );
          }
        } catch {
          toast.error("Failed to parse Excel file. Please check the format.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error(
        "Unsupported file type. Please upload a .csv, .xlsx, or .xls file.",
      );
    }

    // Reset input so the same file can be re-selected if needed
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleBulkUpload() {
    if (csvData.length === 0) {
      toast.error("No valid candidates to upload");
      return;
    }
    const toAdd: Candidate[] = csvData.map((d) => ({
      ...d,
      id: newId(),
      owner: identity!.getPrincipal(),
      createdAt: nowNs(),
      callStatus: CallStatus.pending,
      responseTag: ResponseTag.untagged,
      pipelineStage: PipelineStage.uploaded,
      score: 0n,
      callAttempts: 0n,
      notes: "",
      transcript: "",
    }));
    try {
      const dupCount = await bulkAdd.mutateAsync(toAdd);
      toast.success(
        `${toAdd.length} candidates uploaded. ${dupCount} duplicates skipped.`,
      );
      setUploadOpen(false);
      setCsvData([]);
    } catch {
      toast.error("Upload failed");
    }
  }

  async function handleAddManual() {
    if (!addForm.name || !addForm.phone) {
      toast.error("Name and phone required");
      return;
    }
    const c: Candidate = {
      id: newId(),
      name: addForm.name,
      phone: addForm.phone,
      city: addForm.city,
      qualification: addForm.qualification,
      experience: BigInt(addForm.experience || 0),
      campaignId: addForm.campaignId,
      jobId:
        campaigns?.find((camp) => camp.id === addForm.campaignId)?.jobId ?? "",
      callStatus: CallStatus.pending,
      responseTag: ResponseTag.untagged,
      pipelineStage: PipelineStage.uploaded,
      score: 0n,
      callAttempts: 0n,
      notes: "",
      transcript: "",
      createdAt: nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      await addCandidate.mutateAsync(c);
      toast.success("Candidate added");
      setAddOpen(false);
      setAddForm({
        name: "",
        phone: "",
        city: "",
        qualification: "",
        experience: "",
        campaignId: "",
      });
    } catch {
      toast.error("Failed");
    }
  }

  const filtered = (candidates ?? []).filter((c) => {
    if (filterCampaign !== "all" && c.campaignId !== filterCampaign)
      return false;
    if (filterTag !== "all" && c.responseTag !== filterTag) return false;
    if (filterStage !== "all" && c.pipelineStage !== filterStage) return false;
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.phone.includes(search)
    )
      return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4" data-ocid="candidates.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Candidates</h1>
          <p className="text-muted-foreground text-sm">
            {candidates?.length ?? 0} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="candidates.upload.button"
            variant="outline"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload CSV / Excel
          </Button>
          <Button
            data-ocid="candidates.add.button"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Candidate
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          data-ocid="candidates.search.input"
          placeholder="Search name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 h-8 text-sm"
        />
        <Select value={filterCampaign} onValueChange={setFilterCampaign}>
          <SelectTrigger
            className="w-40 h-8 text-sm"
            data-ocid="candidates.filter_campaign.select"
          >
            <SelectValue placeholder="Campaign" />
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
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger
            className="w-36 h-8 text-sm"
            data-ocid="candidates.filter_tag.select"
          >
            <SelectValue placeholder="Tag" />
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
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger
            className="w-44 h-8 text-sm"
            data-ocid="candidates.filter_stage.select"
          >
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {["a", "b", "c", "d", "e"].map((k) => (
            <div key={k} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="candidates.empty_state"
          className="flex flex-col items-center justify-center py-20"
        >
          <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No candidates found</p>
        </div>
      ) : (
        <div
          className="rounded-lg border bg-card overflow-auto"
          data-ocid="candidates.table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Qual.</TableHead>
                <TableHead>Exp.</TableHead>
                <TableHead>Call Status</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => {
                const cs = CALL_STATUS_MAP[c.callStatus];
                const rowTag = RESPONSE_TAGS.find(
                  (t) => t.value === c.responseTag,
                );
                const sl = scoreLabel(c.score);
                const stageName = PIPELINE_STAGES.find(
                  (s) => s.value === c.pipelineStage,
                )?.label;
                return (
                  <TableRow
                    key={c.id}
                    data-ocid={`candidates.row.item.${i + 1}`}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setProfileCandidate(c)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setProfileCandidate(c)
                    }
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.phone}
                    </TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell>{c.qualification}</TableCell>
                    <TableCell>{String(c.experience)}y</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${cs?.color}`}
                      >
                        {cs?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${rowTag?.color}`}
                      >
                        {rowTag?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${sl.color}`}>
                        {String(c.score)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {stageName}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={!!profileCandidate}
        onOpenChange={(o) => !o && setProfileCandidate(null)}
      >
        <SheetContent
          className="w-full sm:max-w-md overflow-y-auto"
          data-ocid="candidates.profile.sheet"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCircle2 className="w-5 h-5" />
              {profileCandidate?.name}
            </SheetTitle>
          </SheetHeader>
          {profileCandidate && (
            <CandidateProfile
              candidate={profileCandidate}
              jobs={jobs ?? []}
              campaigns={campaigns ?? []}
              onSave={async (updated) => {
                await updateCandidate.mutateAsync(updated);
                setProfileCandidate(updated);
                toast.success("Saved");
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="candidates.add.dialog">
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  data-ocid="candidates.add_name.input"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input
                  data-ocid="candidates.add_phone.input"
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  data-ocid="candidates.add_city.input"
                  value={addForm.city}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Experience (years)</Label>
                <Input
                  data-ocid="candidates.add_exp.input"
                  type="number"
                  value={addForm.experience}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, experience: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Qualification</Label>
              <Input
                data-ocid="candidates.add_qual.input"
                value={addForm.qualification}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, qualification: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Campaign</Label>
              <Select
                value={addForm.campaignId}
                onValueChange={(v) =>
                  setAddForm((f) => ({ ...f, campaignId: v }))
                }
              >
                <SelectTrigger data-ocid="candidates.add_campaign.select">
                  <SelectValue placeholder="Select campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="candidates.add_cancel.button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="candidates.add_submit.button"
              onClick={handleAddManual}
              disabled={addCandidate.isPending}
            >
              {addCandidate.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          className="max-w-lg"
          data-ocid="candidates.upload.dialog"
        >
          <DialogHeader>
            <DialogTitle>Upload Candidates (CSV / Excel)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              data-ocid="candidates.upload.dropzone"
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to select CSV or Excel file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported: .csv, .xlsx, .xls
              </p>
              <p className="text-xs text-muted-foreground">
                Columns: name, phone, city, qualification, experience
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>
            {csvData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">
                  {csvData.length} candidates ready
                </p>
                {duplicates > 0 && (
                  <p className="text-sm text-yellow-600">
                    {duplicates} duplicates will be skipped
                  </p>
                )}
                <div className="max-h-40 overflow-y-auto rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>City</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((d) => (
                        <TableRow key={d.phone}>
                          <TableCell className="text-xs">{d.name}</TableCell>
                          <TableCell className="text-xs">{d.phone}</TableCell>
                          <TableCell className="text-xs">{d.city}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="candidates.upload_cancel.button"
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                setCsvData([]);
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="candidates.upload_confirm.button"
              onClick={handleBulkUpload}
              disabled={bulkAdd.isPending || csvData.length === 0}
            >
              {bulkAdd.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Upload {csvData.length} Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
