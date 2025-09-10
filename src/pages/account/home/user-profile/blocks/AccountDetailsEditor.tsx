import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { ME } from '@/gql/queries';
import { CREATE_USER } from '@/gql/mutations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl } from '@/utils';
import { toast } from 'sonner';

const AccountDetailsEditor = () => {
  const { data, loading, error, refetch } = useQuery(ME);
  const [saveUser, { loading: saving }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: ME }],
    awaitRefetchQueries: true
  });

  const me = data?.me;
  const [form, setForm] = useState({
    id: '',
    username: '',
    first_name: '',
    other_names: '',
    email: '',
    district: '',
    image: '',
    imageFile: null as File | null,
    previewUrl: ''
  });

  useEffect(() => {
    if (me) {
      setForm({
        id: String(me.id ?? ''),
        username: me.username ?? '',
        first_name: me.first_name ?? '',
        other_names: me.other_names ?? '',
        email: me.email ?? '',
        district: me.district ?? '',
        image: me.image ?? '',
        imageFile: null,
        previewUrl: me.image ?? ''
      });
    }
  }, [me]);

  const onUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, imageFile: file, previewUrl: url }));
  };

  const onSave = async () => {
    try {
      await saveUser({
        variables: {
          payload: {
            id: form.id,
            username: form.username,
            first_name: form.first_name,
            other_names: form.other_names,
            email: form.email,
            district: form.district,
            image: form.imageFile ? form.imageFile : undefined
          }
        }
      });
      toast('Profile updated');
    } catch (e: any) {
      toast('Failed to update profile', { description: e?.message ?? 'Unknown error' });
    }
  };

  return (
    <div className="card">
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
                src={form.previewUrl ? String(form.previewUrl) : toAbsoluteUrl('/media/avatars/blank.png')}
                alt={form.username}
                className="size-16 rounded-full object-cover"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && onUpload(e.target.files[0])}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">First Name</label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Other Names</label>
                <Input
                  value={form.other_names}
                  onChange={(e) => setForm({ ...form, other_names: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">District</label>
                <Input
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="card-footer flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export { AccountDetailsEditor };
