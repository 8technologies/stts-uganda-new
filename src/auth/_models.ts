import { type TLanguageCode } from '@/i18n';

export interface AuthModel {
  access_token: string;
  refreshToken?: string;
  api_token?: string;
}

// export interface UserModel {
//   id: number;
//   username: string;
//   password: string | undefined;
//   email: string;
//   name: string;
//   last_name: string;
//   fullname?: string;
//   occupation?: string;
//   companyName?: string;
//   phone?: string;
//   roles?: number[];
//   pic?: string;
//   language?: TLanguageCode;
//   auth?: AuthModel;
// }

export interface UserModel {
  id: string;
  username: string;
  password: string | undefined;
  email: string;
  name: string;
  company_initials: string;
  premises_location: string;
  phone_number: string;
  district?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
  // roles?: number[];
  // language?: TLanguageCode;
  // auth?: AuthModel;
}
