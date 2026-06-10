import { KeenIcon } from "@/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PlantingReturnActionsMenuProps = {
  row: any;
  canEdit: boolean;
  canDelete: boolean;
  deletingId: string | null;
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
  onPreview: (row: any) => void;
};

const PlantingReturnActionsMenu = ({
  row,
  canEdit,
  canDelete,
  deletingId,
  onEdit,
  onDelete,
  onPreview,
}: PlantingReturnActionsMenuProps) => {
  const isPending = row?.status === "pending";
  const isDeleting = String(deletingId) === String(row?.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn btn-sm btn-icon btn-clear btn-light">
          <KeenIcon icon="dots-vertical" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[190px]">
        <DropdownMenuLabel className="font-medium">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {canEdit && isPending && (
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <KeenIcon icon="note" /> Edit
          </DropdownMenuItem>
        )}

        {canDelete && isPending && (
          <DropdownMenuItem onClick={() => onDelete(row)} disabled={isDeleting}>
            <KeenIcon icon="trash" /> Delete
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => onPreview(row)}>
          <KeenIcon icon="eye" /> Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { PlantingReturnActionsMenu };
