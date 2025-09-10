import { Fragment } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/toolbar';
import ApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';

const mockGlance = [
  { label: 'Registered users', value: 664 },
  { label: 'Import Permits', value: 1 },
  { label: 'Export Permits', value: 1 },
  { label: 'Planting returns', value: 5 },
  { label: 'SR4 Forms', value: 3 },
  { label: 'SR6 Forms', value: 36 },
  { label: 'SR10 Forms', value: 9 },
  { label: 'Seed Labs', value: 8 },
  { label: 'Stock Examination Requests', value: 14 },
  { label: 'Stock Records', value: 13 },
  { label: 'Marketable Seed', value: 3 }
];

// Enhanced color palette
const colors = {
  primary: '#2B6CB0',
  secondary: '#1F7A3A',
  accent: '#FF6B8A',
  success: '#28B862',
  warning: '#FFC658',
  info: '#4BA3F5',
  purple: '#8B5CF6',
  gray: '#C7CBD1',
  dark: '#2D3748'
};

const SeedStockChart = () => {
  const options: ApexOptions = {
    series: [
      { name: 'Stock examination', data: [2, 4, 6, 8, 9, 10, 11] },
      { name: 'My Stock', data: [6, 5, 3, 2, 4, 6, 7] },
      { name: 'Marketable seed', data: [3, 2, 2, 4, 5, 7, 8] }
    ],
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: [colors.info, colors.success, colors.warning]
    },
    markers: {
      size: 5,
      strokeWidth: 0,
      colors: [colors.info, colors.success, colors.warning],
      hover: { size: 7 }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      axisBorder: { color: '#E2E8F0' },
      axisTicks: { color: '#E2E8F0' }
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toFixed(0)
      }
    },
    colors: [colors.info, colors.success, colors.warning],
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      itemMargin: { horizontal: 15 },
      markers: {
        radius: 4,
        width: 12,
        height: 12
      }
    },
    tooltip: {
      theme: 'light',
      x: { show: false }
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Seed Stock Trends</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="line" height={300} />
      </div>
    </div>
  );
};

const MarketplaceBar = () => {
  const options: ApexOptions = {
    series: [{ name: 'Count', data: [10, 220, 340, 950] }],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: [colors.dark]
      }
    },
    xaxis: {
      categories: ['Products', 'Orders', 'Pre-Orders', 'Quotations'],
      axisBorder: { color: '#E2E8F0' },
      axisTicks: { color: '#E2E8F0' }
    },
    yaxis: {
      title: {
        text: 'Count',
        style: {
          color: colors.dark,
          fontSize: '12px'
        }
      },
      labels: {
        formatter: (val) => Math.floor(val).toString()
      }
    },
    colors: [colors.primary],
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      padding: {
        top: 20,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => val.toString()
      }
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Marketplace Overview</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="bar" height={300} />
      </div>
    </div>
  );
};

const ScatterGraph = () => {
  const options: ApexOptions = {
    chart: {
      type: 'scatter',
      height: 300,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark
    },
    series: [
      {
        name: 'Dataset 1',
        data: [
          [10, 20],
          [20, 35],
          [35, 60],
          [55, 70],
          [65, 90],
          [15, 25],
          [25, 45],
          [40, 50],
          [60, 75],
          [70, 85]
        ]
      },
      {
        name: 'Dataset 2',
        data: [
          [15, 10],
          [30, 40],
          [45, 30],
          [75, 20],
          [90, 45],
          [20, 15],
          [35, 25],
          [50, 35],
          [65, 50],
          [80, 60]
        ]
      }
    ],
    xaxis: {
      tickAmount: 10,
      min: 0,
      max: 100,
      title: {
        text: 'X Axis',
        style: {
          color: colors.dark,
          fontSize: '12px'
        }
      },
      axisBorder: { color: '#E2E8F0' },
      axisTicks: { color: '#E2E8F0' }
    },
    yaxis: {
      tickAmount: 5,
      min: 0,
      max: 100,
      title: {
        text: 'Y Axis',
        style: {
          color: colors.dark,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    markers: {
      size: 8,
      strokeWidth: 0,
      hover: { size: 10 }
    },
    colors: [colors.accent, colors.info],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      itemMargin: { horizontal: 15 }
    },
    tooltip: {
      theme: 'light'
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Data Correlation</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="scatter" height={300} />
      </div>
    </div>
  );
};

const ComboBarLine = () => {
  const options: ApexOptions = {
    chart: {
      height: 300,
      type: 'line',
      stacked: false,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark
    },
    series: [
      { name: 'Dataset 1', type: 'column', data: [30, 40, 45, 50, 49, 60] },
      { name: 'Dataset 2', type: 'column', data: [23, 12, 54, 61, 32, 56] },
      { name: 'Dataset 3', type: 'line', data: [44, 55, 41, 67, 22, 43] }
    ],
    stroke: {
      width: [0, 0, 3],
      curve: 'smooth',
      colors: [colors.info, colors.accent, colors.success]
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        borderRadius: 6,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0, 1],
      style: {
        fontSize: '11px',
        colors: [colors.dark]
      },
      offsetY: -20
    },
    markers: {
      size: 5,
      strokeWidth: 0,
      colors: [colors.success],
      hover: { size: 7 }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      padding: {
        top: 20,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    colors: [colors.info, colors.accent, colors.success],
    xaxis: {
      categories: ['Import Permits', 'Export Permits', 'Planting', 'SR4', 'SR6', 'Seed Labels'],
      axisBorder: { color: '#E2E8F0' },
      axisTicks: { color: '#E2E8F0' }
    },
    yaxis: [
      {
        seriesName: 'Dataset 1',
        axisTicks: { show: true },
        axisBorder: { show: true, color: colors.info },
        labels: {
          style: { colors: colors.info },
          formatter: (val) => val.toFixed(0)
        },
        title: {
          text: 'Columns',
          style: { color: colors.info }
        }
      },
      {
        seriesName: 'Dataset 3',
        opposite: true,
        axisTicks: { show: true },
        axisBorder: { show: true, color: colors.success },
        labels: {
          style: { colors: colors.success },
          formatter: (val) => val.toFixed(0)
        },
        title: {
          text: 'Line',
          style: { color: colors.success }
        }
      }
    ],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      itemMargin: { horizontal: 15 }
    },
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Activity Comparison</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="line" height={300} />
      </div>
    </div>
  );
};

const MarketplaceDonut = () => {
  const options: ApexOptions = {
    chart: {
      type: 'donut',
      height: 340,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark
    },
    series: [12, 8, 20, 15, 10, 18, 25, 6],
    labels: [
      'Import Permits',
      'Export Permits',
      'Planting Returns Company',
      'Planting Returns Grower',
      'Form SR10s',
      'Form QDS',
      'Total Seed Labs',
      'Seed Labels'
    ],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      itemMargin: { horizontal: 10, vertical: 5 },
      markers: {
        width: 10,
        height: 10,
        radius: 4
      }
    },
    colors: [
      colors.accent,
      colors.warning,
      colors.success,
      colors.info,
      colors.secondary,
      colors.primary,
      colors.purple,
      colors.gray
    ],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: '500'
      },
      dropShadow: {
        enabled: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px'
            },
            value: {
              show: true,
              fontSize: '16px',
              fontWeight: '600'
            },
            total: {
              show: true,
              label: 'Total',
              color: colors.dark,
              formatter: (w) => {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
            }
          }
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => val.toString()
      }
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Distribution Analysis</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="donut" height={340} />
      </div>
    </div>
  );
};

const FormsRadar = () => {
  const options: ApexOptions = {
    chart: {
      type: 'radar',
      height: 340,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      foreColor: colors.dark,
      dropShadow: {
        enabled: true,
        blur: 1,
        left: 1,
        top: 1
      }
    },
    series: [
      { name: 'SR4', data: [20, 30, 10, 40, 25, 35] },
      { name: 'SR6', data: [35, 25, 18, 20, 10, 30] },
      { name: 'SR10', data: [50, 10, 5, 35, 45, 15] }
    ],
    labels: ['Accepted', 'Pending', 'Rejected', 'Halted', 'Processing', 'Completed'],
    colors: [colors.gray, colors.accent, colors.success],
    markers: {
      size: 4,
      colors: ['#fff'],
      strokeColors: [colors.gray, colors.accent, colors.success],
      strokeWidth: 2
    },
    yaxis: {
      show: false,
      tickAmount: 5
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: '500'
      }
    },
    plotOptions: {
      radar: {
        size: 130,
        polygons: {
          strokeColors: '#E2E8F0',
          fill: {
            colors: ['#F8FAFC', '#fff']
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      itemMargin: { horizontal: 10, vertical: 5 }
    },
    tooltip: {
      theme: 'light'
    }
  };

  return (
    <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <h3 className="card-title text-gray-700 font-semibold">Forms Status Radar</h3>
      </div>
      <div className="card-body p-4">
        <ApexChart options={options} series={options.series as any} type="radar" height={340} />
      </div>
    </div>
  );
};

const GlanceCard = () => (
  <div className="card h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="card-header bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
      <h3 className="card-title text-gray-700 font-semibold">At a Glance – General Activity</h3>
    </div>
    <div className="card-body p-0">
      <div className="divide-y divide-gray-100">
        {mockGlance.map((x, index) => (
          <div
            key={x.label}
            className="flex items-center justify-between px-6 py-3 transition-colors duration-150 hover:bg-gray-50"
          >
            <div className="text-gray-600 text-sm">{x.label}</div>
            <div className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md text-sm min-w-[3rem] text-center">
              {x.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SttsDashboardPage = () => {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="The Admin Dashboard"
            description="Seed Tracking & Tracing Overview"
          />
          <ToolbarActions></ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5 lg:grid-cols-3">
          {/* Left rail: At a glance (desktop only sticks to left column) */}
          <div className="lg:col-span-1">
            <GlanceCard />
          </div>

          {/* Right grid: 2 columns of charts on desktop; single column on mobile */}
          <div className="lg:col-span-2">
            <div className="grid gap-5 lg:gap-7.5 grid-cols-1 lg:grid-cols-2 items-stretch">
              <MarketplaceBar />
              <SeedStockChart />
              <ScatterGraph />
              <ComboBarLine />
              <MarketplaceDonut />
              <FormsRadar />
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SttsDashboardPage };
