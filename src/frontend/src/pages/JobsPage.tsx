import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Building2,
  DollarSign,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Job } from "../backend.d";
import { JobStatus } from "../backend.d";
import {
  useCreateJob,
  useDeleteJob,
  useJobs,
  useUpdateJob,
} from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatDate, generateCallingScript, newId, nowNs } from "../lib/data";

const EMPTY_FORM = {
  companyName: "",
  jobRole: "",
  location: "",
  salary: "",
  qualification: "",
  experience: "",
  vacancies: "",
  joiningDate: "",
  callingScript: "",
};

export default function JobsPage() {
  const { identity } = useInternetIdentity();
  const { data: jobs, isLoading, isError } = useJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(job: Job) {
    setEditing(job);
    setForm({
      companyName: job.companyName,
      jobRole: job.jobRole,
      location: job.location,
      salary: String(job.salary),
      qualification: job.qualification,
      experience: String(job.experience),
      vacancies: String(job.vacancies),
      joiningDate: new Date(Number(job.joiningDate / 1_000_000n))
        .toISOString()
        .split("T")[0],
      callingScript: job.callingScript,
    });
    setOpen(true);
  }

  function generateScript() {
    const script = generateCallingScript(
      form.companyName || "[Company]",
      form.jobRole || "[Role]",
      form.location || "[Location]",
      form.salary ? `₹${form.salary}` : "[Salary]",
    );
    setForm((f) => ({ ...f, callingScript: script }));
  }

  async function handleSubmit() {
    if (!form.companyName || !form.jobRole || !form.location) {
      toast.error(
        "Please fill required fields: Company Name, Job Role, Location",
      );
      return;
    }
    const joiningTs = form.joiningDate
      ? BigInt(new Date(form.joiningDate).getTime()) * 1_000_000n
      : nowNs();
    const job: Job = {
      id: editing?.id ?? newId(),
      companyName: form.companyName,
      jobRole: form.jobRole,
      location: form.location,
      salary: BigInt(form.salary || 0),
      qualification: form.qualification,
      experience: BigInt(form.experience || 0),
      vacancies: BigInt(form.vacancies || 1),
      joiningDate: joiningTs,
      callingScript: form.callingScript,
      status: editing?.status ?? JobStatus.active,
      createdAt: editing?.createdAt ?? nowNs(),
      owner: identity!.getPrincipal(),
    };
    try {
      if (editing) {
        await updateJob.mutateAsync(job);
        toast.success("Job updated successfully");
      } else {
        await createJob.mutateAsync(job);
        toast.success(
          "Job created! Next step: Create a campaign to start calling.",
        );
      }
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to save job: ${msg}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    try {
      await deleteJob.mutateAsync(id);
      toast.success("Job deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to delete: ${msg}`);
    }
  }

  async function toggleStatus(job: Job) {
    const newStatus =
      job.status === JobStatus.active ? JobStatus.closed : JobStatus.active;
    const updated = { ...job, status: newStatus };
    try {
      await updateJob.mutateAsync(updated);
      toast.success(
        `Job marked as ${newStatus === JobStatus.active ? "Active" : "Closed"}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to update status: ${msg}`);
    }
  }

  const isPending = createJob.isPending || updateJob.isPending;

  function renderContent() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div
          data-ocid="jobs.error_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <AlertCircle className="w-12 h-12 text-destructive/40 mb-4" />
          <p className="text-muted-foreground font-medium">
            Failed to load jobs
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Please refresh the page or try again.
          </p>
        </div>
      );
    }

    if (!jobs || jobs.length === 0) {
      return (
        <div
          data-ocid="jobs.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Building2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">No jobs yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first job to get started.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Job
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job, i) => (
          <Card
            key={job.id}
            data-ocid={`jobs.job.item.${i + 1}`}
            className="border-0 shadow-xs hover:shadow-sm transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{job.jobRole}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.companyName}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs cursor-pointer select-none ${
                    job.status === JobStatus.active
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() => toggleStatus(job)}
                >
                  {job.status === JobStatus.active ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {/* Salary prominent */}
              {Number(job.salary) > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="font-semibold text-green-700">
                    ₹{Number(job.salary).toLocaleString("en-IN")}/mo
                  </span>
                  <span className="text-muted-foreground text-xs">
                    &bull; {String(job.vacancies)} vacanc
                    {Number(job.vacancies) === 1 ? "y" : "ies"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
              {job.qualification && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="w-3 h-3 shrink-0" />
                  <span className="truncate">{job.qualification}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Joining: {formatDate(job.joiningDate)}
              </div>
              {/* Script preview badge */}
              {job.callingScript && (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <FileText className="w-2.5 h-2.5 mr-1" /> Script Ready
                  </Badge>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  data-ocid={`jobs.edit.button.${i + 1}`}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(job)}
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button
                  data-ocid={`jobs.delete_button.${i + 1}`}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" data-ocid="jobs.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Jobs</h1>
          <p className="text-muted-foreground text-sm">
            {jobs?.length ?? 0} total jobs
          </p>
        </div>
        <Button data-ocid="jobs.create_job.button" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Create Job
        </Button>
      </div>

      {renderContent()}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="jobs.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Job" : "Create Job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="jobs.company_name.input"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                  placeholder="Infosys"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Job Role <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="jobs.job_role.input"
                  value={form.jobRole}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jobRole: e.target.value }))
                  }
                  placeholder="Software Engineer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  data-ocid="jobs.location.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Bengaluru"
                />
              </div>
              <div className="space-y-1">
                <Label>Salary (₹/month)</Label>
                <Input
                  data-ocid="jobs.salary.input"
                  type="number"
                  min="0"
                  value={form.salary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, salary: e.target.value }))
                  }
                  placeholder="25000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Qualification</Label>
                <Input
                  data-ocid="jobs.qualification.input"
                  value={form.qualification}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, qualification: e.target.value }))
                  }
                  placeholder="B.Tech / Graduate"
                />
              </div>
              <div className="space-y-1">
                <Label>Experience (years)</Label>
                <Input
                  data-ocid="jobs.experience.input"
                  type="number"
                  min="0"
                  value={form.experience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, experience: e.target.value }))
                  }
                  placeholder="2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Vacancies</Label>
                <Input
                  data-ocid="jobs.vacancies.input"
                  type="number"
                  min="1"
                  value={form.vacancies}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vacancies: e.target.value }))
                  }
                  placeholder="5"
                />
              </div>
              <div className="space-y-1">
                <Label>Joining Date</Label>
                <Input
                  data-ocid="jobs.joining_date.input"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, joiningDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Calling Script</Label>
                <Button
                  data-ocid="jobs.generate_script.button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateScript}
                >
                  <Wand2 className="w-3 h-3 mr-1" /> Generate
                </Button>
              </div>
              <Textarea
                data-ocid="jobs.calling_script.textarea"
                value={form.callingScript}
                onChange={(e) =>
                  setForm((f) => ({ ...f, callingScript: e.target.value }))
                }
                rows={6}
                placeholder="Enter or generate AI calling script..."
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="jobs.cancel.button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              data-ocid="jobs.save.button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
