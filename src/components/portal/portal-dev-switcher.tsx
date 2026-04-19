import Link from "next/link";
import clsx from "clsx";
import type { PortalDevUserOption } from "@/types/portal";

export function PortalDevSwitcher({
  users,
  currentUserId,
}: {
  users: PortalDevUserOption[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-dashed border-pine/20 bg-mist/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-pine/70">
          Dev Session
        </span>
        <span className="text-xs text-ink/55">تبديل سريع بين المستخدمين التجريبيين</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {users.map((user) => {
          const active = user.id === currentUserId;

          return (
            <Link
              key={user.id}
              href={`/portal/dev/switch?userId=${user.id}&returnTo=/portal/dashboard`}
              className={clsx(
                "rounded-full px-3 py-2 text-xs font-semibold transition",
                active ? "bg-pine text-white" : "bg-white text-ink hover:bg-sand",
              )}
            >
              {user.label} - {user.mobileNumber}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
