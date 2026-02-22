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

export {
  getAiConfigForTenant,
  setAiConfigOverride,
  isAiServiceAvailable,
  getAiApiKey,
  getAiBaseUrl,
} from './config';

export { PROMPT_VERSIONS } from './prompts/crm-prompts';
