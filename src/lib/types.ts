// Shared database row types for the services directory.

export type ServiceStatus = "draft" | "published" | "paused" | "removed";
export type EnquiryStatus = "new" | "responded" | "closed";

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type ServicePackage = {
  id: string;
  service_id: string;
  name: string;
  price_gbp: number | null;
  delivery_days: number | null;
  features: string[];
  sort_order: number;
};

export type ServiceMedia = {
  id: string;
  service_id: string;
  url: string;
  kind: string;
  sort_order: number;
};

export type SellerProfile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
};

export type Service = {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  cover_image_url: string | null;
  status: ServiceStatus;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  updated_at: string;
};

// A listing joined with the data needed to render directory/detail views.
export type ServiceWithRelations = Service & {
  categories: Pick<Category, "slug" | "name"> | null;
  profiles: SellerProfile | null;
  service_packages: ServicePackage[];
  service_media: ServiceMedia[];
};
