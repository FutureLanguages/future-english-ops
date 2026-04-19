import { NotificationType, UserRole, type ApplicationAgreement, type Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { notifyPortalUsers } from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";
import type { ApplicationUser } from "@/types/application";

export const defaultAgreementTemplates = [
  {
    title: "ميثاق البرنامج الصيفي",
    content: `🔹 مقدمه

ميثاق البرنامج وثيقة رسمية تمثل اتفاقًًا ملزمًًا بين مؤسسة مستقبل اللغات من جهة، والطالب المشارك وولي أمره من جهة أخرى. تتضمن الوثيقة بنودًًا واضحة ومفصلة موزعة على إحدى عشرة صفحة متتالية، وتهدف إلى ضمان حقوق جميع الأطراف المعنية، وتعزيز الالتزام المتبادل لتحقيق أهداف البرنامج بنجاح. لذا، نحث جميع الأطراف على قراءة الميثاق بعناية قبل إقراره والموافقة على ما ورد فيه.

⸻

🔹 سياسة البرنامج

تلتزم مؤسسة مستقبل اللغات بوضع سياسات صارمة تهدف إلى تحقيق تجربة تعليمية وتربوية مميزة للطلاب. وتشمل هذه السياسة ما يلي:

⸻

🔸 ١- الالتزام بالأنظمة والتعليمات:

يجب على الطالب الالتزام بجميع أنظمة المعهد والبرنامج وتعليمات المشرفين القائمين على البرنامج.
الالتزام بالحضور والجدول الزمني لجميع أنشطة البرنامج.
التحلي بالأخلاق الفاضلة بما يليق بالطالب المسلم الملتزم بتعاليم دينه، والتمثيل الإيجابي أمام المجتمع.
يلتزم الطالب باتباع التعليمات الصحية العامة والحرص على تناول الوجبات المقدمة، بما في ذلك الخضار والفواكه، والاهتمام بصحته العامة.

⸻

🔸 ٢- سياسة الخروج:

يُسمح للطالب بالخروج من المعهد أو السكن خلال أيام الأسبوع من الساعة 6:00 مساءً حتى الساعة 10:00 مساءً، شريطة أن يكون برفقة المشرفين، ولا يُسمح بخروج الطالب في غير هذه الأوقات أو بمفرده.
حضور الحصص الدراسية شرط أساسي للخروج، وفي حال عدم حضوره لن يُسمح له بالخروج طوال اليوم.

⸻

🔸 ٣- ضوابط السلوك والانضباط:

الالتزام بأداء الصلوات مع المجموعة بدون تأخير.
يمنع الخروج عن المجموعة أثناء الرحلات.
يُمنع دخول الطالب إلى غرف طلاب آخرين إلا بإذن المشرف، ويُعد ذلك مخالفة صريحة للأنظمة والتعليمات.

يُمنع ارتكاب أي سلوك غير لائق، بما في ذلك:
التدخين بجميع أشكاله (التبغ، الشيشة، التدخين الإلكتروني).
استخدام الجوال أو ما يقوم مقامه أثناء الحصص الدراسية أو وقت النوم، وسيتم سحب الجهاز في حال المخالفة.
الشتم أو السب أو اللعن أو القذف أو أي ألفاظ نابية.
الذهاب إلى أماكن غير لائقة أو السهر دون إذن.
ارتكاب أي مخالفات شرعية أو أخلاقية.
الاعتداء أو التخريب لأي ممتلكات.
استخدام الأدوات أو المواد التي قد تشكل خطراً.

⸻

🔸 ٤- إجراءات التعامل مع المخالفات:

تنبيه الطالب.
إبلاغ ولي الأمر.
اتخاذ إجراء.

يعتمد البرنامج آلية انضباط تربوية ومتدرّجة، تُطبّق على جميع الطلاب دون استثناء ، ويُراعى في تطبيقها نوع المخالفة وتكرارها، وتُعد قرارات إدارة البرنامج نهائية في هذا الشأن.

يحق للبرنامج، في حال تكرار المخالفات، إعفاء نفسه من المسؤولية تجاه الطالب، بما يشمل حرمانه من الإشراف التربوي والأكاديمي والمشاركة في الرحلات والأنشطة الأخرى، مع اقتصار استفادته على السكن والوجبات وحضور الدراسة فقط، وذلك بشرط موافقة إدارة المعهد، ودون أي التزام بتقديم تعويض مالي.

يتحمل الطالب و ولي أمره تكلفة أي ضرر مادي ناتج عن سوء استخدام المرافق أو الممتلكات.

⸻

🔸 ٥- متطلبات السفر:

حجز تذاكر السفر (ذهابًا وعودةً) ضمن التواريخ المحددة:
الوصول: الأحد   05/07/2026 م .
العودة: السبت 01/08/2026 م .

مسؤولية توصيل الطالب للمطار عند الذهاب واستقباله عند العودة تقع على ولي الأمر.

التسجيل في موقع السفر (https://etravel.gov.ph) قبل الإقلاع بيومين إلى 3 أيام وتحميل الباركود وإرساله للإدارة.

يُشترط أن يتمتع جواز السفر بصلاحية تزيد عن 6 أشهر قبل بداية البرنامج.

إصدار تصريح سفر إلكتروني عبر منصة «أبشر» لمن هم دون (21) عامًا.

الالتزام بجميع شروط السفر وفق الأنظمة والتعليمات الرسمية في المملكة.

⸻

🔸 ٦- الالتزام بالأنظمة المحلية:

يتحمل الطالب مسؤولية الالتزام بجميع القوانين والأنظمة المحلية لدولة الفلبين.
أي مخالفة للقوانين المحلية يتم التعامل معها بالتنسيق مع السلطات المحلية، مع تحمل الطالب وولي أمره جميع التبعات القانونية.

⸻

🔸 ٧- التوثيق الإعلامي:

يتم توثيق جميع الفعاليات والأنشطة التي تقام خلال البرنامج من خلال التصوير الفوتوغرافي والفيديو، لاستخدامها في إعداد مواد تعليمية وإعلامية.

تُجرى لقاءات مع المشاركين في الرحلة لتوثيق آرائهم وتجاربهم، ويتم تصوير هذه اللقاءات.

قد تُنشر الصور ومقاطع الفيديو عبر وسائل الإعلام المختلفة، بما في ذلك منصات التواصل الاجتماعي، مع إمكانية ذكر أسماء المشاركين عند الحاجة، دون أي تعويض مادي.

⸻

🔸 ٨- معلومات البرنامج:

الدراسة: خمسة أيام في الأسبوع.
البرامج المسائية: برامج مسائية متنوعة ونزهات ترفيهية بصحبة المشرفين.
الإقامة: غرفة ثنائية فندقية.
الوجبات: ثلاث وجبات رئيسية.
الرحلات: ثلاث رحلات أساسية.

يستثنى من أيام الدراسة: العطل الرسمية بالفلبين ويوم الاستقبال والتخرج.

⸻

🔸 ٩- آلية الرسوم:

أ- رسوم البرنامج:
تشمل الرسوم جميع خدمات البرنامج: الدراسة، السكن، الوجبات، الرحلات، الإشراف التربوي، التأمين الطبي، والرسوم الحكومية.

ب- مواعيد الدفع:
رسوم الحجز: 3000 ريال تُخصم من إجمالي الرسوم عند استكمال الدفع، ولا يمكن استردادها.
مبلغ تأمين إضافي: 1500 ريال يُعاد بنهاية البرنامج، إلا إذا استُخدم لتعويض أي أضرار تسبب بها الطالب.
يجب تسديد الرسوم بالكامل قبل يوم الأحد 31/05/2026 كحد أقصى.

ج- سياسة الإلغاء:
	•	الإلغاء قبل يوم الأحد 31/05/2026 : استرداد كامل المبلغ باستثناء رسوم الحجز.
	•	الإلغاء خلال أقل من شهر على بدء البرنامج: استرداد 50% من الرسوم، دون استرداد رسوم الحجز.
	•	الإلغاء خلال 3 أيام من بدء البرنامج: استرداد 20% من الرسوم فقط، دون رسوم الحجز.
	•	الإلغاء بعد بدء البرنامج: لا يتم استرداد أي رسوم.

رسوم تذكرة الطيران يتم التعامل معا بشكل منفصل، ويخضع المبلغ المرتجع لسياسة شركة الطيران.

⸻

🔸 ١٠- حالات الطوارئ:

البرنامج يُقدّر سلامة جميع المشاركين، ولكن يُرجى التفهم بأنّه لا يمكن تحمّل المسؤولية عن الأضرار الناتجة عن:

الكوارث الطبيعية مثل الزلازل، الأعاصير، أو الحوادث أو أي أحداث خارجة عن الإرادة.
الإصابات أو الأمراض التي تحدث نتيجة ظروف طارئة أو غير متوقعة أثناء الرحلة.

ما قد ينشأ أثناء الرحلات والأنشطة والفعاليات المختلفة، بما في ذلك الدباب البحري، البارشوت، الزيبلاين، السباحة مع الحوت القرش، دبابات الطين، البنانا بوت، وغيرها من الأنشطة، ويلتزم الطالب بالتقيد التام بتعليمات المشرفين والمنظمين.

يلتزم البرنامج بتقديم الدعم الطبي الأولي وإبلاغ الجهات المختصة وولي الأمر فور حدوث أي طارئ لا سمح الله .

وفي حال ترتب على حالات الطوارئ أو الظروف القاهرة الخارجة عن الإرادة – بما في ذلك الحروب، أو الأوضاع الأمنية، إغلاق المطارات، أو أي أحداث طارئة – تمنع أوتؤثر على تنفيذ البرنامج كلياً أو جزئياً، فإن التعامل مع جميع المبالغ المالية المتعلقة بالبرنامج، سواءً المدفوعة أو المتبقية، يخضع للتفاهمات والالتزامات المعتمدة مع الجهات التي تم التنسيق معها مسبقًا، مثل المعاهد، شركات الطيران، ومزودي الخدمات الآخرين، ويكون الاسترداد – إن وُجد – وفق ما تسمح به تلك الجهات، وقد يترتب على ذلك التزامات مالية إضافية، ولا تتحمل مؤسسة مستقبل اللغات أي تبعات مالية ناتجة عن هذه الظروف.

⸻

🔸 ١١- الإفصاح والإقرار:

يلتزم ولي الأمر بالإفصاح المسبق عن أي أمراض أو معلومات خاصة بالطالب قد تؤثر على مشاركته في البرنامج أو سلامته.
يلتزم الطالب بإبلاغ المشرفين فوراً عند شعوره بأي أعراض صحية خلال فترة البرنامج.
يلتزم ولي الأمر بإبلاغ إدارة البرنامج بشكل واضح ومحدد ومسبق في حال عدم رغبته بمشاركة ابنه في بعض الأنشطة، أو تعذّر مشاركته فيها لأي سبب، بما في ذلك عدم القدرة أو الخوف الشديد أو ما قد يسبب له ضرر، ويُعد عدم الإبلاغ موافقة على مشاركة الطالب في الأنشطة.

يترتب على عدم الإفصاح أو تقديم معلومات غير دقيقة أو مخالفة التعليمات المعتمدة تحمّل ولي الأمر والطالب المسؤولية عن أي آثار ناتجة عن ذلك.

⸻

🔸 ١٢- حقوق البرنامج:

تحتفظ إدارة البرنامج بحق تعديل الأنشطة أو جدول الرحلات وفقًا للظروف الطارئة أو بما يخدم مصلحة الطلاب.
جميع الفعاليات والأنشطة تخضع لإدارة صارمة لضمان سلامة المشاركين، وللبرنامج الحق في تعليق أي نشاط إذا وُجد خطر محتمل.

⸻

🔸 ١٢- التزامات أولياء الأمور:

يقر ولي الأمر بقبوله لجميع شروط الميثاق، ويتعهد بدعم إدارة البرنامج في حال حدوث أي مشكلات تتعلق بالطالب.

⸻

🔹 تنبيهات عامة

يُستحسن أن يزود ولي الأمر الطالب بمصروف شخصي نقدي للتسوق.
تذكير الطالب قبل وأثناء الرحلة بأهمية الاجتهاد في الدراسة والاهتمام بالمذاكرة.
التأكد من توفير كافة احتياجات الطالب المناسبة للرحلة.
نحث بالمحافظة على الهوية والآداب والقيم الإسلامية وعكس صورة حسنة عن أخلاق المسلم الملتزم بتعاليم دينه، والمشاركة الإيجابية مع المجتمع.`,
    acknowledgmentText:
      "توقيعي أدناه يعني اطلاعي وموافقتي على كُل ما ذكر في بنود ميثاق البرنامج وأتحمل كامل المسئولية عن ذلك",
  },
  {
    title: "ميثاق دراسة اللغة الانجليزية",
    content:
      "يلتزم الطالب بحضور دروس اللغة الإنجليزية والمشاركة الفاعلة واحترام تعليمات المعهد والمعلمين، كما يلتزم ولي الأمر بمتابعة التقدم والتعاون مع الإدارة عند الحاجة.",
    acknowledgmentText:
      "أقر بأنني قرأت ميثاق دراسة اللغة الإنجليزية كاملاً وأوافق على جميع بنوده وألتزم بها.",
  },
] as const;

export function isAgreementAcceptedByRole(
  agreement: Pick<
    ApplicationAgreement,
    "studentAccepted" | "parentAccepted" | "requiresStudentAcceptance" | "requiresParentAcceptance"
  >,
  role: ApplicationUser["role"],
) {
  if (role === UserRole.STUDENT) {
    if (!agreement.requiresStudentAcceptance) {
      return true;
    }
    return agreement.studentAccepted;
  }

  if (role === UserRole.PARENT) {
    if (!agreement.requiresParentAcceptance) {
      return true;
    }
    return agreement.parentAccepted;
  }

  return true;
}

export function summarizeAgreementStatus(
  agreements: Array<
    Pick<
      ApplicationAgreement,
      "studentAccepted" | "parentAccepted" | "requiresStudentAcceptance" | "requiresParentAcceptance"
    >
  >,
  role: ApplicationUser["role"],
) {
  if (agreements.length === 0) {
    return {
      total: 0,
      accepted: 0,
      pending: 0,
      isAccepted: true,
      label: "لا توجد مواثيق مطلوبة",
    };
  }

  const accepted = agreements.filter((agreement) =>
    isAgreementAcceptedByRole(agreement, role),
  ).length;
  const pending = agreements.length - accepted;

  return {
    total: agreements.length,
    accepted,
    pending,
    isAccepted: pending === 0,
    label: pending === 0 ? "تمت الموافقة على الميثاق" : "لم تتم الموافقة على الميثاق",
  };
}

export async function ensureDefaultAgreementTemplates(tx: Prisma.TransactionClient = prisma) {
  for (const template of defaultAgreementTemplates) {
    const existingTemplate = await tx.agreementTemplate.findFirst({
      where: {
        title: template.title,
        isDefault: true,
      },
      select: {
        id: true,
      },
    });

    if (existingTemplate) {
      await tx.agreementTemplate.update({
        where: {
          id: existingTemplate.id,
        },
        data: {
          content: template.content,
          acknowledgmentText: template.acknowledgmentText,
          isActive: true,
        },
      });
    } else {
      await tx.agreementTemplate.create({
        data: {
          ...template,
          isDefault: true,
          isActive: true,
        },
      });
    }
  }
}

export async function assignDefaultAgreementToApplication(params: {
  tx?: Prisma.TransactionClient;
  applicationId: string;
  ensureTemplates?: boolean;
  notify?: boolean;
  requiresStudentAcceptance?: boolean;
  requiresParentAcceptance?: boolean;
}) {
  const client = params.tx ?? prisma;

  if (params.ensureTemplates ?? true) {
    await ensureDefaultAgreementTemplates(client);
  }

  const existingAgreement = await client.applicationAgreement.findFirst({
    where: {
      applicationId: params.applicationId,
    },
    select: {
      id: true,
    },
  });

  if (existingAgreement) {
    return existingAgreement;
  }

  const defaultTemplate = await client.agreementTemplate.findFirst({
    where: {
      isDefault: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!defaultTemplate) {
    throw new Error("default_agreement_template_missing");
  }

  const agreement = await client.applicationAgreement.create({
    data: {
      applicationId: params.applicationId,
      templateId: defaultTemplate.id,
      title: defaultTemplate.title,
      contentSnapshot: defaultTemplate.content,
      acknowledgmentSnapshot: defaultTemplate.acknowledgmentText,
      requiresStudentAcceptance: params.requiresStudentAcceptance ?? true,
      requiresParentAcceptance: params.requiresParentAcceptance ?? true,
    },
    select: {
      id: true,
    },
  });

  if (params.notify ?? true) {
    await notifyPortalUsers({
      tx: client,
      applicationId: params.applicationId,
      actorName: "الإدارة",
      actorRole: UserRole.ADMIN,
      title: "تم إسناد ميثاق جديد",
      description: defaultTemplate.title,
      type: NotificationType.AGREEMENT,
      link: "/portal/agreements",
    });
  }

  return agreement;
}

export async function getDefaultAgreementTemplate(tx: Prisma.TransactionClient = prisma) {
  return tx.agreementTemplate.findFirst({
    where: {
      isDefault: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function ensureApplicationsHaveDefaultAgreement(applicationIds: string[]) {
  for (const applicationId of applicationIds) {
    await assignDefaultAgreementToApplication({ applicationId });
  }
}

export async function getPortalAgreementStatus(user: ApplicationUser) {
  const applicationWhere =
    user.role === UserRole.STUDENT ? { studentUserId: user.id } : { parentUserId: user.id };

  const applications = await prisma.application.findMany({
    where: applicationWhere,
    select: {
      agreements: {
        select: {
          studentAccepted: true,
          parentAccepted: true,
          requiresStudentAcceptance: true,
          requiresParentAcceptance: true,
        },
      },
    },
  });

  const agreements = applications.flatMap((application) => application.agreements);
  return summarizeAgreementStatus(agreements, user.role);
}

export async function hasAcceptedApplicationAgreements(params: {
  applicationId: string;
  user: ApplicationUser;
}) {
  const agreements = await prisma.applicationAgreement.findMany({
    where: {
      applicationId: params.applicationId,
    },
    select: {
      studentAccepted: true,
      parentAccepted: true,
      requiresStudentAcceptance: true,
      requiresParentAcceptance: true,
    },
  });

  return summarizeAgreementStatus(agreements, params.user.role).isAccepted;
}

export async function assertPortalAgreementsAccepted(params: {
  applicationId: string;
  user: ApplicationUser;
  redirectPath: string;
}): Promise<void> {
  const isAccepted = await hasAcceptedApplicationAgreements({
    applicationId: params.applicationId,
    user: params.user,
  });

  if (!isAccepted) {
    const separator = params.redirectPath.includes("?") ? "&" : "?";
    redirect(`${params.redirectPath}${separator}error=agreement_required`);
  }
}
