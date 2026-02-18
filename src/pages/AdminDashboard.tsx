import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Building2, FileText, Trash2 } from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Overview", path: "/admin" },
  { icon: <Users className="w-4 h-4" />, label: "Users", path: "/admin/users" },
  { icon: <Building2 className="w-4 h-4" />, label: "Properties", path: "/admin/properties" },
  { icon: <FileText className="w-4 h-4" />, label: "Applications", path: "/admin/applications" },
];

// ========================
// ADMIN OVERVIEW
// ========================
export function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, properties: 0, applications: 0, maintenance: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: properties }, { count: applications }, { count: maintenance }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("properties").select("*", { count: "exact", head: true }),
        supabase.from("rental_applications").select("*", { count: "exact", head: true }),
        supabase.from("maintenance_requests").select("*", { count: "exact", head: true }),
      ]);
      setStats({ users: users || 0, properties: properties || 0, applications: applications || 0, maintenance: maintenance || 0 });
    })();
  }, []);

  const STAT_CARDS = [
    { label: "Total Users", value: stats.users, icon: <Users className="w-5 h-5" />, color: "text-primary bg-accent" },
    { label: "Total Properties", value: stats.properties, icon: <Building2 className="w-5 h-5" />, color: "text-success bg-success/10" },
    { label: "Total Applications", value: stats.applications, icon: <FileText className="w-5 h-5" />, color: "text-warning bg-warning/10" },
    { label: "Maintenance Requests", value: stats.maintenance, icon: <FileText className="w-5 h-5" />, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Platform overview and management" sidebarItems={SIDEBAR_ITEMS} roleLabel="Admin Panel">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-muted-foreground text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ========================
// ADMIN USERS
// ========================
export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers(profiles || []);
    const roleMap: Record<string, string> = {};
    (roleData || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setRoles(roleMap);
    setLoading(false);
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "badge-approved",
    owner: "badge-pending",
    tenant: "badge-in-progress",
  };

  return (
    <DashboardLayout title="User Management" subtitle="View all registered users" sidebarItems={SIDEBAR_ITEMS} roleLabel="Admin Panel">
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-card border rounded-xl" />)}</div> :
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{["Name", "Email", "Role", "Joined"].map(h => <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {u.full_name?.charAt(0) || "U"}
                    </div>
                    <span className="font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  {roles[u.id] ? (
                    <span className={ROLE_COLORS[roles[u.id]] || "badge-pending"}>{roles[u.id]}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">No role</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border text-muted-foreground text-xs">
          {users.length} users total
        </div>
      </div>}
    </DashboardLayout>
  );
}

// ========================
// ADMIN PROPERTIES
// ========================
export function AdminProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data } = await supabase.from("properties").select("*, profiles(full_name, email)").order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property? This action cannot be undone.")) return;
    await supabase.from("properties").delete().eq("id", id);
    fetchProperties();
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from("properties").update({ is_available: !current }).eq("id", id);
    fetchProperties();
  };

  return (
    <DashboardLayout title="All Properties" subtitle="Manage and moderate property listings" sidebarItems={SIDEBAR_ITEMS} roleLabel="Admin Panel">
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card border rounded-xl" />)}</div> :
      properties.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">🏠</div><p className="text-muted-foreground">No properties listed yet</p></div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Property", "Owner", "City", "Price", "Status", "Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {properties.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium max-w-48 truncate">{p.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.profiles?.full_name}</td>
                  <td className="px-4 py-3">{p.city}</td>
                  <td className="px-4 py-3 font-semibold">${Number(p.price).toLocaleString()}/mo</td>
                  <td className="px-4 py-3">
                    <span className={p.is_available ? "badge-approved" : "badge-rejected"}>
                      {p.is_available ? "Available" : "Rented"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleAvailability(p.id, p.is_available)} className="text-xs">
                      {p.is_available ? "Mark Rented" : "Mark Available"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)} className="gap-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border text-muted-foreground text-xs">
            {properties.length} properties total
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ========================
// ADMIN APPLICATIONS
// ========================
export function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase.from("rental_applications").select("*, properties(*), profiles(*)").order("created_at", { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("rental_applications").update({ status }).eq("id", id);
    fetchApplications();
  };

  return (
    <DashboardLayout title="All Applications" subtitle="Monitor and manage all rental applications" sidebarItems={SIDEBAR_ITEMS} roleLabel="Admin Panel">
      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-card border rounded-xl" />)}</div> :
      applications.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">📋</div><p className="text-muted-foreground">No applications yet</p></div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold">{app.properties?.title}</h3>
                  <p className="text-sm text-muted-foreground">Tenant: {app.profiles?.full_name} • {app.profiles?.email}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">City: {app.properties?.city} • ${Number(app.properties?.price || 0).toLocaleString()}/mo</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge-${app.status}`}>{app.status}</span>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateStatus(app.id, "approved")} className="bg-success hover:bg-success/90 text-success-foreground gap-1">Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
