import Image from "next/image";
import clsx from "clsx";

export function InstitutionLogo({
  size = "md",
  showName = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const logoClasses = {
    sm: "h-10 w-auto",
    md: "h-14 w-auto",
    lg: "h-16 w-auto",
  };

  return (
    <div className={clsx("inline-flex items-center gap-3", className)}>
      <Image
        src="/logo.svg"
        alt="شعار مؤسسة مستقبل اللغات"
        width={454}
        height={557}
        priority={size === "lg"}
        className={clsx("shrink-0 object-contain", logoClasses[size])}
      />
      {showName ? (
        <div className="leading-tight">
          <div className="text-sm font-bold text-ink md:text-base">مؤسسة مستقبل اللغات</div>
          <div className="mt-0.5 text-xs font-medium text-ink/50">Future Languages</div>
        </div>
      ) : null}
    </div>
  );
}
