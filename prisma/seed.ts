import { hashSync } from "bcryptjs";
import {
  AllowedUploaderRole,
  ApplicationStatus,
  ApplicationNoteType,
  DocumentCategory,
  DocumentStatus,
  MessageThreadType,
  ParentType,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "DemoPass123!";
const passwordHash = hashSync(DEMO_PASSWORD, 10);

const documentRequirements = [
  {
    code: "student_passport",
    titleAr: "جواز سفر الطالب",
    descriptionAr: "صورة واضحة من جواز سفر الطالب.",
    category: DocumentCategory.STUDENT,
    allowedUploaderRoles: [
      AllowedUploaderRole.STUDENT,
      AllowedUploaderRole.PARENT,
      AllowedUploaderRole.ADMIN,
    ],
    sortOrder: 10,
    isAlwaysRequired: true,
  },
  {
    code: "student_id",
    titleAr: "هوية الطالب",
    descriptionAr: "صورة من الهوية الوطنية أو الإقامة.",
    category: DocumentCategory.STUDENT,
    allowedUploaderRoles: [
      AllowedUploaderRole.STUDENT,
      AllowedUploaderRole.PARENT,
      AllowedUploaderRole.ADMIN,
    ],
    sortOrder: 20,
    isAlwaysRequired: true,
  },
  {
    code: "student_personal_photo",
    titleAr: "الصورة الشخصية",
    descriptionAr: "صورة شخصية حديثة بخلفية واضحة.",
    category: DocumentCategory.STUDENT,
    allowedUploaderRoles: [
      AllowedUploaderRole.STUDENT,
      AllowedUploaderRole.PARENT,
      AllowedUploaderRole.ADMIN,
    ],
    sortOrder: 30,
    isAlwaysRequired: true,
  },
  {
    code: "student_approval_form",
    titleAr: "نموذج الموافقة",
    descriptionAr: "نموذج الموافقة بعد التوقيع.",
    category: DocumentCategory.STUDENT,
    allowedUploaderRoles: [
      AllowedUploaderRole.STUDENT,
      AllowedUploaderRole.PARENT,
      AllowedUploaderRole.ADMIN,
    ],
    sortOrder: 40,
    isAlwaysRequired: true,
  },
  {
    code: "student_signed_agreement",
    titleAr: "الاتفاقية الموقعة",
    descriptionAr: "نسخة موقعة من اتفاقية البرنامج.",
    category: DocumentCategory.STUDENT,
    allowedUploaderRoles: [
      AllowedUploaderRole.STUDENT,
      AllowedUploaderRole.PARENT,
      AllowedUploaderRole.ADMIN,
    ],
    sortOrder: 50,
    isAlwaysRequired: true,
  },
  {
    code: "father_passport",
    titleAr: "جواز سفر الأب",
    descriptionAr: "صورة واضحة من جواز سفر الأب.",
    category: DocumentCategory.PARENT,
    allowedUploaderRoles: [AllowedUploaderRole.PARENT, AllowedUploaderRole.ADMIN],
    sortOrder: 60,
    isAlwaysRequired: true,
  },
  {
    code: "mother_passport",
    titleAr: "جواز سفر الأم",
    descriptionAr: "صورة واضحة من جواز سفر الأم عند الحاجة.",
    category: DocumentCategory.PARENT,
    allowedUploaderRoles: [AllowedUploaderRole.PARENT, AllowedUploaderRole.ADMIN],
    sortOrder: 70,
  },
  {
    code: "guardianship_paper",
    titleAr: "وثيقة الولاية",
    descriptionAr: "وثيقة الولاية مطلوبة للحالات الخاصة أو للطلاب أقل من 16 سنة.",
    category: DocumentCategory.GUARDIAN,
    allowedUploaderRoles: [AllowedUploaderRole.PARENT, AllowedUploaderRole.ADMIN],
    sortOrder: 80,
    requiresUnder16: true,
    requiresGuardianCase: true,
  },
  {
    code: "payment_receipt",
    titleAr: "إيصال الدفع",
    descriptionAr: "إرفاق إيصال التحويل أو الدفع.",
    category: DocumentCategory.PAYMENT,
    allowedUploaderRoles: [AllowedUploaderRole.PARENT, AllowedUploaderRole.ADMIN],
    sortOrder: 90,
  },
];

type RequirementCode = (typeof documentRequirements)[number]["code"];

async function createFileAsset(name: string, mimeType: string) {
  return prisma.fileAsset.create({
    data: {
      storageKey: `seed/${name}`,
      originalName: name,
      mimeType,
      sizeBytes: 150_000,
    },
  });
}

async function main() {
  await prisma.applicationNote.deleteMany();
  await prisma.applicationAgreement.deleteMany();
  await prisma.agreementTemplate.deleteMany();
  await prisma.applicationDocument.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.application.deleteMany();
  await prisma.documentRequirement.deleteMany();
  await prisma.fileAsset.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      mobileNumber: "966500000001",
      passwordHash,
      mustChangePassword: false,
      role: UserRole.ADMIN,
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        mobileNumber: "966500000101",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        mobileNumber: "966500000201",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.PARENT,
      },
    }),
    prisma.user.create({
      data: {
        mobileNumber: "966500000102",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        mobileNumber: "966500000202",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.PARENT,
      },
    }),
    prisma.user.create({
      data: {
        mobileNumber: "966500000103",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.STUDENT,
      },
    }),
    prisma.user.create({
      data: {
        mobileNumber: "966500000203",
        passwordHash,
        mustChangePassword: false,
        role: UserRole.PARENT,
      },
    }),
  ]);

  const [
    studentUser1,
    parentUser1,
    studentUser2,
    parentUser2,
    studentUser3,
    parentUser3,
  ] = users;

  await prisma.documentRequirement.createMany({
    data: documentRequirements,
  });

  const agreementTemplates = await Promise.all([
    prisma.agreementTemplate.create({
      data: {
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
        isDefault: true,
      },
    }),
    prisma.agreementTemplate.create({
      data: {
        title: "ميثاق دراسة اللغة الانجليزية",
        content:
          "يلتزم الطالب بحضور دروس اللغة الإنجليزية والمشاركة الفاعلة واحترام تعليمات المعهد والمعلمين، كما يلتزم ولي الأمر بمتابعة التقدم والتعاون مع الإدارة عند الحاجة.",
        acknowledgmentText:
          "أقر بأنني قرأت ميثاق دراسة اللغة الإنجليزية كاملاً وأوافق على جميع بنوده وألتزم بها.",
        isDefault: true,
      },
    }),
  ]);

  const requirements = await prisma.documentRequirement.findMany();
  const requirementsByCode = new Map(
    requirements.map((requirement) => [requirement.code, requirement]),
  );

  const application1 = await prisma.application.create({
    data: {
      studentUserId: studentUser1.id,
      parentUserId: parentUser1.id,
      status: ApplicationStatus.INCOMPLETE,
      totalCostSar: "12000.00",
      paidAmountSar: "0.00",
      showPaymentToStudent: false,
      studentBasicInfoLocked: false,
      studentAdditionalInfoLocked: false,
      fatherInfoLocked: false,
      motherInfoLocked: false,
      guardianInfoLocked: false,
      studentDocumentsLocked: false,
      parentDocumentsLocked: false,
      guardianDocumentsLocked: false,
      studentProfile: {
        create: {
          fullNameAr: "أحمد خالد العتيبي",
          fullNameEn: "Ahmed Khalid Alotaibi",
          birthDate: new Date("2008-06-12"),
          gender: "male",
          nationality: "Saudi",
          city: null,
          schoolName: "Al Rowad High School",
          passportNumber: null,
          nationalIdNumber: "1087654321",
        },
      },
      parentProfiles: {
        create: [
          {
            type: ParentType.FATHER,
            fullName: "خالد عبدالله العتيبي",
            mobileNumber: "966500000301",
            passportNumber: "P1234501",
            nationalIdNumber: "1012345678",
          },
          {
            type: ParentType.MOTHER,
            fullName: "سارة محمد العتيبي",
            mobileNumber: "966500000302",
            passportNumber: "P1234502",
            nationalIdNumber: "1023456789",
          },
        ],
      },
    },
  });

  const application2 = await prisma.application.create({
    data: {
      studentUserId: studentUser2.id,
      parentUserId: parentUser2.id,
      status: ApplicationStatus.UNDER_REVIEW,
      totalCostSar: "13500.00",
      paidAmountSar: "5000.00",
      showPaymentToStudent: false,
      studentBasicInfoLocked: false,
      studentAdditionalInfoLocked: false,
      fatherInfoLocked: false,
      motherInfoLocked: false,
      guardianInfoLocked: false,
      studentDocumentsLocked: false,
      parentDocumentsLocked: false,
      guardianDocumentsLocked: false,
      studentProfile: {
        create: {
          fullNameAr: "ريما فهد القحطاني",
          fullNameEn: "Reema Fahad Alqahtani",
          birthDate: new Date("2011-02-18"),
          gender: "female",
          nationality: "Saudi",
          city: "Riyadh",
          schoolName: "Future Academy",
          passportNumber: "P2234501",
          nationalIdNumber: "2087654321",
        },
      },
      parentProfiles: {
        create: [
          {
            type: ParentType.FATHER,
            fullName: "فهد صالح القحطاني",
            mobileNumber: "966500000303",
            passportNumber: "P2234502",
            nationalIdNumber: "2012345678",
          },
          {
            type: ParentType.MOTHER,
            fullName: "نورة عبدالله القحطاني",
            mobileNumber: "966500000304",
            passportNumber: "P2234503",
            nationalIdNumber: "2023456789",
          },
        ],
      },
    },
  });

  const application3 = await prisma.application.create({
    data: {
      studentUserId: studentUser3.id,
      parentUserId: parentUser3.id,
      status: ApplicationStatus.WAITING_PAYMENT,
      totalCostSar: "14000.00",
      paidAmountSar: "9000.00",
      showPaymentToStudent: false,
      studentBasicInfoLocked: false,
      studentAdditionalInfoLocked: false,
      fatherInfoLocked: false,
      motherInfoLocked: false,
      guardianInfoLocked: false,
      studentDocumentsLocked: false,
      parentDocumentsLocked: false,
      guardianDocumentsLocked: false,
      studentProfile: {
        create: {
          fullNameAr: "عبدالله سلمان الدوسري",
          fullNameEn: "Abdullah Salman Aldosari",
          birthDate: new Date("2009-09-21"),
          gender: "male",
          nationality: "Saudi",
          city: "Jeddah",
          schoolName: "Al Andalus School",
          passportNumber: "P3234501",
          nationalIdNumber: "3087654321",
        },
      },
      parentProfiles: {
        create: [
          {
            type: ParentType.FATHER,
            fullName: "سلمان محمد الدوسري",
            mobileNumber: null,
            passportNumber: null,
            nationalIdNumber: "3012345678",
            isDeceased: true,
            note: "الأب متوفى.",
          },
          {
            type: ParentType.MOTHER,
            fullName: "لولوة عبدالله الدوسري",
            mobileNumber: "966500000305",
            passportNumber: "P3234503",
            nationalIdNumber: "3023456789",
          },
          {
            type: ParentType.GUARDIAN,
            fullName: "محمد عبدالله الدوسري",
            relationToStudent: "العم",
            note: "الوصي الحالي المعتمد للسفر والمتابعة.",
            mobileNumber: "966500000306",
            passportNumber: "P3234504",
          },
        ],
      },
    },
  });

  const files = await Promise.all([
    createFileAsset("student-passport-1.pdf", "application/pdf"),
    createFileAsset("student-photo-1.jpg", "image/jpeg"),
    createFileAsset("father-passport-1.pdf", "application/pdf"),
    createFileAsset("student-passport-2.pdf", "application/pdf"),
    createFileAsset("student-id-2.pdf", "application/pdf"),
    createFileAsset("mother-passport-2.pdf", "application/pdf"),
    createFileAsset("guardianship-paper-2.pdf", "application/pdf"),
    createFileAsset("agreement-3.pdf", "application/pdf"),
    createFileAsset("receipt-3.pdf", "application/pdf"),
  ]);

  const [
    studentPassport1,
    studentPhoto1,
    fatherPassport1,
    studentPassport2,
    studentId2,
    motherPassport2,
    guardianshipPaper2,
    agreement3,
    receipt3,
  ] = files;

  async function createApplicationDocument(params: {
    applicationId: string;
    code: RequirementCode;
    status: DocumentStatus;
    fileAssetId?: string;
    uploadedByUserId?: string;
    adminNote?: string;
  }) {
    const requirement = requirementsByCode.get(params.code);

    if (!requirement) {
      throw new Error(`Missing document requirement for code: ${params.code}`);
    }

    return prisma.applicationDocument.create({
      data: {
        applicationId: params.applicationId,
        requirementId: requirement.id,
        status: params.status,
        fileAssetId: params.fileAssetId,
        uploadedByUserId: params.uploadedByUserId,
        adminNote: params.adminNote,
        reviewedAt:
          params.status === DocumentStatus.APPROVED ||
          params.status === DocumentStatus.REJECTED ||
          params.status === DocumentStatus.REUPLOAD_REQUESTED
            ? new Date()
            : null,
      },
    });
  }

  await Promise.all([
    createApplicationDocument({
      applicationId: application1.id,
      code: "student_passport",
      status: DocumentStatus.UPLOADED,
      fileAssetId: studentPassport1.id,
      uploadedByUserId: studentUser1.id,
    }),
    createApplicationDocument({
      applicationId: application1.id,
      code: "student_personal_photo",
      status: DocumentStatus.APPROVED,
      fileAssetId: studentPhoto1.id,
      uploadedByUserId: studentUser1.id,
      adminNote: "الصورة الشخصية واضحة.",
    }),
    createApplicationDocument({
      applicationId: application1.id,
      code: "father_passport",
      status: DocumentStatus.APPROVED,
      fileAssetId: fatherPassport1.id,
      uploadedByUserId: parentUser1.id,
      adminNote: "تمت مراجعة جواز الأب.",
    }),
    createApplicationDocument({
      applicationId: application2.id,
      code: "student_passport",
      status: DocumentStatus.APPROVED,
      fileAssetId: studentPassport2.id,
      uploadedByUserId: studentUser2.id,
    }),
    createApplicationDocument({
      applicationId: application2.id,
      code: "student_id",
      status: DocumentStatus.UNDER_REVIEW,
      fileAssetId: studentId2.id,
      uploadedByUserId: studentUser2.id,
    }),
    createApplicationDocument({
      applicationId: application2.id,
      code: "mother_passport",
      status: DocumentStatus.APPROVED,
      fileAssetId: motherPassport2.id,
      uploadedByUserId: parentUser2.id,
    }),
    createApplicationDocument({
      applicationId: application2.id,
      code: "guardianship_paper",
      status: DocumentStatus.UPLOADED,
      fileAssetId: guardianshipPaper2.id,
      uploadedByUserId: parentUser2.id,
    }),
    createApplicationDocument({
      applicationId: application3.id,
      code: "student_signed_agreement",
      status: DocumentStatus.REJECTED,
      fileAssetId: agreement3.id,
      uploadedByUserId: studentUser3.id,
      adminNote: "النسخة غير واضحة. يرجى إعادة الرفع.",
    }),
    createApplicationDocument({
      applicationId: application3.id,
      code: "payment_receipt",
      status: DocumentStatus.REUPLOAD_REQUESTED,
      fileAssetId: receipt3.id,
      uploadedByUserId: parentUser3.id,
      adminNote: "الإيصال ناقص المعلومات البنكية.",
    }),
  ]);

  await prisma.applicationNote.createMany({
    data: [
      {
        applicationId: application1.id,
        senderUserId: admin.id,
        threadType: MessageThreadType.STUDENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.ADMIN,
        senderName: "الإدارة",
        body: "يرجى استكمال بيانات المدينة وجواز السفر للطالب.",
      },
      {
        applicationId: application1.id,
        senderUserId: parentUser1.id,
        threadType: MessageThreadType.STUDENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.PARENT,
        senderName: "خالد عبدالله العتيبي",
        body: "سيتم رفع الجواز خلال اليوم.",
      },
      {
        applicationId: application2.id,
        senderUserId: admin.id,
        threadType: MessageThreadType.STUDENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.ADMIN,
        senderName: "الإدارة",
        body: "تم استلام أغلب المستندات. جاري مراجعة الهوية.",
      },
      {
        applicationId: application2.id,
        senderUserId: parentUser2.id,
        threadType: MessageThreadType.PARENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.PARENT,
        senderName: "فهد صالح القحطاني",
        body: "تم رفع وثيقة الولاية المطلوبة.",
      },
      {
        applicationId: application3.id,
        senderUserId: admin.id,
        threadType: MessageThreadType.STUDENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.ADMIN,
        senderName: "الإدارة",
        body: "يرجى إعادة رفع الاتفاقية الموقعة وإيصال الدفع.",
      },
      {
        applicationId: application3.id,
        senderUserId: parentUser3.id,
        threadType: MessageThreadType.PARENT,
        noteType: ApplicationNoteType.MESSAGE,
        senderRole: UserRole.PARENT,
        senderName: "لولوة عبدالله الدوسري",
        body: "سيتم التحديث بعد تحويل الدفعة المتبقية.",
      },
    ],
  });

  for (const application of [application1, application2, application3]) {
    for (const template of agreementTemplates) {
      await prisma.applicationAgreement.create({
        data: {
          applicationId: application.id,
          templateId: template.id,
          title: template.title,
          contentSnapshot: template.content,
          acknowledgmentSnapshot: template.acknowledgmentText,
        },
      });
    }
  }

  console.log("Seed complete");
  console.log(`Demo password for all seeded accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
