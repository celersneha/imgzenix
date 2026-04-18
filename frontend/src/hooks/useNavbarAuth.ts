import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "@/redux/selectors/authSelectors";
import { logoutUser } from "@/redux/slices/authSlice";

export function useNavbarAuth() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return {
    user,
    isAuthenticated,
    handleLogout,
  };
}
