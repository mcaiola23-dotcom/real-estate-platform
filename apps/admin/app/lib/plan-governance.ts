export interface PlanGovernanceRule {
  templateFeatures: string[];
  requiredFeatures: string[];
  allowedFeatures: string[];
}

export interface PlanGovernanceEvaluation {
  selectedFeatures: string[];
  templateFeatures: string[];
  requiredFeatures: string[];
  allowedFeatures: string[];
  missingRequired: string[];
  disallowed: string[];
  recommendedMissing: string[];
}

export const planFeatureTemplates: Record<string, string[]> = {
  starter: ['crm_pipeline', 'lead_capture'],
  growth: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences'],
  pro: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences', 'ai_nba', 'domain_ops'],
  team: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences', 'ai_nba', 'domain_ops'],
};

export const planGovernanceRules: Record<string, PlanGovernanceRule> = {
  starter: {
    templateFeatures: planFeatureTemplates.starter ?? [],
    requiredFeatures: ['crm_pipeline', 'lead_capture'],
    allowedFeatures: ['crm_pipeline', 'lead_capture'],
  },
  growth: {
    templateFeatures: planFeatureTemplates.growth ?? [],
    requiredFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence'],
    allowedFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences'],
  },
  pro: {
    templateFeatures: planFeatureTemplates.pro ?? [],
    requiredFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences'],
    allowedFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences', 'ai_nba', 'domain_ops'],
  },
  team: {
    templateFeatures: planFeatureTemplates.team ?? [],
    requiredFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences'],
    allowedFeatures: ['crm_pipeline', 'lead_capture', 'behavior_intelligence', 'automation_sequences', 'ai_nba', 'domain_ops'],
  },
};

function normalizeFeatureFlags(values: string[]): string[] {
  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  return Array.from(new Set(normalized));
}

export function evaluatePlanGovernance(planCode: string, featureFlags: string[]): PlanGovernanceEvaluation {
  const normalizedPlanCode = planCode.trim().toLowerCase();
  const selectedFeatures = normalizeFeatureFlags(featureFlags);
  const rule = planGovernanceRules[normalizedPlanCode];

  if (!rule) {
    return {
      selectedFeatures,
      templateFeatures: selectedFeatures,
      requiredFeatures: [],
      allowedFeatures: selectedFeatures,
      missingRequired: [],
      disallowed: [],
      recommendedMissing: [],
    };
  }

  const missingRequired = rule.requiredFeatures.filter((featureId) => !selectedFeatures.includes(featureId));
  const disallowed = selectedFeatures.filter((featureId) => !rule.allowedFeatures.includes(featureId));
  const recommendedMissing = rule.templateFeatures.filter((featureId) => !selectedFeatures.includes(featureId));

  return {
    selectedFeatures,
    templateFeatures: rule.templateFeatures,
    requiredFeatures: rule.requiredFeatures,
    allowedFeatures: rule.allowedFeatures,
    missingRequired,
    disallowed,
    recommendedMissing,
  };
}

export function enforcePlanGovernance(planCode: string, featureFlags: string[]): string[] {
  const normalizedPlanCode = planCode.trim().toLowerCase();
  const rule = planGovernanceRules[normalizedPlanCode];
  const selectedFeatures = normalizeFeatureFlags(featureFlags);

  if (!rule) {
    return selectedFeatures;
  }

  const allowedSelected = selectedFeatures.filter((featureId) => rule.allowedFeatures.includes(featureId));
  return normalizeFeatureFlags([...rule.requiredFeatures, ...allowedSelected]);
}
