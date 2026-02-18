import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Square, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  property_type?: string;
  images?: string[];
  is_available?: boolean;
}

interface PropertyCardProps {
  property: Property;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PropertyCard({ property, showActions, onEdit, onDelete }: PropertyCardProps) {
  const imageUrl = property.images?.[0] || `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop&q=80`;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card card-hover overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop&q=80`;
          }}
        />
        <div className="absolute top-3 left-3">
          <Badge variant={property.is_available ? "default" : "secondary"} className="text-xs">
            {property.is_available ? "Available" : "Rented"}
          </Badge>
        </div>
        {property.property_type && (
          <div className="absolute top-3 right-3">
            <span className="bg-card/90 text-foreground text-xs font-medium px-2 py-1 rounded-md capitalize">
              {property.property_type}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-card-foreground line-clamp-1 mb-1">{property.title}</h3>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.address}, {property.city}{property.state ? `, ${property.state}` : ""}</span>
        </div>

        {property.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{property.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              <span>{property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{property.bathrooms} Bath{property.bathrooms !== 1 ? "s" : ""}</span>
            </div>
          )}
          {property.area_sqft && (
            <div className="flex items-center gap-1">
              <Square className="w-3.5 h-3.5" />
              <span>{property.area_sqft} sqft</span>
            </div>
          )}
        </div>

        {/* Price + Actions */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-primary">{Number(property.price).toLocaleString()}</span>
            <span className="text-muted-foreground text-sm">/mo</span>
          </div>
          <div className="flex gap-2">
            {showActions && onEdit && (
              <button onClick={() => onEdit(property.id)} className="text-xs text-primary hover:underline font-medium">Edit</button>
            )}
            {showActions && onDelete && (
              <button onClick={() => onDelete(property.id)} className="text-xs text-destructive hover:underline font-medium">Delete</button>
            )}
            {!showActions && (
              <Link
                to={`/properties/${property.id}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                View
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
