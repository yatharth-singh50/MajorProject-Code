import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

// Mirrors the backend's RegisterRequest validation (app/models/schemas.py)
// so obviously-invalid input gets caught before a round trip.
const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,32}$/;

function Field({ id, label, type = "text", value, onChange, autoComplete, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-text-dim">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring h-10 rounded-lg border border-border bg-bg-inset px-3 text-[14px] text-text placeholder:text-text-faint"
        placeholder={placeholder}
      />
    </div>
  );
}

export default function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!USERNAME_PATTERN.test(username.trim())) {
      setError("Username must be 3–32 characters: letters, numbers, underscores, or periods.");
      return;
    }
    if (!email.trim()) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <ShieldCheck size={34} className="text-brand" strokeWidth={1.6} />
          <h1 className="font-serif text-2xl font-semibold italic text-text">Sāthi</h1>
          <p className="text-[13px] text-text-faint">Create an account to start posting.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <Field id="username" label="Username" value={username} onChange={setUsername} autoComplete="username" placeholder="meera_desk" />
          <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
          <Field
            id="displayName"
            label="Display name (optional)"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="name"
            placeholder="Meera Krishnan"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <Field
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="••••••••"
          />

          {error && (
            <p className="rounded-lg bg-fake-soft px-3 py-2 text-[13px] text-fake">{error}</p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-text-faint">
          Already have an account?{" "}
          <Link to="/signin" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
