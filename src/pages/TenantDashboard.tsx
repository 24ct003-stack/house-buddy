import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LayoutDashboard, Search, FileText, DollarSign, Wrench, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const SIDEBAR_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Overview", path: "/tenant" },
  { icon: <Search className="w-4 h-4" />, label: "Browse Properties", path: "/properties" },
  { icon: <FileText className="w-4 h-4" />, label: "My Applications", path: "/tenant/applications" },
  { icon: <DollarSign className="w-4 h-4" />, label: "Payments", path: "/tenant/payments" },
  { icon: <Wrench className="w-4 h-4" />, label: "Maintenance", path: "/tenant/maintenance" },
];

// ========================
// OVERVIEW
// ========================
export function TenantDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ applications: 0, approved: 0, payments: 0, maintenance: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: apps }, { count: approved }, { count: payments }, { count: maint }] = await Promise.all([
        supabase.from("rental_applications").select("*", { count: "exact", head: true }).eq("tenant_id", user.id),
        supabase.from("rental_applications").select("*", { count: "exact", head: true }).eq("tenant_id", user.id).eq("status", "approved"),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("tenant_id", user.id),
        supabase.from("maintenance_requests").select("*", { count: "exact", head: true }).eq("tenant_id", user.id),
      ]);
      setStats({ applications: apps || 0, approved: approved || 0, payments: payments || 0, maintenance: maint || 0 });
    })();
  }, [user]);

  const STAT_CARDS = [
    { label: "Total Applications", value: stats.applications, icon: <FileText className="w-5 h-5" />, color: "text-primary bg-accent" },
    { label: "Approved", value: stats.approved, icon: <FileText className="w-5 h-5" />, color: "text-success bg-success/10" },
    { label: "Payments Made", value: stats.payments, icon: <DollarSign className="w-5 h-5" />, color: "text-warning bg-warning/10" },
    { label: "Maintenance Requests", value: stats.maintenance, icon: <Wrench className="w-5 h-5" />, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <DashboardLayout title={`Hello, ${profile?.full_name?.split(" ")[0] || "Tenant"}`} subtitle="Manage your rental experience" sidebarItems={SIDEBAR_ITEMS} roleLabel="Tenant Portal">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-muted-foreground text-sm">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-6 shadow-card">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/properties"><Button className="gap-2"><Search className="w-4 h-4" /> Browse Properties</Button></Link>
          <Link to="/tenant/applications"><Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> My Applications</Button></Link>
          <Link to="/tenant/maintenance"><Button variant="outline" className="gap-2"><Wrench className="w-4 h-4" /> Maintenance</Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ========================
// APPLICATIONS
// ========================
export function TenantApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchApplications(); }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase.from("rental_applications").select("*, properties(*)").eq("tenant_id", user!.id).order("created_at", { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout title="My Applications" subtitle="Track your rental applications" sidebarItems={SIDEBAR_ITEMS} roleLabel="Tenant Portal">
      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-card border rounded-xl" />)}</div> :
      applications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-lg mb-2">No applications yet</h3>
          <Link to="/properties"><Button className="gap-2"><Search className="w-4 h-4" /> Browse Properties</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold">{app.properties?.title}</h3>
                  <p className="text-muted-foreground text-sm">{app.properties?.address}, {app.properties?.city}</p>
                  <p className="text-primary font-semibold mt-1">${Number(app.properties?.price || 0).toLocaleString()}/mo</p>
                  {app.move_in_date && <p className="text-sm text-muted-foreground mt-1">Move-in: {new Date(app.move_in_date).toLocaleDateString()}</p>}
                  {app.message && <p className="text-sm italic text-muted-foreground mt-2">"{app.message}"</p>}
                  <p className="text-xs text-muted-foreground mt-2">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className={`badge-${app.status}`}>{app.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ========================
// PAYMENTS
// ========================
export function TenantPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ application_id: "", amount: "", month: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) { fetchPayments(); fetchApplications(); } }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select("*, rental_applications(*, properties(*))").eq("tenant_id", user!.id).order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from("rental_applications").select("*, properties(*)").eq("tenant_id", user!.id).eq("status", "approved");
    setApplications(data || []);
  };

  const handleSubmit = async () => {
    setSaving(true);
    await supabase.from("payments").insert({
      application_id: form.application_id,
      tenant_id: user!.id,
      amount: Number(form.amount),
      month: form.month,
      notes: form.notes,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ application_id: "", amount: "", month: "", notes: "" });
    fetchPayments();
  };

  return (
    <DashboardLayout title="Payment History" subtitle="Manage your rent payments" sidebarItems={SIDEBAR_ITEMS} roleLabel="Tenant Portal">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={applications.length === 0}>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>
      {applications.length === 0 && (
        <div className="bg-accent/50 border border-accent rounded-xl p-4 text-sm mb-6">
          You need an approved application to record payments.
        </div>
      )}
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl" />)}</div> :
      payments.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">💳</div><p className="text-muted-foreground">No payment records yet</p></div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Property", "Month", "Amount", "Status", "Paid At"].map(h => <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.rental_applications?.properties?.title}</td>
                  <td className="px-4 py-3">{p.month}</td>
                  <td className="px-4 py-3 font-semibold">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge-${p.status}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Rent Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Property (Approved Applications)</Label>
              <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background mt-1" value={form.application_id} onChange={e => setForm({ ...form, application_id: e.target.value })}>
                <option value="">Select property...</option>
                {applications.map(a => <option key={a.id} value={a.id}>{a.properties?.title} - ${a.properties?.price}/mo</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Month (e.g. January 2025)</Label>
              <Input placeholder="January 2025" className="mt-1" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" placeholder="1200" className="mt-1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea placeholder="Any notes..." className="mt-1" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={saving || !form.application_id || !form.amount || !form.month} className="flex-1">
                {saving ? "Submitting..." : "Submit Payment"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ========================
// MAINTENANCE
// ========================
export function TenantMaintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [myProps, setMyProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ property_id: "", title: "", description: "", priority: "medium" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) { fetchRequests(); fetchApprovedProperties(); } }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase.from("maintenance_requests").select("*, properties(*)").eq("tenant_id", user!.id).order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const fetchApprovedProperties = async () => {
    const { data } = await supabase.from("rental_applications").select("*, properties(*)").eq("tenant_id", user!.id).eq("status", "approved");
    setMyProps(data || []);
  };

  const handleSubmit = async () => {
    setSaving(true);
    await supabase.from("maintenance_requests").insert({
      property_id: form.property_id,
      tenant_id: user!.id,
      title: form.title,
      description: form.description,
      priority: form.priority,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ property_id: "", title: "", description: "", priority: "medium" });
    fetchRequests();
  };

  return (
    <DashboardLayout title="Maintenance Requests" subtitle="Submit and track maintenance issues" sidebarItems={SIDEBAR_ITEMS} roleLabel="Tenant Portal">
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(true)} className="gap-2" disabled={myProps.length === 0}>
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>
      {myProps.length === 0 && (
        <div className="bg-accent/50 border border-accent rounded-xl p-4 text-sm mb-6">
          You need an approved rental application to submit maintenance requests.
        </div>
      )}
      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-card border rounded-xl" />)}</div> :
      requests.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">🔧</div><p className="text-muted-foreground">No maintenance requests yet</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <span className={`badge-${r.status === "in_progress" ? "in-progress" : r.status === "completed" ? "completed" : "pending"}`}>{r.status.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-full capitalize">{r.priority}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.properties?.title}</p>
                  <p className="text-sm mt-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Property</Label>
              <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background mt-1" value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}>
                <option value="">Select property...</option>
                {myProps.map(a => <option key={a.properties?.id} value={a.properties?.id}>{a.properties?.title}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Issue Title</Label>
              <Input placeholder="e.g. Broken faucet" className="mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background mt-1" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Describe the issue in detail..." className="mt-1" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={saving || !form.property_id || !form.title || !form.description} className="flex-1">
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
