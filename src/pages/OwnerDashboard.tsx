import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutDashboard, Building2, FileText, Wrench, DollarSign,
  Plus, CheckCircle, XCircle, Clock, Pencil, Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SIDEBAR_ITEMS = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: "Overview", path: "/owner" },
  { icon: <Building2 className="w-4 h-4" />, label: "My Properties", path: "/owner/properties" },
  { icon: <FileText className="w-4 h-4" />, label: "Applications", path: "/owner/applications" },
  { icon: <DollarSign className="w-4 h-4" />, label: "Payments", path: "/owner/payments" },
  { icon: <Wrench className="w-4 h-4" />, label: "Maintenance", path: "/owner/maintenance" },
];

// ========================
// OVERVIEW
// ========================
export function OwnerDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ properties: 0, applications: 0, pending: 0, maintenance: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: props }, { count: apps }, { count: pending }, { count: maint }] = await Promise.all([
        supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("rental_applications").select("*, properties!inner(*)", { count: "exact", head: true }).eq("properties.owner_id", user.id),
        supabase.from("rental_applications").select("*, properties!inner(*)", { count: "exact", head: true }).eq("properties.owner_id", user.id).eq("status", "pending"),
        supabase.from("maintenance_requests").select("*, properties!inner(*)", { count: "exact", head: true }).eq("properties.owner_id", user.id).eq("status", "pending"),
      ]);
      setStats({ properties: props || 0, applications: apps || 0, pending: pending || 0, maintenance: maint || 0 });
    })();
  }, [user]);

  const STAT_CARDS = [
    { label: "Total Properties", value: stats.properties, icon: <Building2 className="w-5 h-5" />, color: "text-primary bg-accent" },
    { label: "Total Applications", value: stats.applications, icon: <FileText className="w-5 h-5" />, color: "text-warning bg-warning/10" },
    { label: "Pending Applications", value: stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-warning bg-warning/10" },
    { label: "Pending Maintenance", value: stats.maintenance, icon: <Wrench className="w-5 h-5" />, color: "text-destructive bg-destructive/10" },
  ];

  return (
    <DashboardLayout title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "Owner"}`} subtitle="Here's what's happening with your properties." sidebarItems={SIDEBAR_ITEMS} roleLabel="Owner Portal">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {STAT_CARDS.map((s) => (
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
// PROPERTIES MANAGEMENT
// ========================
const EMPTY_FORM = { title: "", description: "", address: "", city: "", state: "", price: "", bedrooms: "1", bathrooms: "1", area_sqft: "", property_type: "apartment", amenities: "", images: "" };

export function OwnerProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) fetchProperties(); }, [user]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data } = await supabase.from("properties").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (id: string) => {
    const p = properties.find((x) => x.id === id);
    if (!p) return;
    setEditing(id);
    setForm({
      title: p.title || "", description: p.description || "", address: p.address || "",
      city: p.city || "", state: p.state || "", price: String(p.price || ""),
      bedrooms: String(p.bedrooms || "1"), bathrooms: String(p.bathrooms || "1"),
      area_sqft: String(p.area_sqft || ""), property_type: p.property_type || "apartment",
      amenities: (p.amenities || []).join(", "), images: (p.images || []).join(", "),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    await supabase.from("properties").delete().eq("id", id);
    fetchProperties();
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      owner_id: user!.id,
      title: form.title, description: form.description,
      address: form.address, city: form.city, state: form.state,
      price: Number(form.price), bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms), area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
      property_type: form.property_type,
      amenities: form.amenities ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    if (editing) await supabase.from("properties").update(payload).eq("id", editing);
    else await supabase.from("properties").insert(payload);
    setSaving(false);
    setShowForm(false);
    fetchProperties();
  };

  return (
    <DashboardLayout title="My Properties" subtitle="Manage your property listings" sidebarItems={SIDEBAR_ITEMS} roleLabel="Owner Portal">
      <div className="flex justify-end mb-6">
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Property</Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />)}</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="font-semibold text-lg mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">Add your first property listing</p>
          <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Property</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => <PropertyCard key={p.id} property={p} showActions onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Property" : "Add New Property"}</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            {[
              { key: "title", label: "Title *", placeholder: "e.g. Modern 2BHK Apartment" },
              { key: "address", label: "Address *", placeholder: "Street address" },
              { key: "city", label: "City *", placeholder: "City" },
              { key: "state", label: "State", placeholder: "State" },
              { key: "price", label: "Monthly Rent ($) *", placeholder: "1200", type: "number" },
              { key: "bedrooms", label: "Bedrooms", placeholder: "1", type: "number" },
              { key: "bathrooms", label: "Bathrooms", placeholder: "1", type: "number" },
              { key: "area_sqft", label: "Area (sqft)", placeholder: "800", type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input type={type || "text"} placeholder={placeholder} className="mt-1" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <Label className="text-xs">Property Type</Label>
              <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background mt-1" value={form.property_type} onChange={e => setForm({ ...form, property_type: e.target.value })}>
                {["apartment","house","studio","villa","condo"].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Describe the property..." className="mt-1" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Amenities (comma-separated)</Label>
              <Input placeholder="WiFi, Parking, AC, Gym..." className="mt-1" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Image URLs (comma-separated)</Label>
              <Input placeholder="https://... , https://..." className="mt-1" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSave} disabled={saving || !form.title || !form.address || !form.city || !form.price} className="flex-1">
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Property"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ========================
// APPLICATIONS
// ========================
export function OwnerApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchApplications(); }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rental_applications")
      .select("*, properties(*), profiles(*)")
      .order("created_at", { ascending: false });
    // Filter to only owner's properties
    const { data: myProps } = await supabase.from("properties").select("id").eq("owner_id", user!.id);
    const myPropIds = (myProps || []).map((p: any) => p.id);
    setApplications((data || []).filter((a: any) => myPropIds.includes(a.property_id)));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("rental_applications").update({ status }).eq("id", id);
    fetchApplications();
  };

  return (
    <DashboardLayout title="Rental Applications" subtitle="Review and manage tenant applications" sidebarItems={SIDEBAR_ITEMS} roleLabel="Owner Portal">
      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-card border border-border rounded-xl" />)}</div> :
      applications.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">📋</div><p className="text-muted-foreground">No applications yet</p></div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold">{app.properties?.title}</h3>
                  <p className="text-muted-foreground text-sm">{app.properties?.city}</p>
                  <div className="mt-2">
                    <p className="text-sm"><span className="text-muted-foreground">Applicant:</span> {app.profiles?.full_name} ({app.profiles?.email})</p>
                    {app.move_in_date && <p className="text-sm mt-0.5"><span className="text-muted-foreground">Move-in:</span> {new Date(app.move_in_date).toLocaleDateString()}</p>}
                    {app.message && <p className="text-sm mt-2 italic text-muted-foreground">"{app.message}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge-${app.status}`}>{app.status}</span>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateStatus(app.id, "approved")} className="gap-1 bg-success hover:bg-success/90 text-success-foreground">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, "rejected")} className="gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
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

// ========================
// PAYMENTS
// ========================
export function OwnerPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchPayments(); }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data: myProps } = await supabase.from("properties").select("id").eq("owner_id", user!.id);
    const myPropIds = (myProps || []).map((p: any) => p.id);
    const { data: apps } = await supabase.from("rental_applications").select("id").in("property_id", myPropIds);
    const appIds = (apps || []).map((a: any) => a.id);
    if (!appIds.length) { setPayments([]); setLoading(false); return; }
    const { data } = await supabase.from("payments").select("*, rental_applications(*, properties(*)), profiles(*)").in("application_id", appIds).order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from("payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    fetchPayments();
  };

  return (
    <DashboardLayout title="Payment Records" subtitle="Track rent payments from tenants" sidebarItems={SIDEBAR_ITEMS} roleLabel="Owner Portal">
      {loading ? <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl" />)}</div> :
      payments.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">💰</div><p className="text-muted-foreground">No payment records yet</p></div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Tenant", "Property", "Month", "Amount", "Status", "Action"].map(h => <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.profiles?.full_name || "Tenant"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.rental_applications?.properties?.title}</td>
                  <td className="px-4 py-3">{p.month}</td>
                  <td className="px-4 py-3 font-semibold">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge-${p.status}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    {p.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(p.id)}>Mark Paid</Button>
                    )}
                    {p.status === "paid" && <span className="text-success text-xs">✓ Paid {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ""}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

// ========================
// MAINTENANCE
// ========================
export function OwnerMaintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchRequests(); }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: myProps } = await supabase.from("properties").select("id").eq("owner_id", user!.id);
    const myPropIds = (myProps || []).map((p: any) => p.id);
    if (!myPropIds.length) { setRequests([]); setLoading(false); return; }
    const { data } = await supabase.from("maintenance_requests").select("*, properties(*), profiles(*)").in("property_id", myPropIds).order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "pending" | "in_progress" | "completed") => {
    await supabase.from("maintenance_requests").update({ status }).eq("id", id);
    fetchRequests();
  };

  const STATUS_OPTS: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];

  return (
    <DashboardLayout title="Maintenance Requests" subtitle="Handle tenant maintenance issues" sidebarItems={SIDEBAR_ITEMS} roleLabel="Owner Portal">
      {loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-card border rounded-xl" />)}</div> :
      requests.length === 0 ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">🔧</div><p className="text-muted-foreground">No maintenance requests</p></div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <span className={`badge-${r.status === "in_progress" ? "in-progress" : r.status}`}>{r.status.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground capitalize border border-border px-2 py-0.5 rounded-full">{r.priority}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.properties?.title} • {r.profiles?.full_name}</p>
                  <p className="text-sm mt-2">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Update Status</Label>
                  <select
                    className="mt-1 border border-input rounded-md px-3 py-1.5 text-sm bg-background block"
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value as any)}
                  >
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
