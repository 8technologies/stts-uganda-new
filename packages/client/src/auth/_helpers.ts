import { User as Auth0UserModel } from "@auth0/auth0-spa-js";

import { getData, setData } from "@/utils";
import { type AuthModel, type UserModel } from "./_models";

const AUTH_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-auth-v${
  import.meta.env.VITE_APP_VERSION
}`;

const USER_LOCAL_STORAGE_KEY = `${import.meta.env.VITE_APP_NAME}-user-v${
  import.meta.env.VITE_APP_VERSION
}`;

const getAuth = (): AuthModel | undefined => {
  try {
    const auth = getData(AUTH_LOCAL_STORAGE_KEY) as AuthModel | undefined;

    if (auth) {
      return auth;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("AUTH LOCAL STORAGE PARSE ERROR", error);
  }
};

const setAuth = (auth: AuthModel | Auth0UserModel) => {
  setData(AUTH_LOCAL_STORAGE_KEY, auth);
};

const getUser = (): UserModel | undefined => {
  try {
    const user = getData(USER_LOCAL_STORAGE_KEY) as UserModel | undefined;

    if (user) {
      return user;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("USER LOCAL STORAGE PARSE ERROR", error);
  }
};

const setUser = (user: UserModel) => {
  setData(USER_LOCAL_STORAGE_KEY, user);
};

const removeUser = () => {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(USER_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("USER LOCAL STORAGE REMOVE ERROR", error);
  }
};

const removeAuth = () => {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("AUTH LOCAL STORAGE REMOVE ERROR", error);
  }
};

export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = "application/json";
  axios.interceptors.request.use(
    (config: { headers: { Authorization: string } }) => {
      const auth = getAuth();

      if (auth?.access_token) {
        config.headers.Authorization = `Bearer ${auth.access_token}`;
      }

      return config;
    },
    async (err: any) => await Promise.reject(err),
  );
}

export {
  AUTH_LOCAL_STORAGE_KEY,
  USER_LOCAL_STORAGE_KEY,
  getAuth,
  getUser,
  removeAuth,
  removeUser,
  setAuth,
  setUser,
};
