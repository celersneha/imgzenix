import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface AuthFormValues {
  Name?: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<void>;
}

export function AuthForm({ mode, loading, onSubmit }: AuthFormProps) {
  const [values, setValues] = useState<AuthFormValues>({
    Name: "",
    email: "",
    password: "",
  });

  const isRegister = mode === "register";

  const update = (field: keyof AuthFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="panel-surface space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">
        {isRegister ? "Create account" : "Welcome back"}
      </h1>

      {isRegister ? (
        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">Name</span>
          <input
            required
            value={values.Name}
            onChange={(e) => update("Name", e.target.value)}
            className="form-field"
            placeholder="John Doe"
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm text-muted-foreground">Email</span>
        <input
          type="email"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          className="form-field"
          placeholder="john@example.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm text-muted-foreground">Password</span>
        <input
          type="password"
          required
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          className="form-field"
          placeholder="********"
        />
      </label>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
      </Button>
    </form>
  );
}
