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
    chart: { type: 'line', height: 250, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
    colors: ['#1F7A3A', '#28B862', '#FFC658'],
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 },
    legend: { show: true }
  };

  return (
    <div className="card h-full">
      <div className="card-header"><h3 className="card-title">Seed Stock Line Chart</h3></div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="line" height={250} />
      </div>
    </div>
  );
};

const MarketplaceBar = () => {
  const options: ApexOptions = {
    series: [{ name: 'Marketplace', data: [10, 220, 340, 950] }],
    chart: { type: 'bar', height: 250, toolbar: { show: false } },
    xaxis: { categories: ['Products', 'Orders', 'Pre-Orders', 'Quotations'] },
    colors: ['#1F7A3A'],
    plotOptions: { bar: { borderRadius: 6 } },
    grid: { borderColor: 'var(--tw-gray-200)', strokeDashArray: 5 }
  };

  return (
    <div className="card h-full">
      <div className="card-header"><h3 className="card-title">Marketplace Bar Graph</h3></div>
      <div className="card-body">
        <ApexChart options={options} series={options.series as any} type="bar" height={250} />
      </div>
    </div>
  );
};

const GlanceCard = () => (
  <div className="card h-full">
    <div className="card-header"><h3 className="card-title">At a glance – (General activity)</h3></div>
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
          <ToolbarHeading title="The Admin Dashboard" description="Seed Tracking & Tracing Overview" />
          <ToolbarActions></ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
            <div className="lg:col-span-1"><GlanceCard /></div>
            <div className="lg:col-span-1"><MarketplaceBar /></div>
            <div className="lg:col-span-1"><SeedStockChart /></div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { SttsDashboardPage };

