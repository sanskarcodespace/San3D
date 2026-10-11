"use client";
import { useActionState } from "react";
import { signIn } from "../actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="admin-form">
      <label>
        Email
        <input type="email" name="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && (
        <p role="alert" className="admin-error">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="admin-primary">
        {pending ? "Signing in…" : "Sign in to your studio"}
      </button>
    </form>
  );
}
