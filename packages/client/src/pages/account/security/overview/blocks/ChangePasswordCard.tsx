import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { CHANGE_PASSWORD } from "@/gql/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ChangePasswordCard = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD);

  const passwordMismatch =
    form.confirmPassword &&
    form.newPassword &&
    form.newPassword !== form.confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.currentPassword || !form.newPassword) {
      toast("Please fill in all password fields.");
      return;
    }

    if (passwordMismatch) {
      toast("New password and confirmation do not match.");
      return;
    }

    try {
      await changePassword({
        variables: {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
      });
      toast("Password updated successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast("Failed to update password.", {
        description: error?.message ?? "Unknown error",
      });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Change Password</h3>
      </div>
      <form className="card-body grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Current Password</label>
          <Input
            type="password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            autoComplete="current-password"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="form-label">New Password</label>
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            autoComplete="new-password"
            minLength={8}
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="form-label">Confirm New Password</label>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            autoComplete="new-password"
            minLength={8}
            placeholder="Re-enter new password"
          />
          {passwordMismatch && (
            <p className="text-xs text-danger mt-1">
              Passwords do not match.
            </p>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading || passwordMismatch}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export { ChangePasswordCard };
