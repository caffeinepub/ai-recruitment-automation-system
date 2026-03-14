import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types and Modules
  type JobStatus = { #active; #closed };
  type CampaignStatus = { #draft; #active; #paused; #completed; #stopped };
  type CallStatus = { #pending; #calling; #answered; #noAnswer; #busy; #wrongNumber };
  type ResponseTag = { #interested; #notInterested; #busy; #callLater; #wrongNumber; #untagged };
  type PipelineStage = {
    #uploaded;
    #callInitiated;
    #callAnswered;
    #interested;
    #screened;
    #qualified;
    #interviewScheduled;
    #clientInterview;
    #joined;
  };
  type MessageType = { #interview; #followup; #general };
  type InterviewStatus = { #scheduled; #confirmed; #completed; #cancelled };

  public type UserProfile = {
    name : Text;
  };

  type Job = {
    id : Text;
    owner : Principal;
    companyName : Text;
    jobRole : Text;
    location : Text;
    salary : Nat;
    qualification : Text;
    experience : Nat;
    vacancies : Nat;
    joiningDate : Time.Time;
    callingScript : Text;
    status : JobStatus;
    createdAt : Time.Time;
  };

  module Job {
    public func compareById(a : Job, b : Job) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type ScriptTemplate = {
    id : Text;
    owner : Principal;
    name : Text;
    content : Text;
    jobId : ?Text;
    createdAt : Time.Time;
  };

  module ScriptTemplate {
    public func compareById(a : ScriptTemplate, b : ScriptTemplate) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Campaign = {
    id : Text;
    owner : Principal;
    name : Text;
    jobId : Text;
    scriptTemplateId : Text;
    status : CampaignStatus;
    callSchedule : Time.Time;
    totalCandidates : Nat;
    callsMade : Nat;
    callsAnswered : Nat;
    interested : Nat;
    qualified : Nat;
    createdAt : Time.Time;
  };

  module Campaign {
    public func compareById(a : Campaign, b : Campaign) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Candidate = {
    id : Text;
    owner : Principal;
    name : Text;
    phone : Text;
    city : Text;
    qualification : Text;
    experience : Nat;
    campaignId : Text;
    jobId : Text;
    callStatus : CallStatus;
    responseTag : ResponseTag;
    score : Nat;
    pipelineStage : PipelineStage;
    callAttempts : Nat;
    nextRetryAt : ?Time.Time;
    transcript : Text;
    notes : Text;
    interviewDate : ?Time.Time;
    interviewLocation : ?Text;
    createdAt : Time.Time;
  };

  module Candidate {
    public func compareById(a : Candidate, b : Candidate) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type WhatsAppMessage = {
    id : Text;
    owner : Principal;
    candidateId : Text;
    templateId : Text;
    message : Text;
    sentAt : Time.Time;
    status : Text;
  };

  module WhatsAppMessage {
    public func compareById(a : WhatsAppMessage, b : WhatsAppMessage) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type MessageTemplate = {
    id : Text;
    owner : Principal;
    name : Text;
    content : Text;
    type_ : MessageType;
    createdAt : Time.Time;
  };

  module MessageTemplate {
    public func compareById(a : MessageTemplate, b : MessageTemplate) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Interview = {
    id : Text;
    owner : Principal;
    candidateId : Text;
    jobId : Text;
    companyName : Text;
    date : Time.Time;
    location : Text;
    status : InterviewStatus;
    whatsappSent : Bool;
    createdAt : Time.Time;
  };

  module Interview {
    public func compareById(a : Interview, b : Interview) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Settings = {
    exotel : Text;
    msg91 : Text;
    gupshup : Text;
    sarvamAI : Text;
  };

  let defaultSettings : Settings = {
    exotel = "";
    msg91 = "";
    gupshup = "";
    sarvamAI = "";
  };

  // Storage
  let jobs = Map.empty<Text, Job>();
  let scriptTemplates = Map.empty<Text, ScriptTemplate>();
  let campaigns = Map.empty<Text, Campaign>();
  let candidates = Map.empty<Text, Candidate>();
  let whatsappMessages = Map.empty<Text, WhatsAppMessage>();
  let messageTemplates = Map.empty<Text, MessageTemplate>();
  let interviews = Map.empty<Text, Interview>();
  let userSettings = Map.empty<Principal, Settings>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Job Operations
  public shared ({ caller }) func createJob(job : Job) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create jobs");
    };
    let jobWithOwner = {
      job with owner = caller;
    };
    jobs.add(job.id, jobWithOwner);
  };

  public shared ({ caller }) func updateJob(job : Job) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update jobs");
    };
    switch (jobs.get(job.id)) {
      case (null) { Runtime.trap("Job not found") };
      case (?existingJob) {
        if (existingJob.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own jobs");
        };
        let jobWithOwner = {
          job with owner = caller;
        };
        jobs.add(job.id, jobWithOwner);
      };
    };
  };

  public shared ({ caller }) func deleteJob(jobId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete jobs");
    };
    switch (jobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) {
        if (job.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own jobs");
        };
        jobs.remove(jobId);
      };
    };
  };

  public query ({ caller }) func listJobs() : async [Job] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list jobs");
    };
    jobs.values().toArray().filter(func(job : Job) : Bool { job.owner == caller }).sort(Job.compareById);
  };

  public query ({ caller }) func getJob(jobId : Text) : async Job {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get jobs");
    };
    switch (jobs.get(jobId)) {
      case (null) { Runtime.trap("Job not found") };
      case (?job) {
        if (job.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own jobs");
        };
        job;
      };
    };
  };

  // Script Template Operations
  public shared ({ caller }) func createScriptTemplate(template : ScriptTemplate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create templates");
    };
    let templateWithOwner = {
      template with owner = caller;
    };
    scriptTemplates.add(template.id, templateWithOwner);
  };

  public shared ({ caller }) func updateScriptTemplate(template : ScriptTemplate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update templates");
    };
    switch (scriptTemplates.get(template.id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?existingTemplate) {
        if (existingTemplate.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own templates");
        };
        let templateWithOwner = {
          template with owner = caller;
        };
        scriptTemplates.add(template.id, templateWithOwner);
      };
    };
  };

  public shared ({ caller }) func deleteScriptTemplate(templateId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete templates");
    };
    switch (scriptTemplates.get(templateId)) {
      case (null) { Runtime.trap("Template not found") };
      case (?template) {
        if (template.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own templates");
        };
        scriptTemplates.remove(templateId);
      };
    };
  };

  public query ({ caller }) func listScriptTemplates() : async [ScriptTemplate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list templates");
    };
    scriptTemplates.values().toArray().filter(func(template : ScriptTemplate) : Bool { template.owner == caller }).sort(ScriptTemplate.compareById);
  };

  public query ({ caller }) func getScriptTemplate(templateId : Text) : async ScriptTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get templates");
    };
    switch (scriptTemplates.get(templateId)) {
      case (null) { Runtime.trap("Template not found") };
      case (?template) {
        if (template.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own templates");
        };
        template;
      };
    };
  };

  // Campaign Operations
  public shared ({ caller }) func createCampaign(campaign : Campaign) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create campaigns");
    };
    let campaignWithOwner = {
      campaign with owner = caller;
    };
    campaigns.add(campaign.id, campaignWithOwner);
  };

  public shared ({ caller }) func updateCampaign(campaign : Campaign) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update campaigns");
    };
    switch (campaigns.get(campaign.id)) {
      case (null) { Runtime.trap("Campaign not found") };
      case (?existingCampaign) {
        if (existingCampaign.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own campaigns");
        };
        let campaignWithOwner = {
          campaign with owner = caller;
        };
        campaigns.add(campaign.id, campaignWithOwner);
      };
    };
  };

  public shared ({ caller }) func updateCampaignStatus(campaignId : Text, status : CampaignStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update campaign status");
    };
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign not found") };
      case (?campaign) {
        if (campaign.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own campaigns");
        };
        let updatedCampaign = {
          campaign with status;
        };
        campaigns.add(campaignId, updatedCampaign);
      };
    };
  };

  public shared ({ caller }) func deleteCampaign(campaignId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete campaigns");
    };
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign not found") };
      case (?campaign) {
        if (campaign.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own campaigns");
        };
        campaigns.remove(campaignId);
      };
    };
  };

  public query ({ caller }) func listCampaigns() : async [Campaign] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list campaigns");
    };
    campaigns.values().toArray().filter(func(campaign : Campaign) : Bool { campaign.owner == caller }).sort(Campaign.compareById);
  };

  public query ({ caller }) func getCampaign(campaignId : Text) : async Campaign {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get campaigns");
    };
    switch (campaigns.get(campaignId)) {
      case (null) { Runtime.trap("Campaign not found") };
      case (?campaign) {
        if (campaign.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own campaigns");
        };
        campaign;
      };
    };
  };

  // Candidate Operations
  public shared ({ caller }) func addCandidate(candidate : Candidate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add candidates");
    };
    let candidateWithOwner = {
      candidate with owner = caller;
    };
    candidates.add(candidate.id, candidateWithOwner);
  };

  public shared ({ caller }) func bulkAddCandidates(candidatesArray : [Candidate]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add candidates");
    };
    var duplicateCount = 0;
    for (candidate in candidatesArray.values()) {
      if (candidates.containsKey(candidate.id)) {
        duplicateCount += 1;
      } else {
        let candidateWithOwner = {
          candidate with owner = caller;
        };
        candidates.add(candidate.id, candidateWithOwner);
      };
    };
    duplicateCount;
  };

  public shared ({ caller }) func updateCandidate(candidate : Candidate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update candidates");
    };
    switch (candidates.get(candidate.id)) {
      case (null) { Runtime.trap("Candidate not found") };
      case (?existingCandidate) {
        if (existingCandidate.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own candidates");
        };
        let candidateWithOwner = {
          candidate with owner = caller;
        };
        candidates.add(candidate.id, candidateWithOwner);
      };
    };
  };

  public query ({ caller }) func listCandidates() : async [Candidate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list candidates");
    };
    candidates.values().toArray().filter(func(candidate : Candidate) : Bool { candidate.owner == caller }).sort(Candidate.compareById);
  };

  public query ({ caller }) func getCandidate(candidateId : Text) : async Candidate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get candidates");
    };
    switch (candidates.get(candidateId)) {
      case (null) { Runtime.trap("Candidate not found") };
      case (?candidate) {
        if (candidate.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own candidates");
        };
        candidate;
      };
    };
  };

  // WhatsApp Operations
  public shared ({ caller }) func sendWhatsAppMessage(message : WhatsAppMessage) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let messageWithOwner = {
      message with owner = caller;
    };
    whatsappMessages.add(message.id, messageWithOwner);
  };

  public shared ({ caller }) func sendBulkWhatsApp(messagesArray : [WhatsAppMessage]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    for (message in messagesArray.values()) {
      let messageWithOwner = {
        message with owner = caller;
      };
      whatsappMessages.add(message.id, messageWithOwner);
    };
  };

  public query ({ caller }) func listMessageHistory() : async [WhatsAppMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list messages");
    };
    whatsappMessages.values().toArray().filter(func(message : WhatsAppMessage) : Bool { message.owner == caller }).sort(WhatsAppMessage.compareById);
  };

  // Message Template Operations
  public shared ({ caller }) func createMessageTemplate(template : MessageTemplate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create message templates");
    };
    let templateWithOwner = {
      template with owner = caller;
    };
    messageTemplates.add(template.id, templateWithOwner);
  };

  public shared ({ caller }) func updateMessageTemplate(template : MessageTemplate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update message templates");
    };
    switch (messageTemplates.get(template.id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?existingTemplate) {
        if (existingTemplate.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own templates");
        };
        let templateWithOwner = {
          template with owner = caller;
        };
        messageTemplates.add(template.id, templateWithOwner);
      };
    };
  };

  public shared ({ caller }) func deleteMessageTemplate(templateId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete message templates");
    };
    switch (messageTemplates.get(templateId)) {
      case (null) { Runtime.trap("Template not found") };
      case (?template) {
        if (template.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own templates");
        };
        messageTemplates.remove(templateId);
      };
    };
  };

  public query ({ caller }) func listMessageTemplates() : async [MessageTemplate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list message templates");
    };
    messageTemplates.values().toArray().filter(func(template : MessageTemplate) : Bool { template.owner == caller }).sort(MessageTemplate.compareById);
  };

  public query ({ caller }) func getMessageTemplate(templateId : Text) : async MessageTemplate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get message templates");
    };
    switch (messageTemplates.get(templateId)) {
      case (null) { Runtime.trap("Template not found") };
      case (?template) {
        if (template.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own templates");
        };
        template;
      };
    };
  };

  // Interview Operations
  public shared ({ caller }) func scheduleInterview(interview : Interview) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can schedule interviews");
    };
    let interviewWithOwner = {
      interview with owner = caller;
    };
    interviews.add(interview.id, interviewWithOwner);
  };

  public shared ({ caller }) func updateInterview(interview : Interview) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update interviews");
    };
    switch (interviews.get(interview.id)) {
      case (null) { Runtime.trap("Interview not found") };
      case (?existingInterview) {
        if (existingInterview.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own interviews");
        };
        let interviewWithOwner = {
          interview with owner = caller;
        };
        interviews.add(interview.id, interviewWithOwner);
      };
    };
  };

  public shared ({ caller }) func cancelInterview(interviewId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel interviews");
    };
    switch (interviews.get(interviewId)) {
      case (null) { Runtime.trap("Interview not found") };
      case (?interview) {
        if (interview.owner != caller) {
          Runtime.trap("Unauthorized: Can only cancel your own interviews");
        };
        interviews.remove(interviewId);
      };
    };
  };

  public query ({ caller }) func listInterviews() : async [Interview] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list interviews");
    };
    interviews.values().toArray().filter(func(interview : Interview) : Bool { interview.owner == caller }).sort(Interview.compareById);
  };

  public query ({ caller }) func getInterview(interviewId : Text) : async Interview {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get interviews");
    };
    switch (interviews.get(interviewId)) {
      case (null) { Runtime.trap("Interview not found") };
      case (?interview) {
        if (interview.owner != caller) {
          Runtime.trap("Unauthorized: Can only access your own interviews");
        };
        interview;
      };
    };
  };

  // Settings Operations
  public shared ({ caller }) func saveSettings(newSettings : Settings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save settings");
    };
    userSettings.add(caller, newSettings);
  };

  // Returns default empty settings if none saved yet (no trap)
  public query ({ caller }) func getSettings() : async Settings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get settings");
    };
    switch (userSettings.get(caller)) {
      case (null) { defaultSettings };
      case (?s) { s };
    };
  };
};
