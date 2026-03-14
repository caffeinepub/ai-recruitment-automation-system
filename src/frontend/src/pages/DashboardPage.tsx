import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Heart,
  Megaphone,
  Phone,
  PhoneCall,
  Plus,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { PipelineStage } from "../backend.d";
import { useCampaigns, useCandidates, useJobs } from "../hooks/useBackend";
import { CAMPAIGN_STATUS_MAP, formatDate } from "../lib/data";

interface Props {
  setActiveSection: (id: string) => void;
}

const METRIC_KEYS = ["a", "b", "c", "d", "e", "f", "g"] as const;

export default function DashboardPage({ setActiveSection }: Props) {
  const { data: candidates, isLoading: loadC } = useCandidates();
  const { data: campaigns, isLoading: loadCamp } = useCampaigns();
  const { data: jobs } = useJobs();

  const totalCandidates = candidates?.length ?? 0;
  const callsMade =
    candidates?.filter((c) => c.callStatus !== "pending").length ?? 0;
  const callsAnswered =
    candidates?.filter((c) => c.callStatus === "answered").length ?? 0;
  const interested =
    candidates?.filter((c) => c.responseTag === "interested").length ?? 0;
  const qualified = candidates?.filter((c) => Number(c.score) > 7).length ?? 0;
  const interviewsScheduled =
    candidates?.filter(
      (c) =>
        c.pipelineStage === PipelineStage.interviewScheduled ||
        c.pipelineStage === PipelineStage.clientInterview,
    ).length ?? 0;
  const finalJoinings =
    candidates?.filter((c) => c.pipelineStage === PipelineStage.joined)
      .length ?? 0;

  const metrics = [
    {
      label: "Total Candidates",
      value: totalCandidates,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-l-blue-500",
    },
    {
      label: "Calls Made",
      value: callsMade,
      icon: Phone,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-l-indigo-500",
    },
    {
      label: "Calls Answered",
      value: callsAnswered,
      icon: PhoneCall,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-l-violet-500",
    },
    {
      label: "Interested",
      value: interested,
      icon: Heart,
      color: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-l-pink-500",
    },
    {
      label: "Qualified",
      value: qualified,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-l-amber-500",
    },
    {
      label: "Interviews",
      value: interviewsScheduled,
      icon: Calendar,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-l-teal-500",
    },
    {
      label: "Final Joinings",
      value: finalJoinings,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-l-green-500",
    },
  ];

  const isLoading = loadC || loadCamp;

  // Pipeline funnel stages
  const funnelStages = [
    { label: "Uploaded", count: totalCandidates, color: "bg-slate-400" },
    { label: "Called", count: callsMade, color: "bg-blue-400" },
    { label: "Answered", count: callsAnswered, color: "bg-indigo-400" },
    { label: "Interested", count: interested, color: "bg-purple-400" },
    { label: "Qualified", count: qualified, color: "bg-amber-500" },
    { label: "Joined", count: finalJoinings, color: "bg-green-500" },
  ];

  const quickActions = [
    {
      id: "jobs",
      icon: Briefcase,
      label: "Create Job",
      desc: "Add a new job opening with calling script",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: "campaigns",
      icon: Megaphone,
      label: "New Campaign",
      desc: "Launch an automated calling campaign",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      id: "candidates",
      icon: Upload,
      label: "Upload Candidates",
      desc: "Bulk upload candidates via CSV or Excel",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-ocid="dashboard.page">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your recruitment at a glance
        </p>
      </div>

      {/* Quick Action Bar */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        data-ocid="dashboard.quick_actions.section"
      >
        {quickActions.map((action) => (
          <Card
            key={action.id}
            data-ocid={`dashboard.${action.id}.card`}
            className="border-0 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => setActiveSection(action.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center shrink-0`}
              >
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {action.desc}
                </p>
              </div>
              <Button
                data-ocid={`dashboard.${action.id}.primary_button`}
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSection(action.id);
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Go
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map((m, idx) => (
          <Card
            key={METRIC_KEYS[idx]}
            data-ocid={`dashboard.metric.item.${idx + 1}`}
            className={`border-0 border-l-2 shadow-xs ${m.border}`}
          >
            <CardContent className="p-4">
              <div
                className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center mb-3`}
              >
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold">{m.value}</p>
              )}
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {m.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recruitment Funnel Pills */}
      <Card className="border-0 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recruitment Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-wrap gap-2 items-center"
            data-ocid="dashboard.funnel.section"
          >
            {funnelStages.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-muted/40 rounded-full px-3 py-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${stage.color} shrink-0`}
                  />
                  <span className="text-xs font-semibold">{stage.count}</span>
                  <span className="text-xs text-muted-foreground">
                    {stage.label}
                  </span>
                </div>
                {i < funnelStages.length - 1 && (
                  <span className="text-muted-foreground/40 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> Recent Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              ["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))
            ) : campaigns?.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="dashboard.campaigns.empty_state"
              >
                No campaigns yet
              </p>
            ) : (
              campaigns?.slice(0, 5).map((camp, i) => (
                <div
                  key={camp.id}
                  data-ocid={`dashboard.campaign.item.${i + 1}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">{camp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(camp.createdAt)}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${CAMPAIGN_STATUS_MAP[camp.status]?.color || ""}`}
                    variant="outline"
                  >
                    {CAMPAIGN_STATUS_MAP[camp.status]?.label}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!jobs ? (
              ["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))
            ) : jobs.filter((j) => j.status === "active").length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="dashboard.jobs.empty_state"
              >
                No active jobs
              </p>
            ) : (
              jobs
                .filter((j) => j.status === "active")
                .slice(0, 5)
                .map((job, i) => (
                  <div
                    key={job.id}
                    data-ocid={`dashboard.job.item.${i + 1}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{job.jobRole}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.companyName} &bull; {job.location}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {String(job.vacancies)} vacancies
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
