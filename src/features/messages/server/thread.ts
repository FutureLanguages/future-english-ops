import { ApplicationNoteType, MessageThreadType, UserRole } from "@prisma/client";

type NoteRecord = {
  id: string;
  body: string;
  createdAt: Date;
  senderUserId: string;
  threadType?: MessageThreadType | null;
  noteType?: ApplicationNoteType | null;
  senderRole?: UserRole | null;
  senderName?: string | null;
  senderUser: {
    role: UserRole;
    mobileNumber: string;
  };
};

export function getUnreadNotesCount(params: {
  role: UserRole;
  notes: NoteRecord[];
  lastViewedAt: Date | null | undefined;
}) {
  return params.notes.filter((note) => {
    if ((note.noteType ?? ApplicationNoteType.MESSAGE) !== ApplicationNoteType.MESSAGE) {
      return false;
    }

    if (params.role === UserRole.ADMIN) {
      return note.senderUser.role !== UserRole.ADMIN &&
        (!params.lastViewedAt || note.createdAt > params.lastViewedAt);
    }

    return note.senderUser.role === UserRole.ADMIN &&
      (!params.lastViewedAt || note.createdAt > params.lastViewedAt);
  }).length;
}

export function getUnreadThreadNotesCount(params: {
  role: UserRole;
  threadType: MessageThreadType;
  notes: NoteRecord[];
  lastViewedAt: Date | null | undefined;
}) {
  const threadNotes = params.notes.filter(
    (note) => (note.threadType ?? MessageThreadType.STUDENT) === params.threadType,
  );

  return getUnreadNotesCount({
    role: params.role,
    notes: threadNotes,
    lastViewedAt: params.lastViewedAt,
  });
}

export function canAccessThread(params: {
  role: UserRole;
  threadType: MessageThreadType;
}) {
  if (params.threadType === MessageThreadType.STUDENT) {
    return true;
  }

  return params.role === UserRole.PARENT || params.role === UserRole.ADMIN;
}

export function getSenderDisplayName(note: NoteRecord) {
  const role = note.senderRole ?? note.senderUser.role;
  const roleLabel =
    role === UserRole.ADMIN ? "الإدارة" : role === UserRole.STUDENT ? "الطالب" : "ولي الأمر";

  return note.senderName ? `${roleLabel}: ${note.senderName}` : roleLabel;
}

export function formatThreadMessages(notes: NoteRecord[], threadType?: MessageThreadType) {
  return notes
    .filter((note) => (note.noteType ?? ApplicationNoteType.MESSAGE) === ApplicationNoteType.MESSAGE)
    .filter((note) => !threadType || (note.threadType ?? MessageThreadType.STUDENT) === threadType)
    .slice()
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt,
      threadType: note.threadType ?? MessageThreadType.STUDENT,
      senderRole: note.senderRole ?? note.senderUser.role,
      senderLabel: getSenderDisplayName(note),
      senderMobileNumber: note.senderUser.mobileNumber,
      isAdminMessage: (note.senderRole ?? note.senderUser.role) === UserRole.ADMIN,
    }));
}
