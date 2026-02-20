import { resolve4, resolve6, resolveCname } from 'node:dns/promises';
import tls from 'node:tls';

import type { TenantDomainProbeResult } from '@real-estate/types/control-plane';
import type { TenantDomain } from '@real-estate/types/tenant';

const DNS_TIMEOUT_MS = 3500;
const TLS_TIMEOUT_MS = 5000;

interface DnsProbeOutcome {
  status: TenantDomainProbeResult['dnsStatus'];
  message: string;
  observedRecords: string[];
}

interface CertificateProbeOutcome {
  status: TenantDomainProbeResult['certificateStatus'];
  message: string;
  validTo: string | null;
}

type ProbeTenantDomainInput = Pick<TenantDomain, 'id' | 'hostname' | 'isPrimary' | 'isVerified'>;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'unknown probe failure';
}

function isLocalhostDomain(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost');
}

function parseCertificateDateToIso(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function probeDns(hostname: string): Promise<DnsProbeOutcome> {
  const lookups = await Promise.allSettled([
    withTimeout(resolve4(hostname), DNS_TIMEOUT_MS, 'A lookup'),
    withTimeout(resolve6(hostname), DNS_TIMEOUT_MS, 'AAAA lookup'),
    withTimeout(resolveCname(hostname), DNS_TIMEOUT_MS, 'CNAME lookup'),
  ]);

  const observedRecords: string[] = [];
  const errorCodes: string[] = [];
  const errorMessages: string[] = [];

  const aResult = lookups[0];
  if (aResult?.status === 'fulfilled') {
    observedRecords.push(...aResult.value.map((value) => `A ${value}`));
  } else if (aResult?.status === 'rejected') {
    const code = getErrorCode(aResult.reason);
    if (code) {
      errorCodes.push(code);
    }
    errorMessages.push(getErrorMessage(aResult.reason));
  }

  const aaaaResult = lookups[1];
  if (aaaaResult?.status === 'fulfilled') {
    observedRecords.push(...aaaaResult.value.map((value) => `AAAA ${value}`));
  } else if (aaaaResult?.status === 'rejected') {
    const code = getErrorCode(aaaaResult.reason);
    if (code) {
      errorCodes.push(code);
    }
    errorMessages.push(getErrorMessage(aaaaResult.reason));
  }

  const cnameResult = lookups[2];
  if (cnameResult?.status === 'fulfilled') {
    observedRecords.push(...cnameResult.value.map((value) => `CNAME ${value}`));
  } else if (cnameResult?.status === 'rejected') {
    const code = getErrorCode(cnameResult.reason);
    if (code) {
      errorCodes.push(code);
    }
    errorMessages.push(getErrorMessage(cnameResult.reason));
  }

  if (observedRecords.length > 0) {
    return {
      status: 'verified',
      message: `Detected ${observedRecords.length} DNS record(s) for ${hostname}.`,
      observedRecords,
    };
  }

  const hasMissingSignal = errorCodes.some((code) => code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ENODOMAIN');
  if (hasMissingSignal) {
    return {
      status: 'missing',
      message: `No DNS records found yet for ${hostname}.`,
      observedRecords: [],
    };
  }

  return {
    status: 'pending',
    message: `DNS probe did not return records yet (${errorMessages[0] ?? 'pending'}).`,
    observedRecords: [],
  };
}

function probeCertificate(hostname: string): Promise<CertificateProbeOutcome> {
  return new Promise((resolve) => {
    let finished = false;
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: TLS_TIMEOUT_MS,
    });

    const finalize = (result: CertificateProbeOutcome) => {
      if (finished) {
        return;
      }
      finished = true;
      if (!socket.destroyed) {
        socket.destroy();
      }
      resolve(result);
    };

    socket.once('secureConnect', () => {
      const certificate = socket.getPeerCertificate();
      if (!certificate || Object.keys(certificate).length === 0) {
        finalize({
          status: 'pending',
          message: `TLS endpoint for ${hostname} did not present a certificate yet.`,
          validTo: null,
        });
        return;
      }

      const validToIso = parseCertificateDateToIso(certificate.valid_to || null);
      if (!validToIso) {
        finalize({
          status: 'pending',
          message: `Certificate detected for ${hostname}, but expiration could not be determined.`,
          validTo: null,
        });
        return;
      }

      const expiresAt = new Date(validToIso);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        finalize({
          status: 'pending',
          message: `Certificate for ${hostname} is present but expired (${validToIso}).`,
          validTo: validToIso,
        });
        return;
      }

      finalize({
        status: 'ready',
        message: `Certificate is valid through ${validToIso}.`,
        validTo: validToIso,
      });
    });

    socket.once('timeout', () => {
      socket.destroy();
      finalize({
        status: 'pending',
        message: `TLS probe timed out for ${hostname}.`,
        validTo: null,
      });
    });

    socket.once('error', (error) => {
      finalize({
        status: 'pending',
        message: `TLS probe failed for ${hostname}: ${getErrorMessage(error)}.`,
        validTo: null,
      });
    });
  });
}

export async function probeTenantDomainState(input: ProbeTenantDomainInput): Promise<TenantDomainProbeResult> {
  const checkedAt = new Date().toISOString();
  const hostname = input.hostname.trim().toLowerCase();

  if (isLocalhostDomain(hostname)) {
    return {
      domainId: input.id,
      hostname,
      isPrimary: input.isPrimary,
      persistedVerified: input.isVerified,
      checkedAt,
      dnsStatus: 'verified',
      dnsMessage: `Local development domain ${hostname} resolves via localhost semantics.`,
      certificateStatus: 'ready',
      certificateMessage: 'Certificate probe is skipped for localhost development domains.',
      certificateValidTo: null,
      observedRecords: ['localhost'],
    };
  }

  const dnsProbe = await probeDns(hostname);
  if (dnsProbe.status !== 'verified') {
    return {
      domainId: input.id,
      hostname,
      isPrimary: input.isPrimary,
      persistedVerified: input.isVerified,
      checkedAt,
      dnsStatus: dnsProbe.status,
      dnsMessage: dnsProbe.message,
      certificateStatus: dnsProbe.status === 'missing' ? 'blocked' : 'pending',
      certificateMessage: 'Certificate readiness is gated on successful DNS verification.',
      certificateValidTo: null,
      observedRecords: dnsProbe.observedRecords,
    };
  }

  const certificateProbe = await probeCertificate(hostname);
  return {
    domainId: input.id,
    hostname,
    isPrimary: input.isPrimary,
    persistedVerified: input.isVerified,
    checkedAt,
    dnsStatus: dnsProbe.status,
    dnsMessage: dnsProbe.message,
    certificateStatus: certificateProbe.status,
    certificateMessage: certificateProbe.message,
    certificateValidTo: certificateProbe.validTo,
    observedRecords: dnsProbe.observedRecords,
  };
}
