import clsx from "clsx";
import { useFormik } from "formik";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";

import { useAuthContext } from "../../useAuthContext";
import { Alert, KeenIcon } from "@/components";
import { useLayout } from "@/providers";
import { useMutation } from "@apollo/client/react";
import { SIGNUP } from "@/gql/mutations";
import { REGISTER } from "@/gql/queries";

const initialValues = {
  username: "",
  name: "",
  company_initials: "",
  email: "",
  premises_location: "",
  phone_number: "",
  district: "",
  password: "",
  changepassword: "",
  acceptTerms: false,
};

const signupSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Username is required"),
  name: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Name is required"),
  company_initials: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Company initials is required"),
  district: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("District is required"),
  email: Yup.string()
    .email("Wrong email format")
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Email is required"),
  premises_location: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Premises Location is required"),
  phone_number: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Phone number is required"),
  password: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Password is required"),
  changepassword: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required("Password confirmation is required")
    .oneOf([Yup.ref("password")], "Password and Confirm Password didn't match"),
  acceptTerms: Yup.bool().required("You must accept the terms and conditions"),
});

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { currentLayout } = useLayout();

  const [RegisterUser, { loading: createUser, error, data }] =
    useMutation(REGISTER);

  const formik = useFormik({
    initialValues,
    validationSchema: signupSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      try {
        if (!register) {
          throw new Error("JWTProvider is required for this form.");
        }
        // await register(values.email, values.password, values.changepassword);
        const res = await RegisterUser({
          variables: {
            payload: {
              username: values.username,
              name: values.name,
              company_initials: values.company_initials,
              premises_location: values.premises_location,
              phone_number: values.phone_number,
              email: values.email,
              district: values.email,
              password: values.password,
            },
          },
        });
        // Redirect to login with success state so alert is shown there
        const loginPath =
          currentLayout?.name === "auth-branded"
            ? "/auth/login"
            : "/auth/classic/login";
        setLoading(false);
        navigate(loginPath, { replace: true, state: { signupSuccess: true } });
      } catch (error) {
        console.error(error);
        setStatus("The sign up details are incorrect");
        setSubmitting(false);
        setLoading(false);
      }
    },
  });

  const togglePassword = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  const toggleConfirmPassword = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="card max-w-[420px] lg:max-w-[520px] w-full">
      <form
        className="card-body flex flex-col gap-5 lg:gap-4 p-10"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <div className="text-center mb-2.5 flex flex-col items-center gap-2">
          <img
            src={`https://seedtracking.net/assets/images/maaif.png`}
            className="h-20 w-20"
          />
          <h3 className="text-lg font-semibold text-gray-900 leading-none mb-1">
            Create Account
          </h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-2sm text-gray-600 me-1.5">
              Already have an account?
            </span>
            <Link
              to={
                currentLayout?.name === "auth-branded"
                  ? "/auth/login"
                  : "/auth/classic/login"
              }
              className="text-2sm link"
            >
              Sign in
            </Link>
          </div>
        </div>

        {error?.message && <Alert variant="danger">{error.message}</Alert>}

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Username</label>
          <label className="input">
            <input
              placeholder="NASECO SEEDS"
              type="text"
              autoComplete="off"
              {...formik.getFieldProps("username")}
              className={clsx(
                "form-control",
                {
                  "is-invalid":
                    formik.touched.username && formik.errors.username,
                },
                {
                  "is-valid":
                    formik.touched.username && !formik.errors.username,
                },
              )}
            />
          </label>
          {formik.touched.username && formik.errors.username && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.username}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Name</label>
            <label className="input">
              <input
                placeholder="National seed company"
                type="text"
                autoComplete="off"
                {...formik.getFieldProps("name")}
                className={clsx(
                  "form-control",
                  { "is-invalid": formik.touched.name && formik.errors.name },
                  {
                    "is-valid": formik.touched.name && !formik.errors.name,
                  },
                )}
              />
            </label>
            {formik.touched.name && formik.errors.name && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.name}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Company Initials</label>
            <label className="input">
              <input
                placeholder="Mary"
                type="text"
                autoComplete="off"
                {...formik.getFieldProps("company_initials")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.company_initials &&
                      formik.errors.company_initials,
                  },
                  {
                    "is-valid":
                      formik.touched.company_initials &&
                      !formik.errors.company_initials,
                  },
                )}
              />
            </label>
            {formik.touched.company_initials &&
              formik.errors.company_initials && (
                <span role="alert" className="text-danger text-xs mt-1">
                  {formik.errors.company_initials}
                </span>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Email</label>
            <label className="input">
              <input
                placeholder="email@email.com"
                type="email"
                autoComplete="off"
                {...formik.getFieldProps("email")}
                className={clsx(
                  "form-control",
                  { "is-invalid": formik.touched.email && formik.errors.email },
                  {
                    "is-valid": formik.touched.email && !formik.errors.email,
                  },
                )}
              />
            </label>
            {formik.touched.email && formik.errors.email && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.email}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Phone Number</label>
            <label className="input">
              <input
                placeholder="0753....."
                type="text"
                autoComplete="off"
                {...formik.getFieldProps("phone_number")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.phone_number && formik.errors.phone_number,
                  },
                  {
                    "is-valid":
                      formik.touched.phone_number &&
                      !formik.errors.phone_number,
                  },
                )}
              />
            </label>
            {formik.touched.phone_number && formik.errors.phone_number && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.phone_number}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">District</label>
            <label className="input">
              <input
                placeholder="Kampala"
                type="text"
                autoComplete="off"
                {...formik.getFieldProps("district")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.district && formik.errors.district,
                  },
                  {
                    "is-valid":
                      formik.touched.district && !formik.errors.district,
                  },
                )}
              />
            </label>
            {formik.touched.district && formik.errors.district && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.district}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">
              Premises location
            </label>
            <label className="input">
              <input
                placeholder="Naguru plot 12"
                type="email"
                autoComplete="off"
                {...formik.getFieldProps("premises_location")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.premises_location &&
                      formik.errors.premises_location,
                  },
                  {
                    "is-valid":
                      formik.touched.premises_location &&
                      !formik.errors.premises_location,
                  },
                )}
              />
            </label>
            {formik.touched.premises_location &&
              formik.errors.premises_location && (
                <span role="alert" className="text-danger text-xs mt-1">
                  {formik.errors.premises_location}
                </span>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Password</label>
            <label className="input">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                autoComplete="off"
                {...formik.getFieldProps("password")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.password && formik.errors.password,
                  },
                  {
                    "is-valid":
                      formik.touched.password && !formik.errors.password,
                  },
                )}
              />
              <button className="btn btn-icon" onClick={togglePassword}>
                <KeenIcon
                  icon="eye"
                  className={clsx("text-gray-500", { hidden: showPassword })}
                />
                <KeenIcon
                  icon="eye-slash"
                  className={clsx("text-gray-500", { hidden: !showPassword })}
                />
              </button>
            </label>
            {formik.touched.password && formik.errors.password && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.password}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="form-label text-gray-900">Confirm Password</label>
            <label className="input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter Password"
                autoComplete="off"
                {...formik.getFieldProps("changepassword")}
                className={clsx(
                  "form-control",
                  {
                    "is-invalid":
                      formik.touched.changepassword &&
                      formik.errors.changepassword,
                  },
                  {
                    "is-valid":
                      formik.touched.changepassword &&
                      !formik.errors.changepassword,
                  },
                )}
              />
              <button className="btn btn-icon" onClick={toggleConfirmPassword}>
                <KeenIcon
                  icon="eye"
                  className={clsx("text-gray-500", {
                    hidden: showConfirmPassword,
                  })}
                />
                <KeenIcon
                  icon="eye-slash"
                  className={clsx("text-gray-500", {
                    hidden: !showConfirmPassword,
                  })}
                />
              </button>
            </label>
            {formik.touched.changepassword && formik.errors.changepassword && (
              <span role="alert" className="text-danger text-xs mt-1">
                {formik.errors.changepassword}
              </span>
            )}
          </div>
        </div>

        <label className="checkbox-group">
          <input
            className="checkbox checkbox-sm"
            type="checkbox"
            {...formik.getFieldProps("acceptTerms")}
          />
          <span className="checkbox-label">
            I accept{" "}
            <Link to="#" className="text-2sm link">
              Terms & Conditions
            </Link>
          </span>
        </label>

        {formik.touched.acceptTerms && formik.errors.acceptTerms && (
          <span role="alert" className="text-danger text-xs mt-1">
            {formik.errors.acceptTerms}
          </span>
        )}

        <button
          type="submit"
          className="btn btn-primary flex justify-center grow"
          disabled={createUser || formik.isSubmitting}
        >
          {createUser ? "Please wait..." : "Sign UP"}
        </button>
      </form>
    </div>
  );
};

export { Signup };
