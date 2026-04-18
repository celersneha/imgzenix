import { useNavigate } from "react-router";
import type { AuthFormValues } from "@/components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAuthError,
  selectAuthLoading,
} from "@/redux/selectors/authSelectors";
import {
  clearAuthError,
  loginUser,
  registerUser,
} from "@/redux/slices/authSlice";

export function useRegisterForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const handleSubmit = async (values: AuthFormValues) => {
    if (!values.Name) {
      return;
    }

    dispatch(clearAuthError());

    const registerResult = await dispatch(
      registerUser({
        Name: values.Name,
        email: values.email,
        password: values.password,
      }),
    );

    if (registerUser.fulfilled.match(registerResult)) {
      const loginResult = await dispatch(
        loginUser({ email: values.email, password: values.password }),
      );

      if (loginUser.fulfilled.match(loginResult)) {
        navigate("/dashboard");
      }
    }
  };

  return {
    isLoading,
    error,
    handleSubmit,
  };
}
