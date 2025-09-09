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

const SeedStockChart = () => {
  const options: ApexOptions = {
    series: [
      { name: 'Stock examination', data: [2, 4, 6, 8, 9, 10, 11] },
      { name: 'My Stock', data: [6, 5, 3, 2, 4, 6, 7] },
      { name: 'Marketable seed', data: [3, 2, 2, 4, 5, 7, 8] }
    ],
    chart: { type: 'line', height: 300, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
    colors: ['#1F7A3A', '#28B862', '#FFC658'],
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 },
    legend: { show: true }
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Seed Stock Line Chart</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="line" height={300} />
      </div>
    </div>
  );
};

const MarketplaceBar = () => {
  const options: ApexOptions = {
    series: [{ name: 'Marketplace', data: [10, 220, 340, 950] }],
    chart: { type: 'bar', height: 300, toolbar: { show: false } },
    xaxis: { categories: ['Products', 'Orders', 'Pre-Orders', 'Quotations'] },
    colors: ['#1F7A3A'],
    plotOptions: { bar: { borderRadius: 6 } },
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 }
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Marketplace Bar Graph</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="bar" height={300} />
      </div>
    </div>
  );
};

const ScatterGraph = () => {
  const options: ApexOptions = {
    chart: { type: 'scatter', height: 300, toolbar: { show: false } },
    series: [
      {
        name: 'My First dataset',
        data: [
          [10, 20],
          [20, 35],
          [35, 60],
          [55, 70],
          [65, 90]
        ]
      },
      {
        name: 'My Second dataset',
        data: [
          [15, 10],
          [30, 40],
          [45, 30],
          [75, 20],
          [90, 45]
        ]
      }
    ],
    xaxis: { tickAmount: 10, min: 0, max: 100 },
    yaxis: { tickAmount: 5, min: 0, max: 100 },
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 },
    markers: { size: 5 },
    colors: ['#FF6B8A', '#4BA3F5']
  };
  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Scatter Graph</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="scatter" height={300} />
      </div>
    </div>
  );
};

const ComboBarLine = () => {
  const options: ApexOptions = {
    chart: { height: 300, type: 'line', stacked: false, toolbar: { show: false } },
    series: [
      { name: 'Dataset 1', type: 'column', data: [30, 40, 45, 50, 49, 60] },
      { name: 'Dataset 2', type: 'column', data: [23, 12, 54, 61, 32, 56] },
      { name: 'Dataset 3', type: 'line', data: [44, 55, 41, 67, 22, 43] }
    ],
    stroke: { width: [0, 0, 3] },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 },
    colors: ['#4BA3F5', '#FF6B8A', '#1F7A3A'],
    xaxis: {
      categories: ['Import Permits', 'Export Permits', 'Planting', 'SR4', 'SR6', 'Seed Labels']
    }
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Combo Bar Graph</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="line" height={300} />
      </div>
    </div>
  );
};

const MarketplaceDonut = () => {
  const options: ApexOptions = {
    chart: { type: 'donut', height: 340, toolbar: { show: false } },
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
    legend: { position: 'bottom' },
    colors: ['#FF6B8A', '#FFC658', '#28B862', '#4BA3F5', '#1F7A3A', '#2B6CB0', '#0EA5E9', '#8B5CF6']
  };

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Marketplace Pie Chart</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="donut" height={340} />
      </div>
    </div>
  );
};

const FormsRadar = () => {
  const options: ApexOptions = {
    chart: { type: 'radar', height: 340, toolbar: { show: false } },
    series: [
      { name: 'SR4', data: [20, 30, 10, 40, 25] },
      { name: 'SR6', data: [35, 25, 18, 20, 10] },
      { name: 'SR10', data: [50, 10, 5, 35, 45] }
    ],
    labels: ['Accepted', 'Pending', 'Rejected', 'Halted', '#####'],
    colors: ['#C7CBD1', '#FF6B8A', '#1F7A3A'],
    yaxis: { show: false }
  };
  return (
    <div className="card h-full">
      <div className="card-header">
        <h3 className="card-title">Radar Graph</h3>
      </div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="radar" height={340} />
      </div>
    </div>
  );
};

const GlanceCard = () => (
  <div className="card h-full">
    <div className="card-header">
      <h3 className="card-title">At a glance – (General activity)</h3>
    </div>
    <div className="card-body p-0">
      <div className="divide-y divide-gray-200">
        {mockGlance.map((x) => (
          <div key={x.label} className="flex items-center justify-between px-6 py-3">
            <div className="text-gray-700">{x.label}</div>
            <div className="font-semibold text-gray-900">{x.value}</div>
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
