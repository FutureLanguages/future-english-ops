import { ApplicationStatus } from "@prisma/client";
import type {
  PortalStageId,
  PortalStageItem,
  PortalStageModel,
  PortalStatusBehavior,
  PortalStatusBehaviorCode,
} from "@/types/portal";

const unifiedStages: Array<{ id: PortalStageId; label: string }> = [
  { id: "registration", label: "تسجيل الطلب" },
  { id: "profile", label: "استكمال الملف" },
  { id: "documents", label: "المستندات" },
  { id: "agreement", label: "الميثاق" },
  { id: "payment", label: "السداد" },
  { id: "closure", label: "الجاهزية / الإغلاق" },
];

const statusBehaviors: Record<PortalStatusBehaviorCode, PortalStatusBehavior> = {
  DRAFT: {
    code: "DRAFT",
    label: "مسودة الطلب",
    tone: "neutral",
    isTerminal: false,
    suppressActionFraming: false,
    studentHeroTitle: "ابدأ باستكمال طلبك",
    studentHeroDescription: "طلبك في بدايته. أكمل البيانات الأساسية حتى تنتقل للخطوات التالية بوضوح.",
    parentHeroTitle: "الطلب في بدايته",
    parentHeroDescription: "لا يزال الملف يحتاج استكمالاً أولياً قبل أن يصبح جاهزاً للمراجعة.",
  },
  IN_PROGRESS: {
    code: "IN_PROGRESS",
    label: "قيد الاستكمال",
    tone: "active",
    isTerminal: false,
    suppressActionFraming: false,
    studentHeroTitle: "تابع الخطوة التالية",
    studentHeroDescription: "هذه هي المرحلة النشطة الآن. نفّذ الإجراء الأهم حتى يتقدم الطلب للمرحلة التالية.",
    parentHeroTitle: "يوجد تقدم يحتاج متابعة",
    parentHeroDescription: "الطلب يتحرك، وستظهر هنا أي خطوة تحتاج تدخلكم بشكل مباشر.",
  },
  REVIEWING: {
    code: "REVIEWING",
    label: "قيد المراجعة",
    tone: "waiting",
    isTerminal: false,
    suppressActionFraming: false,
    studentHeroTitle: "طلبك قيد المراجعة",
    studentHeroDescription: "الملف لدى الإدارة حالياً. لا تحتاج لاتخاذ إجراء إلا إذا ظهرت مهمة جديدة هنا.",
    parentHeroTitle: "الطلب لدى الإدارة",
    parentHeroDescription: "لا يوجد تدخل مطلوب حالياً ما لم تظهر ملاحظة أو إجراء واضح.",
  },
  PENDING_PAYMENT: {
    code: "PENDING_PAYMENT",
    label: "بانتظار السداد",
    tone: "warning",
    isTerminal: false,
    suppressActionFraming: false,
    studentHeroTitle: "السداد هو الخطوة الحالية",
    studentHeroDescription: "الملف يحتاج متابعة مالية حتى يقترب من الجاهزية النهائية.",
    parentHeroTitle: "المدفوعات تحتاج متابعة",
    parentHeroDescription: "المتابعة المالية هي التدخل الأهم حالياً لإكمال الطلب.",
  },
  READY: {
    code: "READY",
    label: "جاهز للإغلاق",
    tone: "success",
    isTerminal: false,
    suppressActionFraming: true,
    studentHeroTitle: "الطلب جاهز للمرحلة النهائية",
    studentHeroDescription: "اكتملت الخطوات الأساسية، والطلب الآن قريب من الإغلاق أو الاعتماد النهائي.",
    parentHeroTitle: "الطلب في حالة مطمئنة",
    parentHeroDescription: "لا توجد خطوات أساسية متوقفة حالياً، والملف قريب من الاكتمال النهائي.",
  },
  COMPLETED: {
    code: "COMPLETED",
    label: "مكتمل",
    tone: "success",
    isTerminal: true,
    suppressActionFraming: true,
    studentHeroTitle: "اكتملت الرحلة",
    studentHeroDescription: "تم إكمال الطلب. هذه الصفحة أصبحت ملخصاً نهائياً بدلاً من مساحة إجراءات نشطة.",
    parentHeroTitle: "تم إكمال الطلب",
    parentHeroDescription: "الطلب مغلق كمكتمل، ولا توجد إجراءات تشغيلية مطلوبة من ولي الأمر.",
  },
  CANCELLED: {
    code: "CANCELLED",
    label: "ملغى",
    tone: "danger",
    isTerminal: true,
    suppressActionFraming: true,
    studentHeroTitle: "تم إلغاء الطلب",
    studentHeroDescription: "هذا الطلب لم يعد في مسار نشط، لذلك لا تظهر إجراءات متابعة تشغيلية.",
    parentHeroTitle: "الطلب ملغى",
    parentHeroDescription: "هذا الطلب مغلق كملغى، ولا توجد إجراءات متابعة مطلوبة.",
  },
};

function getStageIndex(stageId: PortalStageId) {
  return unifiedStages.findIndex((stage) => stage.id === stageId);
}

function resolveStageStatus(params: {
  itemIndex: number;
  currentStageIndex: number;
  statusCode: PortalStatusBehaviorCode;
}) {
  if (params.statusCode === "COMPLETED") {
    return "completed";
  }

  if (params.statusCode === "CANCELLED") {
    return params.itemIndex === params.currentStageIndex ? "current" : "upcoming";
  }

  if (params.itemIndex < params.currentStageIndex) {
    return "completed";
  }

  if (params.itemIndex === params.currentStageIndex) {
    return "current";
  }

  return "upcoming";
}

function buildStageModel(params: {
  currentStageId: PortalStageId;
  statusCode: PortalStatusBehaviorCode;
}): PortalStageModel {
  const currentStageIndex = getStageIndex(params.currentStageId);
  const safeStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  const timelineActive = params.statusCode !== "CANCELLED";
  const progressPercent =
    params.statusCode === "COMPLETED"
      ? 100
      : params.statusCode === "CANCELLED"
        ? 0
        : Math.round((safeStageIndex / (unifiedStages.length - 1)) * 100);
  const stages: PortalStageItem[] = unifiedStages.map((stage, index) => ({
    ...stage,
    index,
    status: resolveStageStatus({
      itemIndex: index,
      currentStageIndex: safeStageIndex,
      statusCode: params.statusCode,
    }),
  }));

  return {
    currentStageId: params.currentStageId,
    currentStageIndex: safeStageIndex,
    currentStageLabel: unifiedStages[safeStageIndex]?.label ?? unifiedStages[0].label,
    progressPercent,
    timelineActive,
    stages,
  };
}

export function derivePortalStageStatus(params: {
  applicationStatus: ApplicationStatus;
  profileComplete: boolean;
  documentsComplete: boolean;
  agreementsComplete: boolean;
  paymentComplete: boolean;
  isCancelled?: boolean;
}) {
  if (params.isCancelled) {
    return {
      stage: buildStageModel({ currentStageId: "closure", statusCode: "CANCELLED" }),
      statusBehavior: statusBehaviors.CANCELLED,
    };
  }

  if (params.applicationStatus === ApplicationStatus.COMPLETED) {
    return {
      stage: buildStageModel({ currentStageId: "closure", statusCode: "COMPLETED" }),
      statusBehavior: statusBehaviors.COMPLETED,
    };
  }

  if (params.applicationStatus === ApplicationStatus.NEW) {
    return {
      stage: buildStageModel({ currentStageId: "registration", statusCode: "DRAFT" }),
      statusBehavior: statusBehaviors.DRAFT,
    };
  }

  if (!params.profileComplete) {
    return {
      stage: buildStageModel({ currentStageId: "profile", statusCode: "IN_PROGRESS" }),
      statusBehavior: statusBehaviors.IN_PROGRESS,
    };
  }

  if (!params.documentsComplete) {
    return {
      stage: buildStageModel({ currentStageId: "documents", statusCode: "IN_PROGRESS" }),
      statusBehavior: statusBehaviors.IN_PROGRESS,
    };
  }

  if (!params.agreementsComplete) {
    return {
      stage: buildStageModel({ currentStageId: "agreement", statusCode: "IN_PROGRESS" }),
      statusBehavior: statusBehaviors.IN_PROGRESS,
    };
  }

  if (params.applicationStatus === ApplicationStatus.WAITING_PAYMENT || !params.paymentComplete) {
    return {
      stage: buildStageModel({ currentStageId: "payment", statusCode: "PENDING_PAYMENT" }),
      statusBehavior: statusBehaviors.PENDING_PAYMENT,
    };
  }

  if (params.applicationStatus === ApplicationStatus.UNDER_REVIEW) {
    return {
      stage: buildStageModel({ currentStageId: "closure", statusCode: "REVIEWING" }),
      statusBehavior: statusBehaviors.REVIEWING,
    };
  }

  return {
    stage: buildStageModel({ currentStageId: "closure", statusCode: "READY" }),
    statusBehavior: statusBehaviors.READY,
  };
}
