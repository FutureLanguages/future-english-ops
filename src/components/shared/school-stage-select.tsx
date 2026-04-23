"use client";

import { useMemo, useState } from "react";

const primaryStages = [
  "المرحلة الابتدائية",
  "المرحلة المتوسطة",
  "المرحلة الثانوية",
  "المرحلة الجامعية",
  "متخرج",
  "موظف",
  "لا أعمل",
];

const gradeOptions: Record<string, string[]> = {
  "المرحلة الابتدائية": [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
  ],
  "المرحلة المتوسطة": [
    "الصف الأول المتوسط",
    "الصف الثاني المتوسط",
    "الصف الثالث المتوسط",
  ],
  "المرحلة الثانوية": [
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ],
};

function normalizeLegacyValue(value: string) {
  if (value === "مرحلة جامعية") {
    return "المرحلة الجامعية";
  }

  return value;
}

function resolveInitialSelection(value: string) {
  const normalized = normalizeLegacyValue(value);

  for (const [stage, grades] of Object.entries(gradeOptions)) {
    if (grades.includes(normalized)) {
      return { primaryStage: stage, grade: normalized };
    }
  }

  if (primaryStages.includes(normalized)) {
    return { primaryStage: normalized, grade: "" };
  }

  return { primaryStage: "", grade: "" };
}

export function SchoolStageSelect({
  value,
  name = "schoolStage",
}: {
  value: string;
  name?: string;
}) {
  const initial = useMemo(() => resolveInitialSelection(value), [value]);
  const [primaryStage, setPrimaryStage] = useState(initial.primaryStage);
  const [grade, setGrade] = useState(initial.grade);
  const availableGrades = primaryStage ? gradeOptions[primaryStage] ?? [] : [];
  const finalValue = availableGrades.length > 0 ? grade || primaryStage : primaryStage || normalizeLegacyValue(value);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={finalValue} />
      <select
        value={primaryStage}
        onChange={(event) => {
          setPrimaryStage(event.target.value);
          setGrade("");
        }}
        className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
      >
        <option value="">اختر المرحلة الدراسية</option>
        {primaryStages.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
      {availableGrades.length > 0 ? (
        <select
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
          className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
        >
          <option value="">اختر الصف</option>
          {availableGrades.map((stageGrade) => (
            <option key={stageGrade} value={stageGrade}>
              {stageGrade}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
