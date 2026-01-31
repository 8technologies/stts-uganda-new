import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ME } from "@/gql/queries";
import { CREATE_USER } from "@/gql/mutations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toAbsoluteUrl } from "@/utils";
import { toast } from "sonner";
import { URL_2 } from "@/config/urls";
import { password } from "bun";

const AccountDetailsEditor = () => {
  const { data, loading, error, refetch } = useQuery(ME);
  const [saveUser, { loading: saving }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: ME }],
    awaitRefetchQueries: true,
  });

  const me = data?.me;
  const [form, setForm] = useState({
    id: "",
    username: "",
    name: "",
    company_initials: "",
    phone_number: "",
    premises_location: "",
    email: "",
    district: "",
    image: "",
    imageFile: null as File | null,
    previewUrl: "",
    password: "",
    passwordConfirmation: "",
  });

  useEffect(() => {
    if (me) {
      setForm({
        id: String(me.id ?? ""),
        username: me.username ?? "",
        name: me.name ?? "",
        company_initials: me.company_initials ?? "",
        phone_number: me.phone_number ?? "",
        premises_location: me.premises_location ?? "",
        email: me.email ?? "",
        district: me.district ?? "",
        image: me.image ?? "",
        imageFile: null,
        previewUrl: me.image ?? "",
        password: "",
        passwordConfirmation: "",

      });
    }
  }, [me]);

  const onUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageFile: file, previewUrl: url }));
  };

  const onSave = async () => {
    try {
      console.log("Form data:", form); // Debugging line
      if (form.password !== form.passwordConfirmation) {
        toast("Passwords do not match", { description: "Please try again." });
        return;
      }

      await saveUser({
        variables: {
          payload: {
            id: form.id,
            username: form.username,
            name: form.name,
            company_initials: form.company_initials,
            phone_number: form.phone_number,
            premises_location: form.premises_location,
            email: form.email,
            district: form.district,
            image: form.imageFile ? form.imageFile : undefined,
            password: form.password ? form.password : undefined,
          },
        },
      });
      toast("Profile updated");
    } catch (e: any) {
      toast("Failed to update profile", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  /* return (
    <div className="card shadow-sm border-gray-200 dark:border-gray-700 w-full">
      <div className="card-header">
        <h3 className="card-title">My Profile</h3>
      </div>
      <div className="card-body space-y-4">
        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : error ? (
          <div className="text-sm text-danger">Failed to load profile</div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <img
                src={
                  form.previewUrl
                    ? `${URL_2}/imgs/${form.image}`
                    // ? String(form.previewUrl)
                    : toAbsoluteUrl("/media/avatars/blank.png")
                }
                alt={form.username}
                className="size-16 rounded-full object-cover"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && onUpload(e.target.files[0])
                  }
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Username
                </label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Company initials
                  </label>
                  <Input
                    value={form.company_initials}
                    onChange={(e) =>
                      setForm({ ...form, company_initials: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Phone Number
                  </label>
                  <Input
                    value={form.phone_number}
                    onChange={(e) =>
                      setForm({ ...form, phone_number: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  District
                </label>
                <Input
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
<<<<<<< Updated upstream
=======
                  Phone number
                </label>
                <Input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) =>
                    setForm({ ...form, phone_number: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
>>>>>>> Stashed changes
                  Premises location
                </label>
                <Input
                  value={form.premises_location}
                  onChange={(e) =>
                    setForm({ ...form, premises_location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Enter new Password
                </label>
                <Input
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Confirm password
                </label>
                <Input
                  value={form.passwordConfirmation}
                  onChange={(e) =>
                    setForm({ ...form, passwordConfirmation: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="card-footer flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  ); */
  return (
  <div className="card shadow-sm border-gray-200 dark:border-gray-700 w-full">
    <div className="card-header">
      <h3 className="card-title">My Profile</h3>
    </div>

    <div className="card-body space-y-6">
      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : error ? (
        <div className="text-sm text-danger">Failed to load profile</div>
      ) : (
        <>
          {/* PROFILE IMAGE */}
          <div className="flex flex-col items-center gap-4">
            <img
              src={
                form.previewUrl
                  ? `${URL_2}/imgs/${form.image}`
                  : toAbsoluteUrl("/media/avatars/blank.png")
              }
              alt={form.username}
              className="size-28 rounded-full object-cover shadow-md"
            />

            <label className="w-full">
              <span className="text-sm font-medium text-gray-700 mb-1 block text-center">
                Upload New Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && onUpload(e.target.files[0])}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0 file:text-sm file:font-medium 
                file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </label>
          </div>

          <div className="space-y-4 justify sm:max-w-[440px] lg:max-w-[800px]">

            {/* USERNAME */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Username
              </label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            {/* NAME */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* COMPANY INITIALS */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Company Initials
              </label>
              <Input
                value={form.company_initials}
                onChange={(e) =>
                  setForm({ ...form, company_initials: e.target.value })
                }
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Phone Number
              </label>
              <Input
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
              />
            </div>

            {/* DISTRICT */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                District
              </label>
              <Input
                value={form.district}
                onChange={(e) =>
                  setForm({ ...form, district: e.target.value })
                }
              />
            </div>

            {/* LOCATION */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Premises Location
              </label>
              <Input
                value={form.premises_location}
                onChange={(e) =>
                  setForm({ ...form, premises_location: e.target.value })
                }
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                New Password
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Confirm Password
              </label>
              <Input
                type="password"
                value={form.passwordConfirmation}
                onChange={(e) =>
                  setForm({ ...form, passwordConfirmation: e.target.value })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>

    <div className="card-footer flex justify-end">
      <Button onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  </div>
);


};

export { AccountDetailsEditor };
