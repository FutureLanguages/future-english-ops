import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const operator = {
  telegramUserId: "6538185234",
  displayName: "Admin",
  role: "ADMIN",
  status: "ACTIVE",
  linkedAdminUserId: "cmou1b8ae0000tb5prdj8pxnq",
  permissions: [
    "CREATE_STUDENT_ACCOUNT",
    "RESET_STUDENT_PASSWORD",
    "UPLOAD_PASSPORT",
    "SEARCH_STUDENT",
    "UPDATE_STUDENT_PROFILE",
  ],
};

async function main() {
  const adminUser = await prisma.user.findUnique({
    where: {
      id: operator.linkedAdminUserId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!adminUser) {
    throw new Error(`Linked admin user not found: ${operator.linkedAdminUserId}`);
  }

  if (adminUser.role !== UserRole.ADMIN || !adminUser.isActive) {
    throw new Error(
      `Linked user must be an active ADMIN. Found role=${adminUser.role}, isActive=${adminUser.isActive}`,
    );
  }

  const result = await prisma.botOperator.upsert({
    where: {
      telegramUserId: operator.telegramUserId,
    },
    create: operator,
    update: {
      displayName: operator.displayName,
      role: operator.role,
      status: operator.status,
      linkedAdminUserId: operator.linkedAdminUserId,
      permissions: operator.permissions,
    },
    select: {
      id: true,
      telegramUserId: true,
      displayName: true,
      role: true,
      status: true,
      linkedAdminUserId: true,
      permissions: true,
      updatedAt: true,
    },
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error("UPSERT_BOT_OPERATOR_FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
