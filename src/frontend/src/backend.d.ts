import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Candidate {
    id: string;
    callStatus: CallStatus;
    owner: Principal;
    city: string;
    name: string;
    createdAt: Time;
    jobId: string;
    campaignId: string;
    score: bigint;
    experience: bigint;
    interviewLocation?: string;
    pipelineStage: PipelineStage;
    responseTag: ResponseTag;
    callAttempts: bigint;
    interviewDate?: Time;
    notes: string;
    phone: string;
    nextRetryAt?: Time;
    transcript: string;
    qualification: string;
}
export type Time = bigint;
export interface ScriptTemplate {
    id: string;
    content: string;
    owner: Principal;
    name: string;
    createdAt: Time;
    jobId?: string;
}
export interface WhatsAppMessage {
    id: string;
    status: string;
    owner: Principal;
    templateId: string;
    sentAt: Time;
    message: string;
    candidateId: string;
}
export interface Settings {
    msg91: string;
    sarvamAI: string;
    gupshup: string;
    exotel: string;
}
export interface Job {
    id: string;
    status: JobStatus;
    salary: bigint;
    owner: Principal;
    jobRole: string;
    createdAt: Time;
    joiningDate: Time;
    vacancies: bigint;
    experience: bigint;
    companyName: string;
    callingScript: string;
    qualification: string;
    location: string;
}
export interface MessageTemplate {
    id: string;
    content: string;
    owner: Principal;
    name: string;
    createdAt: Time;
    type: MessageType;
}
export interface Interview {
    id: string;
    status: InterviewStatus;
    owner: Principal;
    date: Time;
    createdAt: Time;
    whatsappSent: boolean;
    jobId: string;
    companyName: string;
    candidateId: string;
    location: string;
}
export interface Campaign {
    id: string;
    status: CampaignStatus;
    owner: Principal;
    name: string;
    callsAnswered: bigint;
    createdAt: Time;
    jobId: string;
    callsMade: bigint;
    totalCandidates: bigint;
    scriptTemplateId: string;
    interested: bigint;
    qualified: bigint;
    callSchedule: Time;
}
export interface UserProfile {
    name: string;
}
export enum CallStatus {
    wrongNumber = "wrongNumber",
    pending = "pending",
    noAnswer = "noAnswer",
    busy = "busy",
    answered = "answered",
    calling = "calling"
}
export enum CampaignStatus {
    active = "active",
    stopped = "stopped",
    completed = "completed",
    draft = "draft",
    paused = "paused"
}
export enum InterviewStatus {
    scheduled = "scheduled",
    cancelled = "cancelled",
    completed = "completed",
    confirmed = "confirmed"
}
export enum JobStatus {
    closed = "closed",
    active = "active"
}
export enum MessageType {
    interview = "interview",
    followup = "followup",
    general = "general"
}
export enum PipelineStage {
    callInitiated = "callInitiated",
    callAnswered = "callAnswered",
    interviewScheduled = "interviewScheduled",
    joined = "joined",
    uploaded = "uploaded",
    clientInterview = "clientInterview",
    screened = "screened",
    interested = "interested",
    qualified = "qualified"
}
export enum ResponseTag {
    wrongNumber = "wrongNumber",
    busy = "busy",
    untagged = "untagged",
    notInterested = "notInterested",
    interested = "interested",
    callLater = "callLater"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCandidate(candidate: Candidate): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkAddCandidates(candidatesArray: Array<Candidate>): Promise<bigint>;
    cancelInterview(interviewId: string): Promise<void>;
    createCampaign(campaign: Campaign): Promise<void>;
    createJob(job: Job): Promise<void>;
    createMessageTemplate(template: MessageTemplate): Promise<void>;
    createScriptTemplate(template: ScriptTemplate): Promise<void>;
    deleteCampaign(campaignId: string): Promise<void>;
    deleteJob(jobId: string): Promise<void>;
    deleteMessageTemplate(templateId: string): Promise<void>;
    deleteScriptTemplate(templateId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCampaign(campaignId: string): Promise<Campaign>;
    getCandidate(candidateId: string): Promise<Candidate>;
    getInterview(interviewId: string): Promise<Interview>;
    getJob(jobId: string): Promise<Job>;
    getMessageTemplate(templateId: string): Promise<MessageTemplate>;
    getScriptTemplate(templateId: string): Promise<ScriptTemplate>;
    getSettings(): Promise<Settings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listCampaigns(): Promise<Array<Campaign>>;
    listCandidates(): Promise<Array<Candidate>>;
    listInterviews(): Promise<Array<Interview>>;
    listJobs(): Promise<Array<Job>>;
    listMessageHistory(): Promise<Array<WhatsAppMessage>>;
    listMessageTemplates(): Promise<Array<MessageTemplate>>;
    listScriptTemplates(): Promise<Array<ScriptTemplate>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveSettings(newSettings: Settings): Promise<void>;
    scheduleInterview(interview: Interview): Promise<void>;
    sendBulkWhatsApp(messagesArray: Array<WhatsAppMessage>): Promise<void>;
    sendWhatsAppMessage(message: WhatsAppMessage): Promise<void>;
    updateCampaign(campaign: Campaign): Promise<void>;
    updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void>;
    updateCandidate(candidate: Candidate): Promise<void>;
    updateInterview(interview: Interview): Promise<void>;
    updateJob(job: Job): Promise<void>;
    updateMessageTemplate(template: MessageTemplate): Promise<void>;
    updateScriptTemplate(template: ScriptTemplate): Promise<void>;
}
