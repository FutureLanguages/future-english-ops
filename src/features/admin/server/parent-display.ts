const pendingParentPrefix = "pending-parent-";

export function isPlaceholderParentMobile(value: string | null | undefined) {
  return Boolean(value?.startsWith(pendingParentPrefix));
}

export function resolveParentMobileDisplay(params: {
  parentUserMobileNumber: string | null | undefined;
  parentProfiles?: Array<{
    mobileNumber?: string | null;
  }>;
}) {
  if (params.parentUserMobileNumber && !isPlaceholderParentMobile(params.parentUserMobileNumber)) {
    return params.parentUserMobileNumber;
  }

  const profileMobile = params.parentProfiles
    ?.map((profile) => profile.mobileNumber?.trim())
    .find((mobile): mobile is string => Boolean(mobile));

  return profileMobile ?? "لم يتم ربط ولي الأمر بعد";
}
