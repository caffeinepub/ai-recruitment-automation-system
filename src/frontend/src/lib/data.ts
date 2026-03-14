import {
  CallStatus,
  CampaignStatus,
  InterviewStatus,
  JobStatus,
  MessageType,
  PipelineStage,
  ResponseTag,
} from "../backend.d";

export function newId() {
  return crypto.randomUUID();
}

export function nowNs(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

export function fromNs(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

export function formatDate(ns: bigint) {
  return fromNs(ns).toLocaleDateString("en-IN");
}

export function formatDateTime(ns: bigint) {
  return fromNs(ns).toLocaleString("en-IN");
}

export const PIPELINE_STAGES: { value: PipelineStage; label: string }[] = [
  { value: PipelineStage.uploaded, label: "Uploaded" },
  { value: PipelineStage.callInitiated, label: "Call Initiated" },
  { value: PipelineStage.callAnswered, label: "Call Answered" },
  { value: PipelineStage.interested, label: "Interested" },
  { value: PipelineStage.screened, label: "Screened" },
  { value: PipelineStage.qualified, label: "Qualified" },
  { value: PipelineStage.interviewScheduled, label: "Interview Scheduled" },
  { value: PipelineStage.clientInterview, label: "Client Interview" },
  { value: PipelineStage.joined, label: "Joined" },
];

export const RESPONSE_TAGS: {
  value: ResponseTag;
  label: string;
  color: string;
}[] = [
  {
    value: ResponseTag.untagged,
    label: "Untagged",
    color: "bg-muted text-muted-foreground",
  },
  {
    value: ResponseTag.interested,
    label: "Interested",
    color: "bg-green-100 text-green-700",
  },
  {
    value: ResponseTag.notInterested,
    label: "Not Interested",
    color: "bg-red-100 text-red-700",
  },
  {
    value: ResponseTag.busy,
    label: "Busy",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: ResponseTag.callLater,
    label: "Call Later",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: ResponseTag.wrongNumber,
    label: "Wrong Number",
    color: "bg-gray-100 text-gray-600",
  },
];

export const CALL_STATUS_MAP: Record<
  CallStatus,
  { label: string; color: string }
> = {
  [CallStatus.pending]: {
    label: "Pending",
    color: "bg-muted text-muted-foreground",
  },
  [CallStatus.calling]: {
    label: "Calling",
    color: "bg-blue-100 text-blue-700",
  },
  [CallStatus.answered]: {
    label: "Answered",
    color: "bg-green-100 text-green-700",
  },
  [CallStatus.noAnswer]: {
    label: "No Answer",
    color: "bg-yellow-100 text-yellow-700",
  },
  [CallStatus.busy]: { label: "Busy", color: "bg-orange-100 text-orange-700" },
  [CallStatus.wrongNumber]: {
    label: "Wrong Number",
    color: "bg-red-100 text-red-700",
  },
};

export const CAMPAIGN_STATUS_MAP: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  [CampaignStatus.draft]: {
    label: "Draft",
    color: "bg-muted text-muted-foreground",
  },
  [CampaignStatus.active]: {
    label: "Active",
    color: "bg-green-100 text-green-700",
  },
  [CampaignStatus.paused]: {
    label: "Paused",
    color: "bg-yellow-100 text-yellow-700",
  },
  [CampaignStatus.completed]: {
    label: "Completed",
    color: "bg-blue-100 text-blue-700",
  },
  [CampaignStatus.stopped]: {
    label: "Stopped",
    color: "bg-red-100 text-red-700",
  },
};

export function scoreLabel(score: bigint): { label: string; color: string } {
  const n = Number(score);
  if (n > 7) return { label: "Qualified", color: "text-green-600" };
  if (n >= 4) return { label: "Follow-up", color: "text-yellow-600" };
  return { label: "Not Qualified", color: "text-red-500" };
}

export function generateCallingScript(
  companyName: string,
  jobRole: string,
  location: string,
  salary: string,
): string {
  return `Namaste! Main ${companyName} ki taraf se bol raha hu.\n\nHumein ${jobRole} ki position ke liye ek acha candidate chahiye, ${location} mein.\n\nSalary package ${salary} tak hai.\n\nKya aap is job opportunity mein interested hain?\n\n[Agar candidate YES kahe]:\nBahut achha! Main aapka kuch details lena chahta hu:\n1. Aapki qualification kya hai?\n2. Aap kaunse city mein rehte hain?\n3. Aap kab join kar sakte hain?\n4. Kya aapke paas relevant experience hai?\n\nThank you for your time!`;
}
