
-- Create brand_settings table for centralized brand asset management
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Metadata
  site_title text DEFAULT 'Acquirer CRM',
  site_subtitle text DEFAULT 'Search Fund Platform',
  meta_description text DEFAULT 'The modern CRM for search fund professionals.',
  og_title text,
  og_description text,
  twitter_title text,
  twitter_description text,
  -- Theme colors (stored as hex)
  primary_color text DEFAULT '#1e3a5f',
  secondary_color text DEFAULT '#f5f5f7',
  background_color text DEFAULT '#fcfcfd',
  text_color text DEFAULT '#1a2332',
  accent_color text DEFAULT '#d4a853',
  -- Asset URLs (stored after upload to storage)
  logo_full_url text,
  logo_mark_url text,
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  apple_touch_icon_url text,
  og_image_url text,
  twitter_image_url text,
  default_thumbnail_url text,
  email_header_logo_url text,
  mobile_app_icon_url text,
  -- Cache busting
  asset_version integer DEFAULT 1,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brand settings"
  ON public.brand_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand settings"
  ON public.brand_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand settings"
  ON public.brand_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand settings"
  ON public.brand_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create brand-assets storage bucket (public so URLs work everywhere)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Storage policies for brand-assets bucket
CREATE POLICY "Anyone can view brand assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated users can upload brand assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own brand assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own brand assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
