import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from "@/layouts/demo1/toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CROPS_MOCK, findCropById } from "./crops.data";
import { LOAD_CROP } from "@/gql/queries";
import { Skeleton } from "@/components/ui/skeleton";

const yesno = (b: boolean) => (b ? "Yes" : "No");

const LabeledRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 items-start">
    <div className="text-sm text-gray-700 font-medium pt-1">{label}</div>
    <div className="md:col-span-2">
      <div className="form-control">{value}</div>
    </div>
  </div>
);

const CropDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation() as any;
  const cropFromState = location?.state?.crop as any;
  const { data, loading, error } = useQuery(LOAD_CROP, {
    variables: { id: String(id) },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });
  const apiCrop = data?.crop;
  const crop = apiCrop || cropFromState || (id ? findCropById(id) : undefined);

  return (
    <div className="flex flex-col gap-5">
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Crop Details"
            description="View parameters, inspections and varieties"
          />
          <ToolbarActions>
            <Link to="/admin/crops" className="btn btn-sm btn-light">
              Back to list
            </Link>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        {loading ? (
          <div className="p-6 space-y-3 bg-white rounded-lg border">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-60" />
          </div>
        ) : error ? (
          <div className="p-6 text-danger bg-white rounded-lg border">
            Failed to load crop
          </div>
        ) : !crop ? (
          <div className="p-6 bg-white rounded-lg border">Crop not found.</div>
        ) : (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header px-5 py-4 border-b">
                <h3 className="card-title">General</h3>
              </div>
              <div className="card-body p-5 space-y-4">
                <LabeledRow
                  label="Name"
                  value={
                    <span className="text-gray-900 font-medium">
                      {crop.name}
                    </span>
                  }
                />
                <LabeledRow label="Is QDS?" value={yesno(crop.isQDS)} />
                <LabeledRow
                  label="Enter Number of days before submission"
                  value={`${crop.daysBeforeSubmission} days`}
                />
                <LabeledRow label="Units" value={crop.units} />
                <LabeledRow
                  label="Total Varieties"
                  value={crop.varieties.length}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header px-5 py-4 border-b">
                <h3 className="card-title">Crop inspection types</h3>
              </div>
              <div className="card-body p-5">
                <Table className="table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inspection stage name</TableHead>
                      <TableHead>Order number</TableHead>
                      <TableHead>Is required</TableHead>
                      <TableHead>Period after planting (in days)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crop.inspectionTypes.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {it.stageName}
                        </TableCell>
                        <TableCell>{it.order}</TableCell>
                        <TableCell>{yesno(it.required)}</TableCell>
                        <TableCell>{it.periodAfterPlantingDays}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="card">
              <div className="card-header px-5 py-4 border-b">
                <h3 className="card-title">Crop varieties</h3>
              </div>
              <div className="card-body p-5">
                <ul className="list-disc ps-5 space-y-1 text-gray-800">
                  {crop.varieties.map((v, i) => (
                    <li key={i}>{v.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default CropDetailsPage;
