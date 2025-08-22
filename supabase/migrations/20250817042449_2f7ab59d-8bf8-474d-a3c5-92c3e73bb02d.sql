-- Create campaign_settings table for managing goals and other settings
CREATE TABLE IF NOT EXISTS public.campaign_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    goal_cents INTEGER NOT NULL DEFAULT 115500,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Enable Row Level Security
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admins can manage campaign settings"
ON public.campaign_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create or update story_content table
CREATE TABLE IF NOT EXISTS public.story_content (
    id INTEGER PRIMARY KEY DEFAULT 1,
    content TEXT NOT NULL DEFAULT 'Digite a história aqui...',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT single_story_row CHECK (id = 1)
);

-- Enable Row Level Security
ALTER TABLE public.story_content ENABLE ROW LEVEL SECURITY;

-- Create policy for public read and admin write
CREATE POLICY "Anyone can view story content"
ON public.story_content
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage story content"
ON public.story_content
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create or update thankyou_template table
CREATE TABLE IF NOT EXISTS public.thankyou_template (
    id INTEGER PRIMARY KEY DEFAULT 1,
    subject TEXT NOT NULL DEFAULT 'Obrigado pela sua contribuição!',
    body_markdown TEXT NOT NULL DEFAULT 'Olá {{name}},\n\nObrigado pela sua contribuição de {{total_brl}} para nosso enxoval!\n\nPedido: {{order_id}}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT single_template_row CHECK (id = 1)
);

-- Enable Row Level Security
ALTER TABLE public.thankyou_template ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admins can manage thankyou template"
ON public.thankyou_template
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Insert default values if they don't exist
INSERT INTO public.campaign_settings (id, goal_cents)
VALUES (1, 115500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.story_content (id, content)
VALUES (1, 'Digite a história aqui...')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.thankyou_template (id, subject, body_markdown)
VALUES (1, 'Obrigado pela sua contribuição!', 'Olá {{name}},

Obrigado pela sua contribuição de {{total_brl}} para nosso enxoval!

Pedido: {{order_id}}

Com amor,
Os futuros papais')
ON CONFLICT (id) DO NOTHING;