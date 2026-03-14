

## Plan: Create "Layout" Settings Page for PDF Customization

### What exists today
- PDFs use a **hardcoded header logo** (`/images/hero-logo-black.png`) and **hardcoded footer text** (`HERO AUDIOVISUAL • www.hero.rec.br • comercial@hero.rec.br`)
- Both `pdfGenerator.ts` and `financialReportPDF.ts` share this same pattern
- The "Configurações" group in the sidebar already exists with Categorias, Itens de Serviço, and Regras Comerciais

### What will be built

**1. Database: `workspace_layout` table**
- Columns: `id`, `workspace_id`, `logo_url`, `company_name`, `website`, `email`, `created_at`, `updated_at`
- RLS: workspace access check (same pattern as other tables)
- One row per workspace

**2. Storage: use existing `avatars` bucket or create `logos` bucket**
- Create a dedicated `logos` public bucket for company logos
- RLS policies for authenticated upload within workspace

**3. New page: `src/pages/settings/LayoutPage.tsx`**
- Logo upload area with 1:1 proportion guidance
- Fields: company name, website, email
- Save/update functionality
- Only accessible by `owner` role

**4. Config & routing updates**
- Add `layout` page to `APP_PAGES` in `src/config/pages.ts` with `restrictedFrom: ['vendedor', 'admin', 'visualizador']` (owner-only)
- Add route in `App.tsx`
- Add sidebar item in `Sidebar.tsx` under Configurações

**5. Update PDF generators**
- Both `pdfGenerator.ts` and `financialReportPDF.ts` will accept layout settings as a parameter
- Header: render uploaded logo (preserving aspect ratio, no distortion)
- Footer: render company name, website, email dynamically
- Callers (BudgetDetail.tsx) will fetch `workspace_layout` before generating PDF

### Technical details

**Database migration:**
```sql
CREATE TABLE public.workspace_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  logo_url text DEFAULT '',
  company_name text DEFAULT '',
  website text DEFAULT '',
  email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.workspace_layout ENABLE ROW LEVEL SECURITY;
-- Standard CRUD policies with has_workspace_access
-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- Storage RLS policies
```

**Page access:** restricted to owner only via `restrictedFrom: ['vendedor', 'admin', 'visualizador']` in `APP_PAGES`.

**PDF integration:** Both generators will receive an optional `layoutSettings` parameter. If present, use custom logo/footer; if not, fall back to current defaults (backward compatible).

