import { Fragment } from "react";
import ApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import { Container } from "@/components/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";

const statCards = [
  {
    title: "Registered Users",
    value: "1,234",
    description: "Authorized individuals or organizations",
    icon: "users",
    // text classes
    valueColor: "text-emerald-900",
    titleClass: "text-emerald-900",
    descriptionClass: "text-emerald-800",
    // border + layout class only (background provided via bgStyle)
    cardClass: "border-emerald-100",
    iconClass: "bg-white text-emerald-600",
    accentClass: "bg-emerald-700",
    decorColor: "#16A34A",
    badgeIconColor: "#16A34A",
    bgStyle: "linear-gradient(135deg,#ECFDF5 0%, #6EE7B7 100%)",
    footnote: "+3.2% vs last week",
    footnoteClass: "text-emerald-700",
  },
  {
    title: "User Permits",
    value: "84",
    description: "Official approvals for imports and export permits",
    icon: "security-user",
    valueColor: "text-amber-900",
    titleClass: "text-amber-900",
    descriptionClass: "text-amber-800",
    cardClass: "border-amber-100",
    iconClass: "bg-white text-amber-600",
    accentClass: "bg-amber-500",
    decorColor: "#F59E0B",
    badgeIconColor: "#F59E0B",
    bgStyle: "linear-gradient(135deg,#FFFBEB 0%, #FDE68A 100%)",
    footnote: "+11 pending reviews",
    footnoteClass: "text-amber-700",
  },
  {
    title: "Crop Declarations",
    value: "712",
    description: "Crop declarations from seed producers",
    icon: "richtext-box",
    valueColor: "text-sky-900",
    titleClass: "text-sky-900",
    descriptionClass: "text-sky-700",
    cardClass: "border-sky-100",
    iconClass: "bg-white text-sky-600",
    accentClass: "bg-sky-500",
    decorColor: "#0EA5E9",
    badgeIconColor: "#0EA5E9",
    bgStyle: "linear-gradient(135deg,#ECFEFF 0%, #7DD3FC 100%)",
    footnote: "64 awaiting validation",
    footnoteClass: "text-sky-700",
  },
  {
    title: "Printed Labels",
    value: "20",
    description: "Approved and pending seed labels",
    icon: "printer",
    valueColor: "text-white",
    titleClass: "text-white/90",
    descriptionClass: "text-white/80",
    cardClass: "border-emerald-600",
    iconClass: "bg-white/20 text-white",
    accentClass: "bg-white/60",
    decorColor: "#059669",
    badgeIconColor: "#059669",
    bgStyle: "linear-gradient(135deg,#10B981 0%, #059669 100%)",
    footnote: "4 queued for print",
    footnoteClass: "text-white",
  },
];

const inspectionsBreakdown = [
  { label: "Completed", value: 72, color: "#00A651" },
  { label: "Skipped", value: 10, color: "#6CC24A" },
  { label: "Pending", value: 18, color: "#C5DA4B" },
];

const recentActivities = [
  {
    title: "SR4 Application Submitted",
    entity: "ABC Seeds Ltd",
    time: "Just now",
    color: "#00A651",
  },
  {
    title: "Crop Inspection Completed",
    entity: "John Farmer",
    time: "12 mins ago",
    color: "#24C08A",
  },
  {
    title: "Stock Updated",
    entity: "Green Valley Farm",
    time: "Today 09:24",
    color: "#F6B73C",
  },
  {
    title: "Export Permit Approved",
    entity: "Global Seeds Co",
    time: "Yesterday",
    color: "#2BB5F6",
  },
];

const seedStockSeries = [18, 54, 42, 60];
const seedStockCategories = ["Q1", "Q2", "Q3", "Q4"];

const heroHighlights = [
  { label: "Inspections in field", value: "42", meta: "+5 vs yesterday" },
  { label: "Permits pending review", value: "18", meta: "SLA 3 days" },
  { label: "Seed lots tracked", value: "312", meta: "24 new batches" },
];

const heroFilters = ["Facilities", "Permits", "Inspectors"];

const inspectionQuickStats = [
  {
    label: "Total visits scheduled",
    value: "128",
    meta: "42 districts covered",
  },
  {
    label: "Pending corrective actions",
    value: "9",
    meta: "High priority farms",
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

const InspectionDonut = () => {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      sparkline: { enabled: true },
    },
    labels: inspectionsBreakdown.map((x) => x.label),
    colors: inspectionsBreakdown.map((x) => x.color),
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
              formatter: () => "100",
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
      series={inspectionsBreakdown.map((x) => x.value)}
      type="donut"
      height={250}
    />
  );
};

const SeedStockBar = () => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    series: [
      {
        name: "Seed stock",
        data: seedStockSeries,
      },
    ],
    xaxis: {
      categories: seedStockCategories,
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

  return (
    <Fragment>
      <Container>
        <div className="space-y-8 pb-12">
          {/* <div className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-sm lg:p-10">
            <span className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl" />
            <span className="pointer-events-none absolute left-12 -bottom-10 h-32 w-32 rounded-full bg-emerald-300/40 blur-2xl" />

            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative z-0 flex-1 space-y-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-700">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] tracking-[0.2em] text-emerald-600">
                    Live Dashboard
                  </span>
                  National Seed Tracking & Tracing System
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-semibold text-gray-900 md:text-4xl">
                    Welcome, Commissioner
                  </p>
                  <p className="text-sm text-gray-600 md:text-base">
                    Stay ahead of inspections, permits, and stock status with
                    proactive alerts and instant traceability across the
                    national supply chain.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {heroHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm shadow-sm backdrop-blur"
                    >
                      <p className="text-xs font-medium uppercase text-emerald-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {item.value}
                      </p>
                      <p className="text-xs text-gray-500">{item.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-0 w-full max-w-md space-y-4">
                <div className="rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-inner backdrop-blur">
                  <div className="relative">
                    <KeenIcon
                      icon="search"
                      className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      className="h-12 rounded-2xl border-0 bg-transparent pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-emerald-500"
                      placeholder="Search facilities, permits, or inspectors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 text-sm">
                    {heroFilters.map((filter) => (
                      <button
                        key={filter}
                        className="rounded-full border border-emerald-200/80 bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm"
                        type="button"
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="flex-1 rounded-full" size="lg">
                    <KeenIcon icon="chart" className="mr-2" /> Open Command
                    Center
                  </Button>
                  <Button className="rounded-full px-6" variant="light">
                    <KeenIcon icon="export" className="mr-2" /> Export Files
                  </Button>
                </div>
              </div>
            </div>
          </div> */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 ${card.cardClass}`}
                style={
                  card.bgStyle
                    ? ({ background: card.bgStyle, minHeight: 140 } as any)
                    : { minHeight: 140 }
                }
              >
                {/* decorative blurred circle */}
                <span
                  aria-hidden
                  className="absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-25 blur-2xl"
                  style={{ backgroundColor: card.decorColor }}
                />

                {/* top-right white icon badge */}
                <div className="absolute right-5 top-4 z-0">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"
                    style={{ boxShadow: "0 6px 18px rgba(16,24,40,0.06)" }}
                  >
                    <span
                      style={{ color: card.badgeIconColor || card.decorColor }}
                    >
                      <KeenIcon icon={card.icon} className="size-5" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative z-0">
                  <div className="flex-1">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${card.titleClass}`}
                    >
                      {card.title}
                    </p>
                    <p
                      className={`mt-2 text-4xl font-extrabold ${card.valueColor}`}
                    >
                      {card.value}
                    </p>
                    <p className={`mt-2 text-sm ${card.descriptionClass}`}>
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 relative z-0">
                  <p className={`text-sm font-semibold ${card.footnoteClass}`}>
                    {card.footnote}
                  </p>
                  <div className="mt-3 flex">
                    <span
                      className={`block h-2 w-20 rounded-full ${card.accentClass}`}
                    />
                  </div>
                </div>
              </div>
            ))}
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
                  <InspectionDonut />
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
                    {inspectionsBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-gray-100 p-3"
                      >
                        <p
                          className="font-semibold"
                          style={{ color: item.color }}
                        >
                          {item.value}%
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
                  <SeedStockBar />
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
                    <p className="text-xs text-gray-500">
                      Synced 2 minutes ago
                    </p>
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
                  {recentActivities.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-gray-100 p-3"
                    >
                      <span
                        className="mt-1 inline-flex size-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.entity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 whitespace-nowrap">
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
                  ))}
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
