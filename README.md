# Enxoval Baby Brasil

E-commerce de enxoval de bebê. Stack: Vite + React + TypeScript + Tailwind (shadcn/ui) + Supabase.

## Requisitos
- Node 18+
- NPM ou Bun
- Variáveis em `.env` (não commitadas): SUPABASE_URL, SUPABASE_ANON_KEY, MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_ACCESS_TOKEN etc.

## Scripts
- `npm install` — instala dependências
- `npm run dev` — roda local em http://localhost:8080
- `npm run build` — build de produção
- `npm run preview` — preview do build

## Estrutura
- `src/` — frontend
- `supabase/` — functions e migrations
- `public/` — assets estáticos

## Deploy (esboço)
- Frontend: Vercel/Netlify
- Backend: Supabase Functions
- Segredos via variáveis de ambiente (GitHub/Vercel/Supabase)

## Licença
MIT
