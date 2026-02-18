import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

const ROLES = [
  { value: "tenant", label: "Tenant", desc: "Looking for a property to rent" },
  { value: "owner", label: "Property Owner", desc: "I want to list my properties" },
];

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [role, setRole] = useState("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!form.fullName.trim()) return setError("Full name is required");
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, role);
    setLoading(false);
    if (error) setError(error.message || "Failed to create account");
    else navigate(role === "owner" ? "/owner" : "/tenant");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            RentEase
          </Link>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-card p-8">
          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  role === r.value
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{r.label}</span>
                  {role === r.value && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Creating account..." : `Create ${role === "owner" ? "Owner" : "Tenant"} Account`}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
