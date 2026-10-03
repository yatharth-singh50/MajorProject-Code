import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Enter your username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't sign in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <ShieldCheck size={34} className="text-brand" strokeWidth={1.6} />
          <h1 className="font-serif text-2xl font-semibold italic text-text">Sāthi</h1>
          <p className="text-[13px] text-text-faint">Sign in to keep checking the facts.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="identifier" className="text-[13px] font-medium text-text-dim">
              Username or email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="focus-ring h-10 rounded-lg border border-border bg-bg-inset px-3 text-[14px] text-text placeholder:text-text-faint"
              placeholder="meera_desk or meera@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-text-dim">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring h-10 rounded-lg border border-border bg-bg-inset px-3 text-[14px] text-text placeholder:text-text-faint"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-fake-soft px-3 py-2 text-[13px] text-fake">{error}</p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-text-faint">
          New here?{" "}
          <Link to="/signup" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
