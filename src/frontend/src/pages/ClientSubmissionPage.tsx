import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Copy, Download, FileText, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCampaigns, useCandidates, useJobs } from "../hooks/useBackend";
import { PIPELINE_STAGES, scoreLabel } from "../lib/data";

export default function ClientSubmissionPage() {
  const { data: candidates = [] } = useCandidates();
  const { data: campaigns = [] } = useCampaigns();
  const { data: jobs = [] } = useJobs();

  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [scoreThreshold, setScoreThreshold] = useState(7);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (Number(c.score) < scoreThreshold) return false;
      if (selectedCampaign !== "all" && c.campaignId !== selectedCampaign)
        return false;
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q))
        return false;
      return true;
    });
  }, [candidates, selectedCampaign, scoreThreshold, search]);

  const avgScore = filtered.length
    ? (
        filtered.reduce((acc, c) => acc + Number(c.score), 0) / filtered.length
      ).toFixed(1)
    : "0.0";

  const topCity = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const c of filtered) freq[c.city] = (freq[c.city] || 0) + 1;
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [filtered]);

  const qualifiedCount = candidates.filter((c) => Number(c.score) > 7).length;

  function getJobName(jobId: string) {
    return jobs.find((j) => j.id === jobId)?.jobRole ?? jobId;
  }

  function getStageName(stage: string) {
    return PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage;
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Phone",
      "City",
      "Qualification",
      "Experience (yr)",
      "Score",
      "Tag",
      "Stage",
      "Job",
    ];
    const rows = filtered.map((c) => [
      c.name,
      c.phone,
      c.city,
      c.qualification,
      String(c.experience),
      String(c.score),
      c.responseTag,
      getStageName(c.pipelineStage),
      getJobName(c.jobId),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qualified-candidates.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Shareable link copied to clipboard!");
  }

  function exportPDF() {
    toast.info("PDF export coming soon");
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Client Submission</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Export and share qualified candidates with clients
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Qualified",
            value: qualifiedCount,
            icon: Award,
            color: "text-green-600",
          },
          {
            label: "Avg Score",
            value: avgScore,
            icon: FileText,
            color: "text-primary",
          },
          {
            label: "Top City",
            value: topCity,
            icon: MapPin,
            color: "text-orange-500",
          },
          {
            label: "To Submit",
            value: filtered.length,
            icon: Users,
            color: "text-blue-600",
          },
        ].map((s) => (
          <Card
            key={s.label}
            data-ocid={`submission.${s.label.toLowerCase().replace(/ /g, "-")}.card`}
          >
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

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <Label>Campaign</Label>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger
              className="w-44"
              data-ocid="submission.campaign.select"
            >
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
        </div>

        <div className="space-y-1.5 min-w-[180px]">
          <Label>
            Min Score: <strong>{scoreThreshold}</strong>
          </Label>
          <Slider
            min={0}
            max={10}
            step={1}
            value={[scoreThreshold]}
            onValueChange={([v]) => setScoreThreshold(v)}
            data-ocid="submission.score.toggle"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Search</Label>
          <Input
            className="w-56"
            placeholder="Name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="submission.search_input"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={exportPDF}
            data-ocid="submission.pdf.secondary_button"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={copyLink}
            data-ocid="submission.copy_link.secondary_button"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={exportCSV} data-ocid="submission.csv.primary_button">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Candidate Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Qualified Candidates ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="p-10 text-center text-muted-foreground"
              data-ocid="submission.candidates.empty_state"
            >
              No candidates meet the current score threshold.
            </div>
          ) : (
            <Table data-ocid="submission.candidates.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, i) => {
                  const sl = scoreLabel(c.score);
                  return (
                    <TableRow
                      key={c.id}
                      data-ocid={`submission.candidates.row.${i + 1}`}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone}
                      </TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>{c.qualification}</TableCell>
                      <TableCell>{Number(c.experience)} yr</TableCell>
                      <TableCell>
                        <span className={`font-bold ${sl.color}`}>
                          {Number(c.score)}{" "}
                          <span className="text-xs font-normal">
                            ({sl.label})
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {c.responseTag}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getStageName(c.pipelineStage)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
