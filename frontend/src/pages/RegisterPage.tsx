import { Link } from "react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { useRegisterForm } from "@/hooks/useRegisterForm";

export default function RegisterPage() {
  const { isLoading, error, handleSubmit } = useRegisterForm();

  return (
    <section className="mx-auto max-w-md space-y-5">
      <AuthForm
        mode="register"
        loading={isLoading}
        error={error}
        onSubmit={handleSubmit}
      />
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="subtle-link">
          Login
        </Link>
      </p>
    </section>
  );
}
