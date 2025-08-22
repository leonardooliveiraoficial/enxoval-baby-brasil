-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  target_qty INTEGER NOT NULL DEFAULT 1,
  purchased_qty INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit', 'debit')),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  infinitepay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create guestbook_messages table
CREATE TABLE public.guestbook_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create story_content table
CREATE TABLE public.story_content (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create thankyou_template table
CREATE TABLE public.thankyou_template (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  subject TEXT NOT NULL DEFAULT 'Obrigado pelo presente! ❤️',
  body_markdown TEXT NOT NULL DEFAULT 'Querido(a) {{name}},

Muito obrigado(a) pelo lindo presente para o nosso bebê! ❤️

Sua generosidade e carinho significam muito para nós neste momento tão especial. Cada presente que recebemos nos enche de alegria e nos lembra de como somos abençoados por ter pessoas maravilhosas como você em nossas vidas.

O nosso pequeno chegará em janeiro de 2026 e sabemos que ele será muito amado por todos!

Com todo nosso amor e gratidão,
Lilian e Vinicius 💙',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create progress view
CREATE OR REPLACE VIEW public.v_progress AS
SELECT 
  COALESCE(SUM(o.amount_cents), 0) as raised_cents,
  COALESCE(SUM(p.price_cents * p.target_qty), 0) as goal_cents
FROM public.orders o
FULL OUTER JOIN public.products p ON p.is_active = true
WHERE o.status = 'paid' OR o.status IS NULL;

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thankyou_template ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "guestbook_approved_read" ON public.guestbook_messages FOR SELECT USING (approved = true);
CREATE POLICY "story_public_read" ON public.story_content FOR SELECT USING (true);
CREATE POLICY "thankyou_public_read" ON public.thankyou_template FOR SELECT USING (true);

-- Public insert policies
CREATE POLICY "guestbook_public_insert" ON public.guestbook_messages FOR INSERT WITH CHECK (true);

-- Admin policies (will be handled by service role key in edge functions)
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (true);
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (true);
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (true);
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL USING (true);
CREATE POLICY "guestbook_admin_all" ON public.guestbook_messages FOR ALL USING (true);
CREATE POLICY "story_admin_all" ON public.story_content FOR ALL USING (true);
CREATE POLICY "thankyou_admin_all" ON public.thankyou_template FOR ALL USING (true);

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_updated_at
  BEFORE UPDATE ON public.story_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thankyou_updated_at
  BEFORE UPDATE ON public.thankyou_template
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.story_content (content) VALUES (
'# Nossa História ❤️

Somos Lilian e Vinicius, e estamos esperando nosso primeiro bebê! 👶

Nosso pequeno príncipe está previsto para chegar em **Janeiro de 2026**, e mal podemos esperar para conhecê-lo.

## O Enxoval 🍼

Preparamos esta lista especial com muito carinho, pensando em cada detalhe que nosso bebê precisará nos primeiros meses de vida.

Cada presente que você escolher será recebido com muito amor e gratidão. Obrigado por fazer parte deste momento tão especial em nossas vidas! 💙'
);

-- Insert sample categories
INSERT INTO public.categories (name, sort_order) VALUES 
('Roupinhas', 1),
('Fraldas e Higiene', 2),
('Acessórios', 3),
('Quarto do Bebê', 4),
('Alimentação', 5),
('Passeio', 6);

-- Insert sample products
INSERT INTO public.products (category_id, name, description, price_cents, target_qty, image_url) VALUES
((SELECT id FROM public.categories WHERE name = 'Roupinhas'), 'Body Manga Longa RN', 'Body de algodão macio para recém-nascido', 2500, 6, null),
((SELECT id FROM public.categories WHERE name = 'Roupinhas'), 'Macacão com Pé P', 'Macacão confortável em algodão tamanho P', 3500, 4, null),
((SELECT id FROM public.categories WHERE name = 'Fraldas e Higiene'), 'Fraldas RN', 'Pacote de fraldas descartáveis para recém-nascido', 4500, 10, null),
((SELECT id FROM public.categories WHERE name = 'Acessórios'), 'Kit Toalhas', 'Set com 3 toalhas macias para bebê', 6500, 2, null),
((SELECT id FROM public.categories WHERE name = 'Quarto do Bebê'), 'Lençol de Berço', 'Jogo de lençol 100% algodão para berço', 5500, 3, null),
((SELECT id FROM public.categories WHERE name = 'Alimentação'), 'Mamadeira Anti-Cólica', 'Mamadeira com sistema anti-cólica 150ml', 4000, 3, null);