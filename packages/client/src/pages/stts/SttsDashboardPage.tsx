import { Fragment } from "react";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useQuery } from "@apollo/client/react";
import { formatDistanceToNow } from "date-fns";

import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import { DASHBOARD_STATS } from "@/gql/queries";

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
  category: string;
  timestamp: string;
};

type DashboardStatsResponse = {
  registeredUsers: number;
  userPermits: number;
  pendingPermits: number;
  cropDeclarations: number;
  printedLabels: number;
  pendingLabels: number;
  totalInspections: number;
  scheduledVisits: number;
  pendingCorrectiveActions: number;
  inspections: DashboardInspectionSlice[];
  seedStock: DashboardSeedStockPoint[];
  recentActivities: DashboardActivity[];
};

type StatCardConfig = {
  key: keyof Pick<
    DashboardStatsResponse,
    "registeredUsers" | "userPermits" | "cropDeclarations" | "printedLabels"
  >;
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

const statCardConfigs: StatCardConfig[] = [
  {
    key: "registeredUsers",
    title: "Registered Users",
    description: "Authorized individuals or organizations",
    icon: "users",
    cardClass:
      "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100",
    valueClass: "text-emerald-900",
    titleClass: "text-emerald-900",
    descriptionClass: "text-emerald-700",
    iconClass: "bg-white text-emerald-600",
    chipClass: "bg-white/70 text-emerald-700",
    defaultFootnote: "System-wide total",
  },
  {
    key: "userPermits",
    title: "User Permits",
    description: "Official approvals for imports and export permits",
    icon: "security-user",
    cardClass:
      "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-100",
    valueClass: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-700",
    iconClass: "bg-white text-amber-600",
    chipClass: "bg-white/70 text-amber-700",
    getFootnote: (stats) =>
      stats ? `${formatNumber(stats.pendingPermits)} pending reviews` : null,
  },
  {
    key: "cropDeclarations",
    title: "Crop Declarations",
    description: "Crop declarations from seed producers",
    icon: "richtext-box",
    cardClass:
      "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100",
    valueClass: "text-sky-900",
    titleClass: "text-sky-900",
    descriptionClass: "text-sky-700",
    iconClass: "bg-white text-sky-600",
    chipClass: "bg-white/70 text-sky-700",
    defaultFootnote: "Includes active QDS filings",
  },
  {
    key: "printedLabels",
    title: "Printed Labels",
    description: "Approved and pending seed labels",
    icon: "printer",
    cardClass:
      "border-emerald-600 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    valueClass: "text-white",
    titleClass: "text-white/90",
    descriptionClass: "text-white/80",
    iconClass: "bg-white/20 text-white",
    chipClass: "bg-white/10 text-white/90",
    getFootnote: (stats) =>
      stats ? `${formatNumber(stats.pendingLabels)} awaiting print` : null,
  },
];

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

type CalendarCell = {
  value: number;
  isCurrentMonth: boolean;
  key: string;
};

const buildCalendarCells = (year: number, month: number): CalendarCell[] => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index++) {
    const dayOffset = index - startWeekday + 1;
    if (dayOffset < 1) {
      const value = daysInPreviousMonth + dayOffset;
      cells.push({
        value,
        isCurrentMonth: false,
        key: `prev-${value}-${index}`,
      });
    } else if (dayOffset > daysInMonth) {
      const value = dayOffset - daysInMonth;
      cells.push({
        value,
        isCurrentMonth: false,
        key: `next-${value}-${index}`,
      });
    } else {
      cells.push({
        value: dayOffset,
        isCurrentMonth: true,
        key: `curr-${dayOffset}`,
      });
    }
  }

  return cells;
};

type InspectionSliceWithColor = DashboardInspectionSlice & { color: string };

const InspectionDonut = ({ data }: { data: InspectionSliceWithColor[] }) => {
  const series = data.map((slice) => Number(slice.value) || 0);
  const total = series.reduce((sum, value) => sum + value, 0);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      sparkline: { enabled: true },
    },
    labels: data.map((x) => x.label),
    colors: data.map((x) => x.color),
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "78%",
          labels: {
            show: true,
            name: { offsetY: 12, color: "#64748B", fontSize: "12px" },
            value: {
              offsetY: -12,
              color: "#0F172A",
              fontSize: "28px",
              fontWeight: 600,
              formatter: (val) => `${Math.round(Number(val))}`,
            },
            total: {
              show: true,
              label: "inspections",
              fontSize: "12px",
              color: "#94A3B8",
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
  };

  return (
    <ApexChart
      options={options}
      series={series}
      type="donut"
      height={250}
    />
  );
};

const SeedStockBar = ({
  categories,
  series,
}: {
  categories: string[];
  series: number[];
}) => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    series: [
      {
        name: "Seed stock",
        data: series,
      },
    ],
    xaxis: {
      categories,
      axisBorder: { color: "#E5E7EB" },
      axisTicks: { color: "#E5E7EB" },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        formatter: (val) => `${val}`,
      },
    },
    colors: ["#00A651"],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "38%",
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      padding: { left: 10 },
    },
    dataLabels: { enabled: false },
  };

  return (
    <ApexChart
      options={options}
      series={options.series as any}
      type="bar"
      height={240}
    />
  );
};

const SttsDashboardPage = () => {
  const calendarDays = buildCalendarCells(
    calendarMeta.year,
    calendarMeta.monthIndex
  );
  const { data, loading, error } = useQuery<{
    dashboardStats: DashboardStatsResponse;
  }>(DASHBOARD_STATS);

  const metrics = data?.dashboardStats;

  const resolvedStatCards = statCardConfigs.map((card) => {
    const value = metrics?.[card.key] ?? null;
    return {
      ...card,
      valueText: formatNumber(value),
      footnote: card.getFootnote?.(metrics) ?? card.defaultFootnote ?? "",
    };
  });

  const inspectionSlices = (metrics?.inspections?.length
    ? metrics.inspections
    : fallbackInspectionSlices
  ).map((slice) => ({
    ...slice,
    color: inspectionColors[slice.label] ?? "#00A651",
  }));

  const inspectionQuickStats = [
    {
      label: "Total visits scheduled",
      value: formatNumber(metrics?.scheduledVisits ?? metrics?.totalInspections ?? 0),
      meta: metrics?.totalInspections
        ? `${formatNumber(metrics.totalInspections)} inspections logged`
        : "Awaiting new submissions",
    },
    {
      label: "Pending corrective actions",
      value: formatNumber(metrics?.pendingCorrectiveActions ?? 0),
      meta: "Requires follow-up",
    },
  ];

  const seedStockPoints = metrics?.seedStock?.length
    ? metrics.seedStock
    : fallbackSeedStock;
  const seedStockCategories = seedStockPoints.map((point) => point.label);
  const seedStockSeries = seedStockPoints.map((point) => Number(point.total) || 0);

  const activityColorMap: Record<string, string> = {
    permit: "#00A651",
    inspection: "#24C08A",
    label: "#F6B73C",
  };

  const recentActivityCards = (metrics?.recentActivities ?? []).map((activity) => ({
    id: activity.id,
    title: activity.title,
    entity: activity.entity || activity.status || "—",
    time: formatRelativeTime(activity.timestamp),
    color: activityColorMap[activity.category] ?? "#00A651",
  }));

  const hasActivities = recentActivityCards.length > 0;
  const activitySyncLabel = hasActivities
    ? `Updated ${recentActivityCards[0].time}`
    : loading
      ? "Syncing activity…"
      : "No recent activity";

  return (
    <Fragment>
      <Container>
        <div className="space-y-8 pb-12">
          <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.55em] text-emerald-600">
                  National Seed Tracking & Tracing System
                </p>
                <div className="space-y-2">
                  <p className="text-3xl font-semibold text-gray-900 md:text-4xl">
                    Welcome, Commissioner
                  </p>
                  <p className="text-sm text-gray-600 md:text-base">
                    Real-time monitoring of seed movement from production to
                    distribution with instant traceability.
                  </p>
                </div>
                {loading && (
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-500">
                    Syncing live metrics…
                  </p>
                )}
              </div>
              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <button className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-900">
                    <KeenIcon icon="setting-2" className="size-4" />
                  </button>
                  <button className="relative rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-900">
                    <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-rose-500" />
                    <KeenIcon icon="notification" className="size-4" />
                  </button>
                </div>
                <div className="relative">
                  <KeenIcon
                    icon="search"
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    className="h-12 rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-emerald-500"
                    placeholder="Search permits, facilities, or inspectors"
                  />
                </div>
                <div className="flex justify-end">
                  <Button className="rounded-full px-6" variant="light">
                    <KeenIcon icon="export" className="mr-2" /> Export Files
                  </Button>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                Failed to load live metrics. Showing the latest cached values.
              </div>
            )}
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {resolvedStatCards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${card.cardClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClass}`}
                    >
                      <KeenIcon icon={card.icon} className="size-5" />
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${card.chipClass}`}
                    >
                      {card.footnote || "—"}
                    </span>
                  </div>
                  <p
                    className={`mt-6 text-xs font-semibold uppercase tracking-[0.4em] ${card.titleClass}`}
                  >
                    {card.title}
                  </p>
                  <p className={`mt-2 text-4xl font-bold ${card.valueClass}`}>
                    {card.valueText}
                  </p>
                  <p className={`text-sm ${card.descriptionClass}`}>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Farm inspections this month
                      </p>
                      <p className="text-xs text-gray-500">
                        Real-time progress overview
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <KeenIcon icon="activity" className="size-3.5" /> +8% vs
                      last month
                    </div>
                  </div>
                  <InspectionDonut data={inspectionSlices} />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {inspectionQuickStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl bg-gray-50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500">{stat.meta}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-3 text-center text-sm sm:grid-cols-2">
                    {inspectionSlices.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-gray-100 p-3"
                      >
                        <p
                          className="font-semibold"
                          style={{ color: item.color }}
                        >
                          {formatNumber(item.value)}
                        </p>
                        <p className="text-xs text-gray-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Seed stock per quarter
                      </p>
                      <p className="text-xs text-gray-500">
                        Projected stock ready for distribution
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">
                        2025 Forecast
                      </p>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        Updated 10 mins ago
                      </p>
                    </div>
                  </div>
                  <SeedStockBar
                    categories={seedStockCategories}
                    series={seedStockSeries}
                  />
                  <div className="mt-6 flex flex-wrap gap-3">
                    {seedStockTags.map((tag) => (
                      <div
                        key={tag.label}
                        className="flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                      >
                        <span
                          className="inline-flex size-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.label}</span>
                        <span className="text-gray-900">{tag.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Recent activities
                    </p>
                    <p className="text-xs text-gray-500">{activitySyncLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500">
                    {activityFilters.map((filter) => (
                      <button
                        key={filter.label}
                        type="button"
                        className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600 transition hover:border-emerald-200 hover:text-emerald-700"
                      >
                        {filter.label}
                        <span className="ml-1 text-gray-400">
                          {filter.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {hasActivities ? (
                    recentActivityCards.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3"
                      >
                        <span
                          className="mt-1 inline-flex size-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">{item.entity}</p>
                        </div>
                        <div className="text-right">
                          <p className="whitespace-nowrap text-xs text-gray-400">
                            {item.time}
                          </p>
                          <button className="mt-1 inline-flex items-center text-[11px] font-medium text-emerald-600">
                            Details
                            <KeenIcon
                              icon="arrow-up-right"
                              className="ml-1 size-3"
                            />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      No recent updates to display.
                    </div>
                  )}
                </div>
                <div className="pt-4 text-right">
                  <button className="inline-flex items-center text-xs font-semibold text-emerald-700">
                    View all updates
                    <KeenIcon icon="chevron-right" className="ml-1 size-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {calendarMeta.monthLabel}
                    </p>
                    <p className="text-xs text-gray-500">
                      {calendarMeta.year} · Operations calendar
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <KeenIcon icon="calendar" className="size-4" /> Add task
                    </button>
                    <div className="flex items-center gap-2 text-gray-400">
                      <button className="rounded-full border border-gray-200 p-2">
                        <KeenIcon icon="arrow-left" className="size-4" />
                      </button>
                      <button className="rounded-full border border-gray-200 p-2">
                        <KeenIcon icon="arrow-right" className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-[320px] space-y-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div key={day} className="py-1">
                          {day}
                        </div>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {calendarDays.map((cell) => {
                      const isSelected =
                        cell.isCurrentMonth &&
                        cell.value === calendarMeta.selectedDay;
                      return (
                        <div
                          key={cell.key}
                          className={`flex h-10 items-center justify-center rounded-2xl border text-sm ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500 font-semibold text-white"
                              : cell.isCurrentMonth
                                ? "border-gray-100 text-gray-900"
                                : "border-transparent text-gray-300"
                          }`}
                        >
                          {cell.value}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                      <span>Focus for day {calendarMeta.selectedDay}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <KeenIcon icon="shield-tick" className="size-3.5" />{" "}
                        Compliance ready
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {calendarInsights.map((insight) => (
                        <div
                          key={insight.label}
                          className="rounded-xl border border-white bg-white p-3 shadow-sm"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {insight.label}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {insight.value}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {insight.meta}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SttsDashboardPage };
