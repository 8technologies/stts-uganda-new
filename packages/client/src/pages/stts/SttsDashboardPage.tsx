import { useMemo } from "react";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useQuery } from "@apollo/client/react";
import { formatDistanceToNow } from "date-fns";

import { Container } from "@/components/container";
import { Toolbar, ToolbarHeading } from "@/layouts/demo1/toolbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components/keenicons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { DASHBOARD_STATS, ME } from "@/gql/queries";
import { cn } from "@/lib/utils";
import { FolderInput } from "lucide-react";
import { getPermissionsFromToken } from "@/utils/permissions";
import { useAuthContext } from "@/auth";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }
  return numberFormatter.format(value);
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch (error) {
    return "—";
  }
};

type DashboardInspectionSlice = {
  label: string;
  value: number;
};

type DashboardSeedStockPoint = {
  label: string;
  total: number;
};

type DashboardActivity = {
  id: string;
  title: string;
  entity?: string | null;
  status?: string | null;
  category?: string | null;
  timestamp?: string | null;
};

type DashboardStatsResponse = {
  registeredUsers: number;
  userPermits: number;
  pendingPermits: number;
  cropDeclarations: number;
  printedLabels: number;
  pendingLabels: number;
  myActiveForms: number;
  myActivePermits: number;
  myApprovedPlantingReturns: number;
  assignedForms: number;
  assignedPermits: number;
  assignedPlantingReturns: number;
  pendingInspections: number;
  receivedLabRequests: number;
  haltedLabRequests: number;
  marketableSeed: number;
  nonMarketableSeed: number;
  totalInspections: number;
  scheduledVisits: number;
  pendingCorrectiveActions: number;
  inspections: DashboardInspectionSlice[];
  seedStock: DashboardSeedStockPoint[];
  recentActivities: DashboardActivity[];
};

type DashboardStatsQuery = {
  dashboardStats: DashboardStatsResponse;
};

type CurrentUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  company_initials?: string | null;
};

type MeQuery = {
  me: CurrentUser | null;
};

type DashboardMetricKey = keyof Pick<
  DashboardStatsResponse,
  | "registeredUsers"
  | "userPermits"
  | "cropDeclarations"
  | "printedLabels"
  | "myActiveForms"
  | "myActivePermits"
  | "myApprovedPlantingReturns"
  | "assignedForms"
  | "assignedPermits"
  | "assignedPlantingReturns"
  | "pendingInspections"
  | "receivedLabRequests"
  | "haltedLabRequests"
  | "marketableSeed"
  | "nonMarketableSeed"
>;

type StatCardConfig = {
  key: DashboardMetricKey;
  title: string;
  description: string;
  icon: string;
  cardClass: string;
  valueClass: string;
  titleClass: string;
  descriptionClass: string;
  iconClass: string;
  chipClass: string;
  defaultFootnote?: string;
  getFootnote?: (stats?: DashboardStatsResponse) => string | null;
};

const fallbackSeedStock: DashboardSeedStockPoint[] = [
  { label: "Q1", total: 0 },
  { label: "Q2", total: 0 },
  { label: "Q3", total: 0 },
  { label: "Q4", total: 0 },
];

const fallbackInspectionSlices: DashboardInspectionSlice[] = [
  { label: "Completed", value: 0 },
  { label: "Pending", value: 0 },
  { label: "Skipped", value: 0 },
];

const inspectionColors: Record<string, string> = {
  Completed: "#00A651",
  Pending: "#6CC24A",
  Skipped: "#C5DA4B",
};

const activityCategoryColors: Record<string, string> = {
  Permits: "bg-emerald-500",
  Inspections: "bg-lime-500",
  Logistics: "bg-sky-500",
  Stock: "bg-amber-500",
};

const managementStatCards: StatCardConfig[] = [
  {
    key: "registeredUsers",
    title: "Registered Users",
    description: "Authorized individuals or organizations",
    icon: "users",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-900",
    valueClass: "text-emerald-900",
    titleClass: "text-emerald-900",
    descriptionClass: "text-emerald-700",
    iconClass: "bg-white text-emerald-600",
    chipClass: "text-emerald-700",
    defaultFootnote: "System-wide total",
  },
  {
    key: "userPermits",
    title: "User Permits",
    description: "Official approvals for imports and export permits",
    icon: "security-user",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100 text-amber-900",
    valueClass: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-700",
    iconClass: "bg-white text-amber-600",
    chipClass: "text-amber-700",
    getFootnote: (stats) =>
      stats && stats.pendingPermits != null
        ? `${formatNumber(stats.pendingPermits)} pending reviews`
        : "Pending reviews",
  },
  {
    key: "cropDeclarations",
    title: "Crop Declarations",
    description: "Crop declarations from seed producers",
    icon: "leaf",
    cardClass:
      "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 text-sky-900",
    valueClass: "text-sky-900",
    titleClass: "text-sky-900",
    descriptionClass: "text-sky-700",
    iconClass: "bg-white text-sky-600",
    chipClass: "text-sky-700",
    defaultFootnote: "Includes active QDS filings",
  },
  {
    key: "printedLabels",
    title: "Printed Labels",
    description: "Approved and pending seed labels",
    icon: "printer",
    cardClass:
      "border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-100",
    valueClass: "text-white",
    titleClass: "text-white/90",
    descriptionClass: "text-white/80",
    iconClass: "bg-white/20 text-white",
    chipClass: "text-white/90",
    getFootnote: (stats) =>
      stats && stats.pendingLabels != null
        ? `${formatNumber(stats.pendingLabels)} awaiting print`
        : "Awaiting print",
  },
];

const printedLabelsCard = managementStatCards.find(
  (card) => card.key === "printedLabels",
)!;

const ownStatCards: StatCardConfig[] = [
  {
    key: "myActiveForms",
    title: "My Active Forms",
    description: "Forms submitted that are awaiting review",
    icon: "document",
    cardClass:
      "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 text-sky-900",
    valueClass: "text-sky-900",
    titleClass: "text-sky-900",
    descriptionClass: "text-sky-700",
    iconClass: "bg-white text-sky-600",
    chipClass: "text-sky-700",
    defaultFootnote: "Pending commissioner action",
  },
  {
    key: "myActivePermits",
    title: "My Active Permits",
    description: "Import or export permits still in progress",
    icon: "security-user",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100 text-amber-900",
    valueClass: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-700",
    iconClass: "bg-white text-amber-600",
    chipClass: "text-amber-700",
    defaultFootnote: "Awaiting QA decision",
  },
  {
    key: "myApprovedPlantingReturns",
    title: "Approved SR8 Returns",
    description: "Planting returns cleared by QA",
    icon: "badge",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-900",
    valueClass: "text-emerald-900",
    titleClass: "text-emerald-900",
    descriptionClass: "text-emerald-700",
    iconClass: "bg-white text-emerald-600",
    chipClass: "text-emerald-700",
    defaultFootnote: "SR8 approvals",
  },
  { ...printedLabelsCard },
];

const assignedStatCards: StatCardConfig[] = [
  {
    key: "assignedForms",
    title: "Assigned Forms",
    description: "Application forms awaiting your action",
    icon: "task",
    cardClass:
      "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-100 text-purple-900",
    valueClass: "text-purple-900",
    titleClass: "text-purple-900",
    descriptionClass: "text-purple-700",
    iconClass: "bg-white text-purple-600",
    chipClass: "text-purple-700",
    defaultFootnote: "SR4 / SR6 / QDS",
  },
  {
    key: "assignedPermits",
    title: "Assigned Permits",
    description: "Permit inspections delegated to you",
    icon: "shield-search",
    cardClass:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-200 text-amber-900",
    valueClass: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-700",
    iconClass: "bg-white text-amber-600",
    chipClass: "text-amber-700",
    defaultFootnote: "QA pending",
  },
  {
    key: "assignedPlantingReturns",
    title: "Assigned SR8s",
    description: "Planting returns queued for inspection",
    icon: "chart-line",
    cardClass:
      "border-lime-100 bg-gradient-to-br from-lime-50 via-white to-lime-100 text-lime-900",
    valueClass: "text-lime-900",
    titleClass: "text-lime-900",
    descriptionClass: "text-lime-700",
    iconClass: "bg-white text-lime-600",
    chipClass: "text-lime-700",
    defaultFootnote: "Schedule visits",
  },
  {
    key: "pendingInspections",
    title: "Pending Inspections",
    description: "Stock examinations not yet submitted",
    icon: "information-3",
    cardClass:
      "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900",
    valueClass: "text-slate-900",
    titleClass: "text-slate-900",
    descriptionClass: "text-slate-600",
    iconClass: "bg-white text-slate-500",
    chipClass: "text-slate-600",
    defaultFootnote: "Awaiting reports",
  },
];

const labStatCards: StatCardConfig[] = [
  {
    key: "receivedLabRequests",
    title: "Received Lab Requests",
    description: "Samples logged at the laboratory",
    icon: "flask",
    cardClass:
      "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 text-sky-900",
    valueClass: "text-sky-900",
    titleClass: "text-sky-900",
    descriptionClass: "text-sky-700",
    iconClass: "bg-white text-sky-600",
    chipClass: "text-sky-700",
    defaultFootnote: "Awaiting testing",
  },
  {
    key: "haltedLabRequests",
    title: "Halted Lab Requests",
    description: "Samples flagged or rejected",
    icon: "shield-cross",
    cardClass:
      "border-red-100 bg-gradient-to-br from-red-50 via-white to-red-100 text-red-900",
    valueClass: "text-red-900",
    titleClass: "text-red-900",
    descriptionClass: "text-red-700",
    iconClass: "bg-white text-red-600",
    chipClass: "text-red-700",
    defaultFootnote: "Requires attention",
  },
  {
    key: "marketableSeed",
    title: "Marketable Seed",
    description: "Lots cleared as marketable",
    icon: "leaf",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-900",
    valueClass: "text-emerald-900",
    titleClass: "text-emerald-900",
    descriptionClass: "text-emerald-700",
    iconClass: "bg-white text-emerald-600",
    chipClass: "text-emerald-700",
    defaultFootnote: "Ready for release",
  },
  {
    key: "nonMarketableSeed",
    title: "Non Marketable Seed",
    description: "Lots flagged as non compliant",
    icon: "close-circle",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100 text-amber-900",
    valueClass: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-700",
    iconClass: "bg-white text-amber-600",
    chipClass: "text-amber-700",
    defaultFootnote: "Requires remediation",
  },
];

type DashboardVariant = "management" | "own" | "assigned" | "lab";

const determineDashboardVariant = (
  permissions: Record<string, boolean>,
): DashboardVariant => {
  const hasLabScope =
    permissions?.can_receive_seed_lab_inspections ||
    // permissions?.can_view_seed_lab_inspections ||
    // permissions?.can_manage_seed_lab_inspection ||
    permissions?.can_perform_seed_lab_tests;

  const hasAssignedScope =
    permissions?.can_view_specific_assigned_forms ||
    permissions?.can_view_only_assigned_permits ||
    permissions?.can_view_only_assigned_planting_returns ||
    permissions?.can_view_only_assigned_seed_stock;

  const canSeeOwnForms =
    permissions?.can_view_only_own_created_forms &&
    (permissions?.can_view_import_permits ||
      permissions?.can_manage_import_permits) &&
    !hasAssignedScope;

  if (hasLabScope) return "lab";
  if (hasAssignedScope) return "assigned";
  if (canSeeOwnForms) return "own";
  return "management";
};

const STAT_CARD_VARIANT_MAP: Record<DashboardVariant, StatCardConfig[]> = {
  management: managementStatCards,
  own: ownStatCards,
  assigned: assignedStatCards,
  lab: labStatCards,
};

const seedStockTags = [
  { label: "Foundation seed", value: "22k bags", color: "#047857" },
  { label: "Certified lots", value: "18k bags", color: "#0EA5E9" },
  { label: "Breeder seed", value: "6k bags", color: "#F59E0B" },
];

const activityFilters = [
  { label: "All updates", value: "32" },
  { label: "Permits", value: "14" },
  { label: "Inspections", value: "9" },
  { label: "Logistics", value: "9" },
];

const calendarInsights = [
  { label: "Inspections due", value: "4", meta: "Teams dispatched" },
  { label: "Permit reviews", value: "2", meta: "Awaiting approval" },
];

const calendarMeta = {
  monthIndex: 2,
  monthLabel: "March",
  year: 2025,
  selectedDay: 13,
};

const StatCard = ({
  config,
  stats,
  loading,
}: {
  config: StatCardConfig;
  stats?: DashboardStatsResponse;
  loading: boolean;
}) => {
  const value = stats?.[config.key];
  const footnote = config.getFootnote?.(stats) ?? config.defaultFootnote;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition hover:shadow-md",
        config.cardClass,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              config.titleClass,
            )}
          >
            {config.title}
          </p>
          <p
            className={cn("mt-2 text-sm leading-snug", config.descriptionClass)}
          >
            {config.description}
          </p>
        </div>
        <span
          className={cn("rounded-full p-3 text-lg", config.iconClass)}
          aria-hidden="true"
        >
          <KeenIcon icon={config.icon} />
        </span>
      </div>
      <div
        className={cn(
          "mt-5 text-4xl font-semibold leading-none",
          config.valueClass,
        )}
      >
        {loading ? (
          <Skeleton className="h-10 w-24 bg-white/60" />
        ) : (
          formatNumber(value)
        )}
      </div>
      {footnote && (
        <p className={cn("mt-4 text-xs font-medium", config.chipClass)}>
          {footnote}
        </p>
      )}
    </div>
  );
};

const SttsDashboardPage = () => {
  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch,
  } = useQuery<DashboardStatsQuery>(DASHBOARD_STATS, {
    fetchPolicy: "cache-and-network",
  });
  const { data: meData } = useQuery<MeQuery>(ME, {
    fetchPolicy: "cache-first",
  });
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);

  console.log("User permissions:", perms);

  const dashboardVariant = determineDashboardVariant(perms);
  const visibleStatCards =
    STAT_CARD_VARIANT_MAP[dashboardVariant] ?? managementStatCards;

  const stats = statsData?.dashboardStats;
  const welcomeName =
    meData?.me?.name || meData?.me?.username || "Commissioner";
  const inspectionSlices = stats?.inspections?.length
    ? stats.inspections
    : fallbackInspectionSlices;
  const seedStockPoints = stats?.seedStock?.length
    ? stats.seedStock
    : fallbackSeedStock;
  const inspectionTotal = inspectionSlices.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );
  const selectedDate = useMemo(
    () =>
      new Date(
        calendarMeta.year,
        calendarMeta.monthIndex,
        calendarMeta.selectedDay,
      ),
    [],
  );

  const inspectionChartOptions: ApexOptions = {
    chart: { type: "donut", sparkline: { enabled: true } },
    labels: inspectionSlices.map((slice) => slice.label),
    colors: inspectionSlices.map(
      (slice) => inspectionColors[slice.label] ?? "#047857",
    ),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: { show: false },
        },
      },
    },
  };

  const seedStockChartOptions: ApexOptions = {
    chart: { type: "bar", sparkline: { enabled: true } },
    colors: ["#16a34a"],
    stroke: { show: true, width: 2, colors: ["transparent"] },
    grid: { strokeDashArray: 4 },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "40%",
      },
    },
    xaxis: {
      categories: seedStockPoints.map((point) => point.label),
      labels: { style: { colors: "#94a3b8" } },
    },
    yaxis: {
      labels: { style: { colors: "#94a3b8" } },
    },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val) => `${val} tons` } },
  };

  const activityList = stats?.recentActivities ?? [];
  const showActivitiesEmpty = !statsLoading && activityList.length === 0;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="NATIONAL SEED TRACKING AND TRACING SYSTEM"
            description={`Welcome, ${welcomeName}. Real-time monitoring of seed movement from production to distribution.`}
          />
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* <div className="relative flex-1 sm:w-72">
              <KeenIcon
                icon="search-list"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <Input
                type="search"
                placeholder="Search dashboard"
                aria-label="Search dashboard"
                className="pl-10"
              />
            </div> */}
            <Button type="button" variant="outline" className="gap-2">
              <FolderInput />
              Export files
            </Button>
          </div>
        </Toolbar>
      </Container>
      <Container>
        <div className="space-y-8">
          {statsError && (
            <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <KeenIcon
                icon="information-3"
                className="text-red-500"
                aria-hidden="true"
              />
              <div className="flex-1">
                Unable to load the dashboard summary right now. Please try
                again.
              </div>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {visibleStatCards.map((config) => (
              <StatCard
                key={config.key}
                config={config}
                stats={stats}
                loading={statsLoading}
              />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Farm inspections this month
                </CardTitle>
                <CardDescription>
                  {formatNumber(stats?.scheduledVisits)} scheduled ·{" "}
                  {formatNumber(stats?.totalInspections)} completed
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {statsLoading && !stats ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ApexChart
                    type="donut"
                    options={inspectionChartOptions}
                    series={inspectionSlices.map((slice) => slice.value)}
                    height={220}
                  />
                )}
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  {inspectionSlices.map((slice) => {
                    const percentage = inspectionTotal
                      ? Math.round((slice.value / inspectionTotal) * 100)
                      : 0;
                    const color = inspectionColors[slice.label] ?? "#16a34a";
                    return (
                      <div key={slice.label} className="space-y-1">
                        <span className="block text-xs font-medium text-gray-500">
                          {slice.label}
                        </span>
                        <span
                          className="text-2xl font-semibold"
                          style={{ color }}
                        >
                          {percentage}%
                        </span>
                        <span className="block text-xs text-gray-500">
                          {formatNumber(slice.value)} visits
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-7">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Seed stock per quarter
                </CardTitle>
                <CardDescription>
                  Monitoring pipeline quantity and certified stock
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {statsLoading && !stats ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ApexChart
                    type="bar"
                    options={seedStockChartOptions}
                    series={[
                      {
                        name: "Stock level",
                        data: seedStockPoints.map((point) => point.total),
                      },
                    ]}
                    height={240}
                  />
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  {seedStockTags.map((tag) => (
                    <div
                      key={tag.label}
                      className="rounded-xl border border-gray-100 px-4 py-3"
                    >
                      <p className="text-xs font-medium text-gray-500">
                        {tag.label}
                      </p>
                      <p
                        className="mt-1 text-lg font-semibold"
                        style={{ color: tag.color }}
                      >
                        {tag.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader className="flex flex-col gap-4 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Recent activities
                    </CardTitle>
                    <CardDescription>
                      Latest updates from permits, inspections, and stock
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-sm text-primary"
                    type="button"
                  >
                    View all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {activityFilters.map((filter, index) => (
                    <span
                      key={filter.label}
                      className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-gray-600",
                        index === 0 &&
                          "border-primary/30 bg-primary/5 text-primary",
                      )}
                    >
                      {filter.label}
                      <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                        {filter.value}
                      </span>
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="px-0">
                {statsLoading && !stats ? (
                  <div className="space-y-4 px-6">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-4">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : showActivitiesEmpty ? (
                  <div className="px-6 py-8 text-sm text-gray-500">
                    No recent activities found.
                  </div>
                ) : (
                  <ol className="divide-y">
                    {activityList.map((activity) => {
                      const categoryColor = activity.category
                        ? activityCategoryColors[activity.category] ||
                          "bg-gray-300"
                        : "bg-gray-300";
                      return (
                        <li
                          key={activity.id}
                          className="flex items-start gap-4 px-6 py-4"
                        >
                          <span
                            className={cn(
                              "mt-1 size-3 rounded-full",
                              categoryColor,
                            )}
                            aria-hidden="true"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.entity || "—"}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>
                              {activity.status || activity.category || "Update"}
                            </p>
                            <p>{formatRelativeTime(activity.timestamp)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Operations calendar
                </CardTitle>
                <CardDescription>
                  {calendarMeta.monthLabel} {calendarMeta.year}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  showOutsideDays={false}
                  className="rounded-xl border"
                  style={{
                    width: "100%",
                  }}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {calendarInsights.map((insight) => (
                    <div
                      key={insight.label}
                      className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                    >
                      <p className="text-xs font-medium text-gray-500">
                        {insight.label}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {insight.value}
                      </p>
                      <p className="text-xs text-gray-500">{insight.meta}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </Container>
    </>
  );
};

export { SttsDashboardPage };
