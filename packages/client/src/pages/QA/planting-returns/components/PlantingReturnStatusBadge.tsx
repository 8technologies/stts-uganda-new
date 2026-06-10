type PlantingReturnStatusBadgeProps = {
  status?: string | null;
};

const getStatusColor = (status: string) => {
  if (status === "approved" || status === "recommended") return "success";
  if (status === "rejected" || status === "halted") return "danger";
  if (status === "assigned" || status === "assigned_inspector") return "info";
  return "warning";
};

const PlantingReturnStatusBadge = ({
  status,
}: PlantingReturnStatusBadgeProps) => {
  const value = String(status || "pending");
  const color = getStatusColor(value);

  return (
    <span
      className={`badge badge-${color} shrink-0 badge-outline rounded-[30px]`}
    >
      <span className={`size-1.5 rounded-full bg-${color} me-1.5`}></span>
      {value}
    </span>
  );
};

export { PlantingReturnStatusBadge };
