/* eslint-disable prettier/prettier */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import { URL_2 } from "@/config/urls";
import { toast } from "sonner";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSIGN_LAB_INSPECTOR,
  RECEIVE_SEED_LAB_INSPECTION,
} from "@/gql/mutations";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
  LAB_TEST_CERTIFICATE,
  LOAD_INSPECTORS,
  LOAD_SEED_LABS,
} from "@/gql/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SeedLabInspection = {
  id: string;
  user_id: string | null;
  createdBy?: { username: string | null; name?: string | null } | null;
  variety_id: string | null;
  variety?: { name: string | null } | null;
  stock_examination_id: string | null;
  collection_date: string | null;
  receipt_id: string | null;
  applicant_remark: string | null;
  inspector_id: string | null;
  inspector?: { name: string | null; username: string | null } | null;
  status: string | null;
  inspector_report: any | null;
  lab_test_report?: any | null;
  deleted: boolean;
  created_at: string | null;
  lab_test_number?: string | null;
  lot_number?: string | null;
};

interface IUserDetailsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
}

/* ---------------- helpers ---------------- */
const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
};

const formatLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const isRecord = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const flattenReportValues = (value: any) => {
  if (!isRecord(value)) return [];
  return Object.entries(value).filter(
    ([, entry]) => entry !== undefined && entry !== null && entry !== "",
  );
};

/* --- Status styles (system palette) --- */
export const STATUS = {
  ACCEPTED: {
    label: "Accepted",
    icon: "check-circle",
    badge: "bg-green-50 text-green-700 ring-1 ring-green-200",
  },
  RECOMMENDED: {
    label: "Recommended",
    icon: "verify",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  REJECTED: {
    label: "Rejected",
    icon: "cross-circle",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
  HALTED: {
    label: "Halted",
    icon: "shield-cross",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  PENDING: {
    label: "Pending",
    icon: "time",
    badge: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  },
  RECEIVED: {
    label: "Received",
    icon: "inbox-in",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  },
  ASSIGNED_INSPECTOR: {
    label: "Inspector Assigned",
    icon: "user-tick",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
  MARKETABLE: {
    label: "Marketable",
    icon: "user-tick",
    badge: "bg-green-50 text-green-700 ring-1 ring-green-200",
  },
  NOT_MARKETABLE: {
    label: "Not-Marketable",
    icon: "block",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
} as const;

export const getStatusCfg = (s?: string | null) => {
  const key = (s || "PENDING").toUpperCase() as keyof typeof STATUS;
  return STATUS[key] || STATUS.PENDING;
};

export const StatusBadge = ({ s }: { s?: string | null }) => {
  const cfg = getStatusCfg(s);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.badge}`}
    >
      <KeenIcon icon={cfg.icon} className="text-sm" />
      {cfg.label}
    </span>
  );
};

const Copy = ({ value, label }: { value?: string | null; label?: string }) => {
  if (!value) return null;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-primary hover:bg-gray-100"
      onClick={() => {
        navigator.clipboard.writeText(String(value));
        toast.success(`${label || "Value"} copied`);
      }}
      title="Copy to clipboard"
    >
      <KeenIcon icon="copy" className="text-sm" />
    </button>
  );
};

/* --- Pretty JSON viewer --- */
const JsonBlock = ({ value }: { value: any }) => {
  const [open, setOpen] = useState(true);
  const content = useMemo(() => {
    if (value == null) return null;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return typeof value === "string" ? value : String(value);
    }
  }, [value]);

  if (!content) return null;

  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <KeenIcon icon="code" />
          Inspector Report
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <KeenIcon icon={open ? "chevron-up" : "chevron-down"} />
          {open ? "Collapse" : "Expand"}
        </button>
      </div>
      {open && (
        <pre className="text-xs bg-slate-50 p-4 overflow-auto max-h-96 font-mono leading-relaxed text-slate-800">
          {content}
        </pre>
      )}
    </div>
  );
};

/* --- Reusable blocks --- */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
    {children}
  </span>
);

const StatCard = ({
  icon,
  title,
  value,
  hint,
}: {
  icon: string;
  title: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
        <KeenIcon icon={icon} className="text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </div>
        <div className="text-sm font-semibold text-gray-900 break-words">
          {value}
        </div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
    </div>
  </div>
);

const RowItem = ({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-3 py-3 last:border-b-0">
    <div className="min-w-[140px] text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </div>
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
      <div className="min-w-0 text-sm font-medium text-gray-900">{value}</div>
      {copyValue && <Copy value={copyValue} label={label} />}
    </div>
  </div>
);

const Section = ({
  title,
  icon = "element-equal",
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-md bg-gray-100 text-gray-600">
        <KeenIcon icon={icon} />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const MetricTile = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="min-w-0 rounded-md border border-gray-200 bg-white px-3 py-2">
    <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </div>
    <div className="mt-1 break-words text-sm font-semibold text-gray-900">
      {value || "—"}
    </div>
  </div>
);

const ReportSummary = ({ report }: { report: Record<string, any> }) => (
  <div className="space-y-3">
    {Object.entries(report).map(([category, values]) => {
      const entries = flattenReportValues(values);
      if (entries.length === 0) return null;

      return (
        <div
          key={category}
          className="rounded-lg border border-gray-200 bg-gray-50/60 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-gray-900">
              {formatLabel(category)}
            </h4>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200">
              {entries.length} fields
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <MetricTile
                key={key}
                label={formatLabel(key)}
                value={String(value)}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/* ---------------- component ---------------- */
const SeedLabDetailsDialog = ({
  open,
  onOpenChange,
  data,
}: IUserDetailsDialogProps<SeedLabInspection>) => {
  const d = data as SeedLabInspection | undefined;
  const apolloClient = useApolloClient();

  const [action, setAction] = useState<
    | "assign_inspector"
    | "halt"
    | "reject"
    | "recommend"
    | "receive_sample"
    | "reject_sample"
    | ""
  >("");
  const [inspector, setInspector] = useState("");
  const [comment, setComment] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const { auth, currentUser } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms["can_assign_inspector"];
  const canPerfomLabTest = !!perms["can_perform_seed_lab_tests"];

  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
    refetch: refetchInspectors,
  } = useQuery<{ inspectors: any[] }>(LOAD_INSPECTORS, { skip: !open });
  const inspectors = inspectorsData?.inspectors ?? [];

  const [assignInspector, { loading: assigning }] = useMutation(
    ASSIGN_LAB_INSPECTOR,
    {
      refetchQueries: [{ query: LOAD_SEED_LABS }],
      awaitRefetchQueries: true,
    },
  );

  const [receiveRequest, { loading: receiving }] = useMutation(
    RECEIVE_SEED_LAB_INSPECTION,
    {
      refetchQueries: [{ query: LOAD_SEED_LABS }],
      awaitRefetchQueries: true,
    },
  );

  const permittedActions = useMemo(
    () =>
      [
        {
          value: "assign_inspector" as const,
          label: "Assign Inspector",
          allowed: canAssignInspector,
        },
      ].filter((a) => a.allowed),
    [canAssignInspector],
  );

  // Reception actions shown when status is "accepted"
  const receptionActions = useMemo(
    () =>
      d?.status === "accepted"
        ? [
            { value: "receive_sample" as const, label: "Receive Sample" },
            { value: "reject_sample" as const, label: "Reject Reception" },
          ]
        : [],
    [d?.status],
  );

  const isActionPermitted =
    permittedActions.some((a) => a.value === action) ||
    receptionActions.some((a) => a.value === action);

  // require comment when receiving/rejecting sample
  const isConfirmDisabled =
    !action ||
    (action === "assign_inspector" && !inspector) ||
    ((action === "receive_sample" || action === "reject_sample") &&
      !comment.trim()) ||
    !isActionPermitted;

  // show comment input for reception actions (and existing status-based flows)
  const showCommentInput =
    action === "halt" ||
    action === "reject" ||
    action === "recommend" ||
    action === "receive_sample" ||
    action === "reject_sample" ||
    d?.status === "assigned_inspector" ||
    d?.status === "inspector_assigned";

  const handleConfirm = async () => {
    setAssignError(null);

    // Assign inspector flow
    if (action === "assign_inspector") {
      try {
        const res = await assignInspector({
          variables: {
            input: { form_id: String(d?.id ?? ""), inspector_id: inspector },
          },
        });
        const payload = res?.data && Object.values(res.data)[0];
        const ok = payload?.success;
        if (!ok) {
          setAssignError(payload?.message || "Failed to assign inspector");
          toast("Failed to assign inspector", {
            description: payload?.message || "Unknown error",
          });
          return;
        }
        toast(payload?.message || "Inspector assigned successfully");
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || "Failed to assign inspector");
        toast("Failed to assign inspector", {
          description: e?.message || "Unknown error",
        });
      }
      return;
    }

    // Reception flow (receive or reject)
    if (action === "receive_sample" || action === "reject_sample") {
      try {
        const decision = action === "receive_sample" ? "received" : "halted";
        const successMessage =
          action === "receive_sample"
            ? "Sample received"
            : "Reception rejected";
        const res = await receiveRequest({
          variables: {
            input: {
              id: String(d?.id ?? ""),
              decision,
              receptionist_comment: comment,
            },
          },
        });
        const payload = res?.data && Object.values(res.data)[0];
        const ok = payload?.success;
        if (!ok) {
          setAssignError(payload?.message || "Failed to perform reception");
          toast("Failed to update reception", {
            description: payload?.message || "Unknown error",
          });
          return;
        }
        toast(payload?.message || successMessage);
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || "Failed to perform reception");
        toast("Failed to update reception", {
          description: e?.message || "Unknown error",
        });
      }
      return;
    }

    onOpenChange(false);
  };

  /* ----- Visibility for "Open lab test" button ----- */
  const statusLower = (d?.status || "").toLowerCase();
  const isInspectorAssigned =
    statusLower === "inspector_assigned" ||
    statusLower === "assigned_inspector";
  const isReceivedbyLab = statusLower === "received";

  const meIsInspector =
    !!currentUser &&
    !!d?.inspector_id &&
    (String(d.inspector_id) === String((currentUser as any).id) ||
      (!!d.inspector?.username &&
        !!(currentUser as any).username &&
        d.inspector.username === (currentUser as any).username));

  const meIsTechnician = !!currentUser && canPerfomLabTest;

  const showOpenInspection = !!d?.id && isInspectorAssigned && meIsInspector;
  const showOpenlabtest = !!d?.id && isReceivedbyLab && meIsTechnician;
  const inspectionPath = `/qa/labs/${d?.id}/inspection`;
  const labTestPath = `/qa/labs/${d?.id}/test`;
  const canPrintCertificate = ["marketable", "not_marketable"].includes(
    statusLower,
  );

  const handlePrintCertificate = async () => {
    if (!d?.id) return;

    try {
      const { data: certificateData } = await apolloClient.query<{
        labTestCertificate?: { html?: string };
      }>({
        query: LAB_TEST_CERTIFICATE,
        variables: { id: String(d.id) },
        fetchPolicy: "network-only",
      });
      const html = certificateData?.labTestCertificate?.html;
      if (!html) throw new Error("Certificate HTML was not returned");

      const popup = window.open(
        "",
        "_blank",
        "width=1000,height=800,scrollbars=yes,resizable=yes",
      );
      if (!popup) {
        toast.error(
          "Unable to open certificate window. Please allow pop-ups and try again.",
        );
        return;
      }
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    } catch (e: any) {
      toast.error("Failed to generate certificate", {
        description: e?.message || "Unknown error",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col bg-gray-50 p-0 sm:max-w-[760px]"
      >
        <SheetHeader className="border-b bg-white px-6 pb-5 pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <SheetTitle className="flex min-w-0 items-center gap-3 text-xl text-gray-900">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                <KeenIcon icon="flask" className="text-xl" />
              </div>
              <span className="truncate">Seed Lab Inspection</span>
            </SheetTitle>
            {d && <StatusBadge s={d.status} />}
          </div>

          {d && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Pill>
                <KeenIcon icon="fingerprint-scanning" />
                ID {d.id}
              </Pill>
              {d.lab_test_number && (
                <Pill>
                  <KeenIcon icon="document" />
                  {d.lab_test_number}
                </Pill>
              )}
              {d.lot_number && (
                <Pill>
                  <KeenIcon icon="parcel" />
                  Lot {d.lot_number}
                </Pill>
              )}
              <Pill>
                <KeenIcon icon="calendar-tick" />
                {formatDate(d.created_at)}
              </Pill>
              {d.deleted && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 ring-1 ring-rose-200">
                  <KeenIcon icon="information" />
                  Deleted
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {!d ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <KeenIcon icon="file-deleted" className="text-5xl mb-3" />
              <p className="text-sm font-medium">No record selected</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  icon="test-tubes"
                  title="Variety"
                  value={d.variety?.name || "Not specified"}
                />
                <StatCard
                  icon="user-tick"
                  title="Inspector"
                  value={
                    d.inspector?.username || d.inspector?.name || "Not assigned"
                  }
                />
                <StatCard
                  icon="calendar-2"
                  title="Collection Date"
                  value={formatDate(d.collection_date)}
                  hint={timeAgo(d.created_at)}
                />
              </div>

              <Section title="Record Details" icon="element-equal">
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <RowItem
                    label="Status"
                    value={<StatusBadge s={d.status} />}
                  />
                  <RowItem
                    label="Lab Test No."
                    value={
                      <span className="font-mono text-xs">
                        {d.lab_test_number || "—"}
                      </span>
                    }
                    copyValue={d.lab_test_number || undefined}
                  />
                  <RowItem
                    label="Lot Number"
                    value={
                      <span className="font-mono text-xs">
                        {d.lot_number || "—"}
                      </span>
                    }
                    copyValue={d.lot_number || undefined}
                  />
                  <RowItem
                    label="Applicant"
                    value={
                      <span>
                        {d.createdBy?.name || d.createdBy?.username || "—"}
                      </span>
                    }
                    copyValue={d.createdBy?.username || undefined}
                  />
                  <RowItem
                    label="Stock Examination"
                    value={
                      <span className="font-mono text-xs">
                        {d.stock_examination_id || "—"}
                      </span>
                    }
                    copyValue={d.stock_examination_id || undefined}
                  />
                  {d.receipt_id && (
                    <RowItem
                      label="Receipt"
                      value={
                        <a
                          href={`${URL_2}/receipts/${d.receipt_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline"
                        >
                          <KeenIcon icon="document" />
                          View Receipt
                          <KeenIcon icon="arrow-up-right" className="text-xs" />
                        </a>
                      }
                    />
                  )}
                </div>
              </Section>

              {d.applicant_remark && (
                <Section title="Applicant Remarks" icon="document">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {d.applicant_remark}
                    </p>
                  </div>
                </Section>
              )}

              {d.inspector_report && (
                <Section title="Inspection Summary" icon="document">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Object.entries(d.inspector_report).map(
                        ([key, value]) => (
                          <MetricTile
                            key={key}
                            label={formatLabel(key)}
                            value={String(value)}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </Section>
              )}

              {d.lab_test_report && (
                <Section title="Lab Test Summary" icon="test-tube">
                  <ReportSummary report={d.lab_test_report} />
                </Section>
              )}

              <div className="space-y-4">
                {permittedActions.length > 0 &&
                  (d.status === "pending" ||
                    d.status === "recommended" ||
                    d.status === "assigned_inspector" ||
                    d.status === "inspector_assigned") && (
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <KeenIcon icon="setting-2" />
                      Take Action
                    </div>
                  )}

                {permittedActions.length > 0 &&
                  (d.status === "pending" ||
                    d.status === "recommended" ||
                    d.status === "assigned_inspector" ||
                    d.status === "inspector_assigned") && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {permittedActions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 ${
                            action === opt.value
                              ? "border-primary text-primary"
                              : "border-gray-200 text-gray-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name="lab-action"
                            value={opt.value}
                            checked={action === opt.value}
                            onChange={() => setAction(opt.value)}
                            className="text-primary-600"
                          />
                          <span className="text-sm font-semibold">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                {receptionActions.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <KeenIcon icon="inbox-in" />
                      Reception
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {receptionActions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50 ${
                            action === opt.value
                              ? "border-primary text-primary"
                              : "border-gray-200 text-gray-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name="lab-action"
                            value={opt.value}
                            checked={action === opt.value}
                            onChange={() => setAction(opt.value)}
                            className="text-primary-600"
                          />
                          <span className="text-sm font-semibold">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {action === "assign_inspector" && (
                  <div className="max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <label className="form-label text-sm">
                      Select Inspector
                    </label>
                    {inspectorsError && (
                      <div className="text-xs text-red-600 mb-2 flex items-center gap-2">
                        Failed to load inspectors.
                        <button
                          className="btn btn-xs btn-light"
                          onClick={() => refetchInspectors()}
                        >
                          <KeenIcon icon="arrow-rotate-right" /> Retry
                        </button>
                      </div>
                    )}
                    <Select
                      value={inspector}
                      onValueChange={(v) => {
                        setInspector(v);
                        setAssignError(null);
                      }}
                      disabled={
                        inspectorsLoading || !!inspectorsError || assigning
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            inspectorsLoading
                              ? "Loading inspectors…"
                              : "Choose inspector"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="w-full border-gray-300">
                        {inspectorsLoading && (
                          <SelectItem value="__loading" disabled>
                            Loading…
                          </SelectItem>
                        )}
                        {inspectorsError && (
                          <SelectItem value="__error" disabled>
                            Failed to load inspectors
                          </SelectItem>
                        )}
                        {!inspectorsLoading &&
                          !inspectorsError &&
                          inspectors.length === 0 && (
                            <SelectItem value="__none" disabled>
                              No inspectors found
                            </SelectItem>
                          )}
                        {inspectors.map((ins: any) => (
                          <SelectItem key={ins.id} value={String(ins.id)}>
                            {ins.name ||
                              ins.username ||
                              ins.company_initials ||
                              "Unknown"}
                            {ins.district ? ` (${ins.district})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignError && (
                      <div className="text-xs text-red-600 mt-2">
                        {assignError}
                      </div>
                    )}
                  </div>
                )}

                {(action === "halt" ||
                  action === "reject" ||
                  action === "recommend" ||
                  action === "receive_sample" ||
                  action === "reject_sample" ||
                  d.status === "assigned_inspector" ||
                  d.status === "inspector_assigned") &&
                  (d.status === "pending" ||
                    d.status === "recommended" ||
                    d.status === "assigned_inspector" ||
                    d.status === "inspector_assigned") && (
                    <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <label className="form-label text-sm">
                        Status comment
                      </label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Provide a reason for ${action || "this update"}…`}
                        disabled={assigning}
                      />
                    </div>
                  )}
                {showCommentInput &&
                  (d.status === "pending" ||
                    d.status === "recommended" ||
                    d.status === "assigned_inspector" ||
                    d.status === "inspector_assigned" ||
                    d.status === "accepted") && (
                    <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <label className="form-label text-sm">
                        Status comment
                      </label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Provide a reason for ${action || "this update"}…`}
                        disabled={assigning || receiving}
                      />
                    </div>
                  )}
              </div>
            </>
          )}
        </div>

        <div className="border-t bg-white px-6 py-4">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="light"
              onClick={() => onOpenChange(false)}
              className="px-5"
            >
              <KeenIcon icon="cross" />
              Close
            </Button>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {showOpenInspection && (
                <Link to={inspectionPath} onClick={() => onOpenChange(false)}>
                  <Button>
                    <KeenIcon icon="geolocation" /> Open Examination
                  </Button>
                </Link>
              )}
              {showOpenlabtest && (
                <Link to={labTestPath} onClick={() => onOpenChange(false)}>
                  <Button>
                    <KeenIcon icon="test-tube" /> Open Lab Test
                  </Button>
                </Link>
              )}
              {canPrintCertificate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintCertificate}
                >
                  <KeenIcon icon="printer" /> View / Print Certificate
                </Button>
              )}
              {receptionActions.length > 0 && (
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirmDisabled || receiving}
                >
                  <KeenIcon icon="tick-square" />
                  {action === "receive_sample"
                    ? " Receive Sample"
                    : action === "reject_sample"
                      ? " Reject Reception"
                      : " Confirm"}
                </Button>
              )}

              {/* Confirm Action (assign inspector) */}
              {permittedActions.length > 0 &&
                (d?.status === "pending" ||
                  d?.status === "assigned_inspector" ||
                  d?.status === "inspector_assigned") && (
                  <Button
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled || assigning}
                  >
                    <KeenIcon icon="tick-square" />
                    {action === "assign_inspector" && assigning
                      ? " Assigning…"
                      : " Confirm Action"}
                  </Button>
                )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { SeedLabDetailsDialog };
