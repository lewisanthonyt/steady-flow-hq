import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/steadyworks-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Steady Works HQ — Login" },
      { name: "description", content: "Manage jobs. Track profit. Grow smarter." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("boss@steadyworks.co.uk");
  const [password, setPassword] = useState("demo");

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-sidebar-foreground overflow-hidden"
        style={{ background: "var(--gradient-dark)" }}>
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }} />
        <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full opacity-20 blur-3xl bg-primary" />

        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Steady Works logo" className="h-12 w-12 object-contain" />
          <div className="leading-tight">
            <div className="font-extrabold tracking-tight">STEADY WORKS</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/60">Plumbing & Maintenance</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Manage jobs.<br />
            Track profit.<br />
            <span className="text-primary">Grow smarter.</span>
          </h1>
          <p className="text-white/70 max-w-sm">
            Your private command centre — every job, every customer, every penny in one place.
          </p>
        </div>

        <div className="relative flex gap-6 text-xs text-white/50">
          <span>v1.0 · Demo</span>
          <span>·</span>
          <span>Internal use only</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <img src={logo} alt="Steady Works" className="h-12 w-12 object-contain" />
            <span className="font-extrabold tracking-tight">STEADY WORKS</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, Boss 👷‍♂️</h2>
            <p className="text-sm text-muted-foreground">Sign in to your Steady Works HQ console.</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md">
              Log in
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo mode — any details work.{" "}
              <Link to="/dashboard" className="text-primary hover:underline font-medium">Skip to dashboard</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
