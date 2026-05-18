interface IUsersData {
  user: {
    avatar: string;
    userName: string;
    userGmail: string;
  };
  role: string;
  status: {
    label: string;
    color: string;
  };
  location: string;
  activity: string;
  created_at?: string;
}
export { type IUsersData };
