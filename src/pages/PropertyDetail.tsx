import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Bed, Bath, Square, DollarSign, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [existingApplication, setExistingApplication] = useState<any>(null);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data } = await supabase.from("properties").select("*, profiles(full_name, email, phone)").eq("id", id).single();
    setProperty(data);
    setLoading(false);
    if (user && userRole === "tenant") checkExistingApplication();
  };

  const checkExistingApplication = async () => {
    const { data } = await supabase.from("rental_applications").select("*").eq("property_id", id).eq("tenant_id", user?.id).single();
    if (data) setExistingApplication(data);
  };

  const handleApply = async () => {
    if (!user) { navigate("/login"); return; }
    setApplying(true);
    setApplyError("");
    const { error } = await supabase.from("rental_applications").insert({
      property_id: id,
      tenant_id: user.id,
      message,
      move_in_date: moveInDate || null,
    });
    setApplying(false);
    if (error) setApplyError(error.message);
    else { setApplySuccess(true); setShowApplyForm(false); checkExistingApplication(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Property not found.</p>
        <Button onClick={() => navigate("/properties")}>Back to Listings</Button>
      </div>
    );
  }

  const images = property.images?.length > 0
    ? property.images
    : [`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&q=80`];

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main image */}
            <div className="rounded-2xl overflow-hidden aspect-video bg-muted">
              <img src={images[0]} alt={property.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&q=80`; }} />
            </div>

            {/* Title and badges */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{property.title}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{property.address}, {property.city}{property.state ? `, ${property.state}` : ""}</span>
                  </div>
                </div>
                <Badge variant={property.is_available ? "default" : "secondary"} className="capitalize">
                  {property.is_available ? "Available" : "Rented"}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Bed className="w-4 h-4" />, label: "Bedrooms", value: property.bedrooms || "N/A" },
                { icon: <Bath className="w-4 h-4" />, label: "Bathrooms", value: property.bathrooms || "N/A" },
                { icon: <Square className="w-4 h-4" />, label: "Area (sqft)", value: property.area_sqft || "N/A" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center shadow-card">
                  <div className="flex items-center justify-center text-primary mb-1">{s.icon}</div>
                  <div className="font-semibold">{s.value}</div>
                  <div className="text-muted-foreground text-xs">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-semibold mb-3">About this Property</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h2 className="font-semibold mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a: string) => (
                    <span key={a} className="bg-accent text-accent-foreground text-sm px-3 py-1 rounded-full capitalize">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card sticky top-24">
              <div className="flex items-baseline gap-1 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold text-primary">{Number(property.price).toLocaleString()}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              {/* Property type */}
              <div className="text-sm text-muted-foreground mb-6 capitalize">
                Type: <span className="text-foreground font-medium">{property.property_type || "Apartment"}</span>
              </div>

              {/* Apply section */}
              {applySuccess && (
                <div className="flex items-center gap-2 bg-success/10 text-success border border-success/20 rounded-lg p-3 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" /> Application submitted!
                </div>
              )}

              {existingApplication && (
                <div className="bg-accent/50 border border-accent rounded-xl p-4 mb-4 text-sm">
                  <p className="font-medium mb-1">Application Status</p>
                  <span className={`badge-${existingApplication.status}`}>{existingApplication.status}</span>
                </div>
              )}

              {!existingApplication && !applySuccess && property.is_available && (
                <>
                  {!showApplyForm ? (
                    <Button
                      className="w-full"
                      onClick={() => { if (!user) navigate("/login"); else if (userRole === "tenant") setShowApplyForm(true); }}
                      disabled={userRole === "owner" || userRole === "admin"}
                    >
                      {!user ? "Sign In to Apply" : userRole === "tenant" ? "Apply Now" : "Only tenants can apply"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Application Form</h3>
                      {applyError && (
                        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-xs border border-destructive/20 rounded-lg p-2">
                          <AlertCircle className="w-3 h-3" /> {applyError}
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Preferred Move-in Date</Label>
                        <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Message to Owner</Label>
                        <Textarea placeholder="Tell the owner about yourself..." value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handleApply} disabled={applying}>
                          {applying ? "Submitting..." : "Submit"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Owner Info */}
              {property.profiles && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Property Owner</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {property.profiles.full_name?.charAt(0) || "O"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{property.profiles.full_name}</p>
                      <p className="text-muted-foreground text-xs">{property.profiles.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
