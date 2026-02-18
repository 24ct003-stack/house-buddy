import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "owner") return "/owner";
    if (userRole === "tenant") return "/tenant";
    return "/";
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-card">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block">RentEase</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/properties"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/properties") ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              Browse Properties
            </Link>
            {user && (
              <Link
                to={getDashboardPath()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(getDashboardPath()) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm max-w-24 truncate">{profile?.full_name || "User"}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
                <Button size="sm" onClick={() => navigate("/register")}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1 animate-fade-in">
            <Link to="/properties" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Browse Properties</Link>
            {user ? (
              <>
                <Link to={getDashboardPath()} className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/profile" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>My Profile</Link>
                <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="block px-3 py-2 rounded-lg text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
