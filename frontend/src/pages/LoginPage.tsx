import { Link, Navigate } from "react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { useLoginForm } from "@/hooks/useLoginForm";

export default function LoginPage() {
  const { isAuthenticated, isLoading, handleSubmit } = useLoginForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="mx-auto max-w-md space-y-5">
      <AuthForm mode="login" loading={isLoading} onSubmit={handleSubmit} />
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/register" className="subtle-link">
          Create an account
        </Link>
      </p>
    </section>
  );
}
