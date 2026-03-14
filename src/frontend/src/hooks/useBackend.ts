import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Campaign,
  Candidate,
  Interview,
  Job,
  MessageTemplate,
  ScriptTemplate,
  Settings,
} from "../backend.d";
import type { CampaignStatus } from "../backend.d";
import { useActor } from "./useActor";

export function useJobs() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["jobs"],
    queryFn: () => actor!.listJobs(),
    enabled: !!actor,
  });
}

export function useCampaigns() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: () => actor!.listCampaigns(),
    enabled: !!actor,
  });
}

export function useCandidates() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["candidates"],
    queryFn: () => actor!.listCandidates(),
    enabled: !!actor,
  });
}

export function useScriptTemplates() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["scriptTemplates"],
    queryFn: () => actor!.listScriptTemplates(),
    enabled: !!actor,
  });
}

export function useMessageTemplates() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["messageTemplates"],
    queryFn: () => actor!.listMessageTemplates(),
    enabled: !!actor,
  });
}

export function useInterviews() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["interviews"],
    queryFn: () => actor!.listInterviews(),
    enabled: !!actor,
  });
}

export function useSettings() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => actor!.getSettings(),
    enabled: !!actor,
  });
}

export function useCreateJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job: Job) => actor!.createJob(job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useUpdateJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job: Job) => actor!.updateJob(job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useDeleteJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useCreateCampaign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Campaign) => actor!.createCampaign(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaignStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      actor!.updateCampaignStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useAddCandidate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Candidate) => actor!.addCandidate(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useBulkAddCandidates() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cs: Candidate[]) => actor!.bulkAddCandidates(cs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useUpdateCandidate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Candidate) => actor!.updateCandidate(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
  });
}

export function useCreateScriptTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: ScriptTemplate) => actor!.createScriptTemplate(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scriptTemplates"] }),
  });
}

export function useUpdateScriptTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: ScriptTemplate) => actor!.updateScriptTemplate(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scriptTemplates"] }),
  });
}

export function useDeleteScriptTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteScriptTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scriptTemplates"] }),
  });
}

export function useCreateMessageTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: MessageTemplate) => actor!.createMessageTemplate(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messageTemplates"] }),
  });
}

export function useUpdateMessageTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: MessageTemplate) => actor!.updateMessageTemplate(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messageTemplates"] }),
  });
}

export function useDeleteMessageTemplate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actor!.deleteMessageTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messageTemplates"] }),
  });
}

export function useScheduleInterview() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: Interview) => actor!.scheduleInterview(i),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}

export function useUpdateInterview() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (i: Interview) => actor!.updateInterview(i),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interviews"] }),
  });
}

export function useSaveSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Settings) => actor!.saveSettings(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
