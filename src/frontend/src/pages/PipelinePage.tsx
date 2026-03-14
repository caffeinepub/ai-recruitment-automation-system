import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch } from "lucide-react";
import { toast } from "sonner";
import type { Candidate } from "../backend.d";
import type { PipelineStage } from "../backend.d";
import { useCandidates, useUpdateCandidate } from "../hooks/useBackend";
import { PIPELINE_STAGES, RESPONSE_TAGS, scoreLabel } from "../lib/data";

const STAGE_BORDER_COLORS: Record<string, string> = {
  uploaded: "border-t-slate-400",
  callInitiated: "border-t-blue-400",
  callAnswered: "border-t-indigo-400",
  interested: "border-t-purple-400",
  screened: "border-t-orange-400",
  qualified: "border-t-amber-500",
  interviewScheduled: "border-t-teal-400",
  clientInterview: "border-t-cyan-500",
  joined: "border-t-green-500",
};

function CandidateCard({
  candidate,
  onMove,
}: {
  candidate: Candidate;
  onMove: (c: Candidate, stage: PipelineStage) => void;
}) {
  const tag = RESPONSE_TAGS.find((t) => t.value === candidate.responseTag);
  const sl = scoreLabel(candidate.score);

  return (
    <div className="bg-card rounded-lg p-3 shadow-xs border border-border space-y-2">
      <p className="font-medium text-sm truncate">{candidate.name}</p>
      <p className="text-xs text-muted-foreground">{candidate.phone}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-xs ${tag?.color}`}>
          {tag?.label}
        </Badge>
        <span className={`text-xs font-bold ${sl.color}`}>
          {String(candidate.score)}/10
        </span>
      </div>
      <Select
        value={candidate.pipelineStage}
        onValueChange={(v) => onMove(candidate, v as PipelineStage)}
      >
        <SelectTrigger
          data-ocid="pipeline.stage_select.button"
          className="h-6 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE_STAGES.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function PipelinePage() {
  const { data: candidates, isLoading } = useCandidates();
  const updateCandidate = useUpdateCandidate();

  async function moveCandidate(candidate: Candidate, newStage: PipelineStage) {
    try {
      await updateCandidate.mutateAsync({
        ...candidate,
        pipelineStage: newStage,
      });
      toast.success(
        `Moved to ${PIPELINE_STAGES.find((s) => s.value === newStage)?.label}`,
      );
    } catch {
      toast.error("Failed to update");
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" data-ocid="pipeline.page">
      <div>
        <h1 className="text-2xl font-bold font-display">
          Recruitment Pipeline
        </h1>
        <p className="text-muted-foreground text-sm">
          Visual candidate journey across stages
        </p>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-4 kanban-scroll"
        data-ocid="pipeline.board"
      >
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = (candidates ?? []).filter(
            (c) => c.pipelineStage === stage.value,
          );
          const borderColor =
            STAGE_BORDER_COLORS[stage.value] ?? "border-t-border";
          return (
            <div
              key={stage.value}
              data-ocid={`pipeline.stage.${stage.value}.panel`}
              className={`flex-shrink-0 w-52 space-y-2 border-t-2 ${borderColor} rounded-t-sm pt-2`}
            >
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                  {stage.label}
                </p>
                <span className="text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {stageCandidates.length}
                </span>
              </div>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-2 pr-2">
                  {stageCandidates.length === 0 ? (
                    <div className="h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Empty</p>
                    </div>
                  ) : (
                    stageCandidates.map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        onMove={moveCandidate}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {(!candidates || candidates.length === 0) && (
        <div
          data-ocid="pipeline.empty_state"
          className="flex flex-col items-center justify-center py-20"
        >
          <GitBranch className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            No candidates in the pipeline yet
          </p>
        </div>
      )}
    </div>
  );
}
