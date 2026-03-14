import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PipelineStage } from "../backend.d";
import { useCampaigns, useCandidates, useJobs } from "../hooks/useBackend";
import { CAMPAIGN_STATUS_MAP } from "../lib/data";

function pct(num: number, den: number) {
  if (den === 0) return "0%";
  return `${Math.round((num / den) * 100)}%`;
}

export default function AnalyticsPage() {
  const { data: campaigns } = useCampaigns();
  const { data: candidates } = useCandidates();
  const { data: jobs } = useJobs();
  const [selectedCampaign, setSelectedCampaign] = useState("all");

  const filtered =
    selectedCampaign === "all"
      ? (candidates ?? [])
      : (candidates ?? []).filter((c) => c.campaignId === selectedCampaign);

  const total = filtered.length;
  const called = filtered.filter((c) => c.callStatus !== "pending").length;
  const answered = filtered.filter((c) => c.callStatus === "answered").length;
  const interested = filtered.filter(
    (c) => c.responseTag === "interested",
  ).length;
  const qualified = filtered.filter((c) => Number(c.score) > 7).length;
  const interviews = filtered.filter(
    (c) =>
      c.pipelineStage === PipelineStage.interviewScheduled ||
      c.pipelineStage === PipelineStage.clientInterview,
  ).length;
  const joined = filtered.filter(
    (c) => c.pipelineStage === PipelineStage.joined,
  ).length;
  const successRate = total > 0 ? ((joined / total) * 100).toFixed(1) : "0.0";

  const funnelData = [
    { name: "Total", value: total },
    { name: "Called", value: called },
    { name: "Answered", value: answered },
    { name: "Interested", value: interested },
    { name: "Qualified", value: qualified },
    { name: "Interviews", value: interviews },
    { name: "Joined", value: joined },
  ];

  const kpis = [
    { label: "Total Candidates", value: String(total) },
    {
      label: "Calls Answered",
      value: `${answered} (${total > 0 ? Math.round((answered / total) * 100) : 0}%)`,
    },
    { label: "Qualified", value: String(qualified) },
    { label: "Hiring Success Rate", value: `${successRate}%`, highlight: true },
  ];

  const conversionRates = [
    { label: "Call Rate", value: pct(called, total), desc: "called / total" },
    {
      label: "Answer Rate",
      value: pct(answered, called),
      desc: "answered / called",
    },
    {
      label: "Interest Rate",
      value: pct(interested, answered),
      desc: "interested / answered",
    },
    {
      label: "Qualification Rate",
      value: pct(qualified, interested),
      desc: "qualified / interested",
    },
    {
      label: "Success Rate",
      value: pct(joined, total),
      desc: "joined / total",
      highlight: true,
    },
  ];

  return (
    <div className="p-6 space-y-6" data-ocid="analytics.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Campaign performance insights
          </p>
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-52" data-ocid="analytics.campaign.select">
            <SelectValue placeholder="All Campaigns" />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <Card
            key={kpi.label}
            data-ocid={`analytics.kpi.item.${idx + 1}`}
            className="border-0 shadow-xs"
          >
            <CardContent className="p-4">
              <p
                className={`text-2xl font-bold ${kpi.highlight ? "text-primary" : ""}`}
              >
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kpi.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recruitment Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="oklch(0.46 0.22 264)"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: 11, fill: "#666" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!campaigns?.length ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No campaigns
              </p>
            ) : (
              campaigns.map((camp) => {
                const campCands = (candidates ?? []).filter(
                  (c) => c.campaignId === camp.id,
                );
                const campAnswered = campCands.filter(
                  (c) => c.callStatus === "answered",
                ).length;
                const campQual = campCands.filter(
                  (c) => Number(c.score) > 7,
                ).length;
                const statusInfo = CAMPAIGN_STATUS_MAP[camp.status];
                const job = jobs?.find((j) => j.id === camp.jobId);
                return (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {camp.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${statusInfo?.color}`}
                        >
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      {job && (
                        <p className="text-xs text-muted-foreground">
                          {job.jobRole}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs space-y-0.5 ml-4 shrink-0">
                      <p>
                        <span className="font-medium">{campCands.length}</span>{" "}
                        total
                      </p>
                      <p>
                        <span className="font-medium">{campAnswered}</span>{" "}
                        answered
                      </p>
                      <p>
                        <span className="font-medium text-green-600">
                          {campQual}
                        </span>{" "}
                        qualified
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <Card
        className="border-0 shadow-xs"
        data-ocid="analytics.conversion_rates.card"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {conversionRates.map((cr) => (
              <div
                key={cr.label}
                className="bg-muted/40 rounded-lg p-3 text-center space-y-1"
              >
                <p
                  className={`text-xl font-bold ${cr.highlight ? "text-primary" : ""}`}
                >
                  {cr.value}
                </p>
                <p className="text-xs font-medium">{cr.label}</p>
                <p className="text-[10px] text-muted-foreground">{cr.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
