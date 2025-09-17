import { useMemo, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/layouts/demo1/toolbar';
import {
  DataGrid,
  DataGridToolbar,
  DataGridColumnHeader,
  DataGridColumnFilter,
  DataGridRowSelect,
  DataGridRowSelectAll
} from '@/components/data-grid';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FlipHorizontal2, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type QDSRecord = {
  id: string;
  applicant: string;
  createdAgo: string;
  category: 'Seed Merchant/Company' | 'Seed Dealer/importer/exporter';
  status: 'Accepted' | 'Pending' | 'Rejected';
  createdBy: string;
  address: string;
  inspector?: string;
  certificate: 'Print Certificate' | 'Unavailable';
};

const mockData: QDSRecord[] = [
  {
    id: '1',
    applicant: 'Berry Bird Plc',
    createdAgo: '2 weeks ago',
    category: 'Seed Merchant/Company',
    status: 'Accepted',
    createdBy: 'Aurelia Bishop',
    address: 'Itaque ab qui cillum',
    inspector: 'Not assigned',
    certificate: 'Print Certificate'
  },
  {
    id: '2',
    applicant: 'Stevens Logan Inc',
    createdAgo: '1 month ago',
    category: 'Seed Dealer/importer/exporter',
    status: 'Accepted',
    createdBy: 'Aurelia Bishop',
    address: 'Illum velit sed la',
    inspector: 'Not assigned',
    certificate: 'Print Certificate'
  },
  {
    id: '3',
    applicant: 'CAII SEEDS LIMITED',
    createdAgo: '2 months ago',
    category: 'Seed Merchant/Company',
    status: 'Pending',
    createdBy: 'CAII SEEDS LIMITED',
    address: 'Kampala',
    inspector: 'Not assigned',
    certificate: 'Unavailable'
  }
];

const statusVariant = (status: QDSRecord['status']) => {
  if (status === 'Accepted') return 'success' as const;
  if (status === 'Pending') return 'warning' as const;
  return 'danger' as const;
};

const SR4ListPage = () => {
  const [data] = useState<QDSRecord[]>(mockData);

  const categoryOptions = useMemo(
    () => [
      { label: 'Seed Merchant/Company', value: 'Seed Merchant/Company' },
      { label: 'Seed Dealer/importer/exporter', value: 'Seed Dealer/importer/exporter' }
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { label: 'Accepted', value: 'Accepted' },
      { label: 'Pending', value: 'Pending' },
      { label: 'Rejected', value: 'Rejected' }
    ],
    []
  );

  const columns: ColumnDef<QDSRecord>[] = [
    {
      id: 'select',
      header: () => <DataGridRowSelectAll />,
      cell: ({ row }) => <DataGridRowSelect row={row} />,
      enableSorting: false,
      enableHiding: false,
      size: 24
    },
    {
      accessorKey: 'applicant',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Name of Applicant" />,
      cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.applicant}</div>
    },
    {
      accessorKey: 'createdAgo',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <div>{row.original.createdAgo}</div>
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataGridColumnHeader
          column={column}
          title="Application Category"
          filter={
            <DataGridColumnFilter column={column} title="Category" options={categoryOptions} />
          }
        />
      ),
      cell: ({ row }) => <div>{row.original.category}</div>
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataGridColumnHeader
          column={column}
          title="Status"
          filter={<DataGridColumnFilter column={column} title="Status" options={statusOptions} />}
        />
      ),
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status) as any}>{row.original.status}</Badge>
      )
    },
    {
      accessorKey: 'createdBy',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Created by" />
    },
    {
      accessorKey: 'address',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Address" />
    },
    {
      accessorKey: 'inspector',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Inspector" />,
      cell: () => <span className="text-muted-foreground">Not assigned</span>
    },
    {
      accessorKey: 'certificate',
      header: ({ column }) => <DataGridColumnHeader column={column} title="Certificate" />,
      cell: ({ row }) => (
        <button
          className="text-primary font-medium disabled:text-muted-foreground"
          disabled={row.original.certificate === 'Unavailable'}
        >
          {row.original.certificate}
        </button>
      )
    },
    {
      id: 'actions',
      header: () => <span>Action</span>,
      enableSorting: false,
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Assign Inspector</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const ToolbarFilters = () => (
    <div className="flex items-center gap-2">
      <Button variant="light" className="gap-2">
        <FlipHorizontal2 className="h-4 w-4" />
        Filter
      </Button>
    </div>
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading title="Form SR4" description="List" />
        </Toolbar>
      </Container>

      <Container>
        <DataGrid<QDSRecord>
          columns={columns as any}
          data={data}
          rowSelection
          layout={{ card: true }}
          // pagination={{
          //   page: 0,
          //   size: 5,
          //   sizes: [5, 10, 20, 50],
          //   info: 'Showing {from} to {to} of {count} entries'
          // }}
          toolbar={
            <DataGridToolbar className="p-5">
              <ToolbarFilters />
            </DataGridToolbar>
          }
        />
      </Container>
    </>
  );
};

export { SR4ListPage };
