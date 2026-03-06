import "server-only";

import type {
  ListingsProviderAction,
  ListingsProviderActionPayloadMap,
  ListingsProviderActionResultMap,
} from "./listings.types";

const DEFAULT_TIMEOUT_MS = 8_000;

interface IdxBridgeConfig {
  baseUrl: string;
  token: string;
  timeoutMs: number;
}

function parseTimeoutMs(value: string | undefined): number {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return parsed;
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveIdxBridgeConfig(): IdxBridgeConfig | null {
  const baseUrl = normalizeBaseUrl(process.env.IDX_BRIDGE_URL);
  const token = process.env.IDX_BRIDGE_TOKEN?.trim(); // secret-scan:allow

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl,
    token,
    timeoutMs: parseTimeoutMs(process.env.IDX_BRIDGE_TIMEOUT_MS),
  };
}

export function getIdxBridgeConfigError(): string | null {
  const baseUrl = normalizeBaseUrl(process.env.IDX_BRIDGE_URL);
  const token = process.env.IDX_BRIDGE_TOKEN?.trim(); // secret-scan:allow

  if (!baseUrl && !token) {
    return "IDX bridge is not configured (missing IDX_BRIDGE_URL and IDX_BRIDGE_TOKEN).";
  }

  if (!baseUrl) {
    return "IDX bridge is not configured (missing/invalid IDX_BRIDGE_URL).";
  }

  if (!token) {
    return "IDX bridge is not configured (missing IDX_BRIDGE_TOKEN).";
  }

  return null;
}

export function isIdxBridgeConfigured(): boolean {
  return resolveIdxBridgeConfig() !== null;
}

type IdxBridgeEnvelope<T> = {
  ok?: boolean;
  error?: string;
  data?: T;
};

function isEnvelopeWithData<T>(value: unknown): value is IdxBridgeEnvelope<T> {
  return Boolean(value) && typeof value === "object" && "data" in (value as Record<string, unknown>);
}

export async function callIdxBridge<Action extends ListingsProviderAction>(
  action: Action,
  payload: ListingsProviderActionPayloadMap[Action]
): Promise<ListingsProviderActionResultMap[Action]> {
  const config = resolveIdxBridgeConfig();
  if (!config) {
    const configError = getIdxBridgeConfigError();
    throw new Error(configError ?? "IDX bridge is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
        "x-idx-bridge-action": action,
      },
      body: JSON.stringify({ action, payload }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      const message = responseText || `IDX bridge request failed (${response.status}).`;
      throw new Error(message);
    }

    const responseJson = (await response.json()) as unknown;

    if (isEnvelopeWithData<ListingsProviderActionResultMap[Action]>(responseJson)) {
      if (responseJson.ok === false) {
        throw new Error(responseJson.error || "IDX bridge returned an unsuccessful response.");
      }
      return responseJson.data as ListingsProviderActionResultMap[Action];
    }

    return responseJson as ListingsProviderActionResultMap[Action];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`IDX bridge request timed out after ${config.timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
