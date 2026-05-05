import { PortalMode, type ApplicationPortalConfig } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const portalSurfaceKeys = [
  "showCountdown",
  "showTripDetails",
  "showFlightInfo",
  "showSupervisorInfo",
  "showProgramEvents",
  "showEnrollmentCard",
  "showPaymentSchedule",
] as const;

export type PortalSurfaceKey = (typeof portalSurfaceKeys)[number];
export type PortalSurfaceMap = Record<PortalSurfaceKey, boolean>;
export type PortalSurfaceOverrideMap = Record<PortalSurfaceKey, boolean | null>;

export type PortalSurfaceResolvedItem = {
  key: PortalSurfaceKey;
  label: string;
  description: string;
  modeDefault: boolean;
  override: boolean | null;
  enabled: boolean;
  renderable: boolean;
  supportLabel: string;
};

export type PortalSurfaceResolution = {
  mode: PortalMode;
  surfaces: PortalSurfaceMap;
  overrides: PortalSurfaceOverrideMap;
  items: PortalSurfaceResolvedItem[];
};

export const portalModeLabels: Record<PortalMode, string> = {
  GENERAL_STUDY: "دراسة عامة",
  SUMMER_PROGRAM: "برنامج صيفي",
};

const surfaceMetadata: Record<PortalSurfaceKey, {
  label: string;
  description: string;
  renderable: boolean;
  unsupportedReason: string;
}> = {
  showCountdown: {
    label: "العد التنازلي",
    description: "سطح مستقبلي للعد التنازلي عند توفر تاريخ فعلي.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود تاريخ فعلي مدعوم في البيانات.",
  },
  showTripDetails: {
    label: "تفاصيل الرحلة",
    description: "سطح مستقبلي لتفاصيل الرحلة عند توفر بياناتها.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود بيانات رحلة مدعومة.",
  },
  showFlightInfo: {
    label: "معلومات الطيران",
    description: "سطح مستقبلي لمعلومات الطيران عند توفر بياناتها.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود بيانات طيران مدعومة.",
  },
  showSupervisorInfo: {
    label: "بيانات المشرف",
    description: "سطح مستقبلي لبيانات المشرف عند توفر ربط فعلي.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود بيانات مشرف مدعومة.",
  },
  showProgramEvents: {
    label: "فعاليات البرنامج",
    description: "سطح مستقبلي للفعاليات عند توفر بياناتها.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود نظام فعاليات مدعوم.",
  },
  showEnrollmentCard: {
    label: "بطاقة التسجيل",
    description: "ملخص تسجيل يعتمد على حالة الطلب والمرحلة الحالية.",
    renderable: true,
    unsupportedReason: "",
  },
  showPaymentSchedule: {
    label: "جدول السداد",
    description: "سطح مستقبلي لجدولة السداد عند توفر بيانات الأقساط.",
    renderable: false,
    unsupportedReason: "غير قابل للعرض حالياً لعدم وجود جدول أقساط مدعوم.",
  },
};

const modeDefaults: Record<PortalMode, PortalSurfaceMap> = {
  GENERAL_STUDY: {
    showCountdown: false,
    showTripDetails: false,
    showFlightInfo: false,
    showSupervisorInfo: false,
    showProgramEvents: false,
    showEnrollmentCard: true,
    showPaymentSchedule: true,
  },
  SUMMER_PROGRAM: {
    showCountdown: true,
    showTripDetails: true,
    showFlightInfo: true,
    showSupervisorInfo: true,
    showProgramEvents: true,
    showEnrollmentCard: false,
    showPaymentSchedule: false,
  },
};

export function getPortalModeOptions() {
  return Object.values(PortalMode).map((mode) => ({
    value: mode,
    label: portalModeLabels[mode],
  }));
}

export function getPortalSurfaceDefinitions() {
  return portalSurfaceKeys.map((key) => ({
    key,
    ...surfaceMetadata[key],
  }));
}

function normalizeMode(mode: string | null | undefined): PortalMode {
  return mode === PortalMode.SUMMER_PROGRAM ? PortalMode.SUMMER_PROGRAM : PortalMode.GENERAL_STUDY;
}

function toOverrides(config: Pick<ApplicationPortalConfig, PortalSurfaceKey> | null | undefined): PortalSurfaceOverrideMap {
  return portalSurfaceKeys.reduce((overrides, key) => {
    overrides[key] = config?.[key] ?? null;
    return overrides;
  }, {} as PortalSurfaceOverrideMap);
}

export function resolvePortalSurfaces(params: {
  mode: PortalMode | string | null | undefined;
  overrides?: Partial<PortalSurfaceOverrideMap> | null;
}): PortalSurfaceResolution {
  const mode = normalizeMode(params.mode);
  const defaults = modeDefaults[mode];
  const overrides = portalSurfaceKeys.reduce((resolvedOverrides, key) => {
    const value = params.overrides?.[key];
    resolvedOverrides[key] = typeof value === "boolean" ? value : null;
    return resolvedOverrides;
  }, {} as PortalSurfaceOverrideMap);
  const surfaces = portalSurfaceKeys.reduce((resolvedSurfaces, key) => {
    resolvedSurfaces[key] = overrides[key] ?? defaults[key];
    return resolvedSurfaces;
  }, {} as PortalSurfaceMap);
  const items = portalSurfaceKeys.map((key) => {
    const metadata = surfaceMetadata[key];
    const enabled = surfaces[key];

    return {
      key,
      label: metadata.label,
      description: metadata.description,
      modeDefault: defaults[key],
      override: overrides[key],
      enabled,
      renderable: enabled && metadata.renderable,
      supportLabel: enabled
        ? metadata.renderable
          ? "مفعل وقابل للعرض من البيانات الحالية"
          : metadata.unsupportedReason
        : "غير مفعل حالياً",
    };
  });

  return {
    mode,
    surfaces,
    overrides,
    items,
  };
}

export async function readApplicationPortalConfig(applicationId: string) {
  const config = await prisma.applicationPortalConfig.findUnique({
    where: { applicationId },
  });

  return {
    config,
    resolution: resolvePortalSurfaces({
      mode: config?.mode ?? PortalMode.GENERAL_STUDY,
      overrides: toOverrides(config),
    }),
  };
}

export async function getOrCreateApplicationPortalConfig(applicationId: string) {
  return prisma.applicationPortalConfig.upsert({
    where: { applicationId },
    update: {},
    create: {
      applicationId,
      mode: PortalMode.GENERAL_STUDY,
    },
  });
}

export async function updateApplicationPortalConfig(params: {
  applicationId: string;
  mode: PortalMode;
  overrides: PortalSurfaceOverrideMap;
}) {
  return prisma.applicationPortalConfig.upsert({
    where: { applicationId: params.applicationId },
    update: {
      mode: params.mode,
      ...params.overrides,
    },
    create: {
      applicationId: params.applicationId,
      mode: params.mode,
      ...params.overrides,
    },
  });
}

export function parsePortalMode(value: FormDataEntryValue | null) {
  return value === PortalMode.SUMMER_PROGRAM || value === PortalMode.GENERAL_STUDY
    ? value
    : null;
}

export function parsePortalSurfaceOverrides(formData: FormData) {
  const overrides = {} as PortalSurfaceOverrideMap;

  for (const key of portalSurfaceKeys) {
    const value = formData.get(key);

    if (value === "inherit") {
      overrides[key] = null;
    } else if (value === "true") {
      overrides[key] = true;
    } else if (value === "false") {
      overrides[key] = false;
    } else {
      return null;
    }
  }

  return overrides;
}
