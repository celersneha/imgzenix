import { useNavigate } from "react-router";
import type { AuthFormValues } from "@/components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
} from "@/redux/selectors/authSelectors";
import { clearAuthError, loginUser } from "@/redux/slices/authSlice";

export function useLoginForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const handleSubmit = async (values: AuthFormValues) => {
    dispatch(clearAuthError());
    const result = await dispatch(
      loginUser({
        email: values.email,
        password: values.password,
      }),
    );

    if (loginUser.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    error,
    handleSubmit,
  };
}
