export type {
  AiProvenance,
  AiTonePreset,
  AiTenantConfig,
  NextActionPatternId,
  NextActionUrgency,
  NextActionSuggestion,
  NextActionResult,
  ScoreBreakdown,
  LeadScoreExplanation,
  LeadSummary,
  DraftMessageInput,
  DraftMessageResult,
  ExtractedInsight,
  InsightExtractionResult,
} from './types';

export type {
  ReminderSuggestion,
  ReminderResult,
  ReminderChannel,
  ReminderUrgency,
  SnoozeOption,
} from './crm/reminder-engine';

export type {
  EscalationResult,
  EscalationLevel,
  EscalationTrigger,
  EscalationTriggerDetail,
} from './crm/escalation-engine';

export {
  getAiConfigForTenant,
  setAiConfigOverride,
  isAiServiceAvailable,
  getAiApiKey,
  getAiBaseUrl,
} from './config';

export { PROMPT_VERSIONS } from './prompts/crm-prompts';
