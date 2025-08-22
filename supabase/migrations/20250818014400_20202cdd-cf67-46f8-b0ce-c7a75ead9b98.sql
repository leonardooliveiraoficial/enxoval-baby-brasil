-- Create MercadoPago settings table
CREATE TABLE public.mercadopago_settings (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY,
  access_token TEXT NOT NULL,
  account_id TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mercadopago_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can manage MercadoPago settings" 
ON public.mercadopago_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mercadopago_settings_updated_at
BEFORE UPDATE ON public.mercadopago_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();