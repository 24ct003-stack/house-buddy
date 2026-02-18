import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Search, Shield, Building2, Users, Star, ArrowRight, CheckCircle } from "lucide-react";

const STATS = [
  { label: "Properties Listed", value: "500+" },
  { label: "Happy Tenants", value: "1,200+" },
  { label: "Cities Covered", value: "25+" },
  { label: "Trusted Owners", value: "300+" },
];

const FEATURES = [
  {
    icon: <Search className="w-6 h-6" />,
    title: "Easy Property Search",
    desc: "Browse hundreds of verified listings with advanced filters for price, location, and amenities.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure Applications",
    desc: "Apply for properties safely. Track your application status in real-time.",
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Owner Dashboard",
    desc: "Manage all your listings, review tenant applications, and track payments effortlessly.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Maintenance Requests",
    desc: "Submit and track maintenance requests directly through the platform.",
  },
];

export default function Index() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "owner") return "/owner";
    return "/tenant";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        <div className="page-container relative text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/20 text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Star className="w-3.5 h-3.5" /> #1 House Rental Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            Find Your Perfect
            <br />
            <span className="opacity-90">Home to Rent</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Browse verified properties, apply online, and manage your rental — all in one place. Simple, fast, and secure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/properties")}
              className="gap-2 font-semibold"
            >
              <Search className="w-4 h-4" /> Browse Properties
            </Button>
            {user ? (
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                onClick={() => navigate(getDashboardPath())}
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                onClick={() => navigate("/register")}
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete rental management platform for tenants and property owners.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6 card-hover shadow-card">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Get started in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Register as a tenant or property owner in under 2 minutes." },
              { step: "02", title: "Find / List Property", desc: "Browse available properties or list yours with photos and details." },
              { step: "03", title: "Apply & Manage", desc: "Apply for properties, track applications, and manage payments." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="text-5xl font-black text-primary/20 leading-none">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-primary text-sm">
                    <CheckCircle className="w-4 h-4" /> Free to use
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Home?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join thousands of tenants and owners on RentEase today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/register")}>Create Free Account</Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/properties")}>Browse Listings</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <div className="w-7 h-7 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Home className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            RentEase
          </div>
          <p className="text-muted-foreground text-sm">© 2024 RentEase. Built for college project purposes.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/properties" className="hover:text-foreground">Properties</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
