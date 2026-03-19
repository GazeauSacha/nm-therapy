# NM Therapy — Site & Admin Panel

Site vitrine + panel d'administration pour Nancy Massaoudi (NM Therapy).

**Stack :** React + Vite · Supabase (auth + base de données) · Vercel (hébergement)

---

## 🚀 Installation locale

### 1. Cloner le repo

```bash
git clone https://github.com/TON-USERNAME/nm-therapy.git
cd nm-therapy
npm install
```

### 2. Créer le fichier `.env.local`

Copie `.env.example` en `.env.local` :

```bash
cp .env.example .env.local
```

Remplis tes clés Supabase (Supabase Dashboard → Project Settings → API) :

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Lancer en développement

```bash
npm run dev
```

Le site est accessible sur **http://localhost:5173**

---

## 🗄️ Configuration Supabase

### Étape 1 — Créer les tables

Dans Supabase → **SQL Editor**, colle et exécute ce script :

```sql
-- ── CLIENTS ──
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACTS (messages du formulaire public) ──
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new', -- new | replied
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPOINTMENTS (rendez-vous) ──
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  platform TEXT DEFAULT 'Google Meet',
  subject TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending | confirmed | cancelled | done
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REPLIES (réponses aux messages) ──
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES (factures) ──
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  number TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending | paid | overdue
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SITE CONTENT (textes éditables) ──
CREATE TABLE site_content (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Valeurs par défaut du site
INSERT INTO site_content (key, value) VALUES
  ('hero_title', 'Nancy Massaoudi'),
  ('hero_subtitle', 'NM Therapy'),
  ('hero_quote', 'On ne fait pas un travail sur soi pour changer, on fait un travail sur soi pour devenir soi-même.'),
  ('hero_tagline', 'Life & Love Coaching, Hypnothérapie, Thérapie de couple, EMDR, Sexothérapie et guidance intuitive.'),
  ('about_text_1', 'Je suis Nancy Massaoudi, coach de vie et thérapeute. Ma vocation est de vous accompagner dans votre transformation personnelle, amoureuse et familiale.'),
  ('about_text_2', 'Pour retrouver l''équilibre et le bien-être, contactez-moi. Car j''ai une boîte à outils bien remplie qui ne cesse de s''étoffer.'),
  ('pricing_note', 'Séance individuelle : 45 min à 1h30. Tarifs flexibles selon votre situation.'),
  ('cancellation_policy', 'Si vous ne pouvez pas assister à votre séance, merci de la déprogrammer au moins 48 heures à l''avance.'),
  ('contact_phone', '0495 65 01 30'),
  ('contact_email', 'nancymtherapy@gmail.com'),
  ('site_visible', 'true'),
  ('form_active', 'true');
```

### Étape 2 — Activer Row Level Security (RLS)

Dans Supabase → **Authentication → Policies**, active RLS sur chaque table et crée ces politiques :

```sql
-- Tout le monde peut insérer dans contacts (formulaire public)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert contacts" ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth read contacts" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth update contacts" ON contacts FOR UPDATE TO authenticated USING (true);

-- Lecture publique du contenu du site
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_content" ON site_content FOR SELECT TO anon USING (true);
CREATE POLICY "Auth write site_content" ON site_content FOR ALL TO authenticated USING (true);

-- Clients, RDV, Factures : accès authentifié uniquement
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth all clients" ON clients FOR ALL TO authenticated USING (true);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth all appointments" ON appointments FOR ALL TO authenticated USING (true);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth all invoices" ON invoices FOR ALL TO authenticated USING (true);

ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth all replies" ON replies FOR ALL TO authenticated USING (true);
```

### Étape 3 — Activer Realtime

Dans Supabase → **Database → Replication**, active Realtime pour la table `contacts`.

### Étape 4 — Créer le compte admin de Nancy

Dans Supabase → **Authentication → Users** → **Invite user** :
- Email : `nancymtherapy@gmail.com`
- Nancy recevra un email pour définir son mot de passe.

---

## 📁 Structure du projet

```
nm-therapy/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              ← Site public
│   │   ├── Home.module.css
│   │   ├── Login.jsx             ← Page de connexion admin
│   │   └── admin/
│   │       ├── Dashboard.jsx     ← Tableau de bord
│   │       ├── Appointments.jsx  ← Rendez-vous (CRUD)
│   │       ├── Clients.jsx       ← Fiches clients (CRUD)
│   │       ├── Messages.jsx      ← Messages du formulaire
│   │       ├── Finances.jsx      ← Factures (CRUD)
│   │       ├── SiteContent.jsx   ← Édition des textes du site
│   │       └── Settings.jsx      ← Compte & sécurité
│   ├── components/
│   │   ├── AdminLayout.jsx       ← Sidebar + navigation
│   │   ├── ProtectedRoute.jsx    ← Garde d'authentification
│   │   └── Topbar.jsx            ← Barre du haut admin
│   ├── hooks/
│   │   └── useAuth.jsx           ← Context d'authentification Supabase
│   ├── lib/
│   │   └── supabase.js           ← Client Supabase
│   ├── index.css                 ← Variables CSS globales
│   └── main.jsx                  ← Routes React
├── .env.example                  ← Modèle de variables d'environnement
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔗 Routes

| URL | Page |
|-----|------|
| `/` | Site public NM Therapy |
| `/admin/login` | Connexion admin |
| `/admin/dashboard` | Tableau de bord |
| `/admin/appointments` | Rendez-vous |
| `/admin/clients` | Clients |
| `/admin/messages` | Messages |
| `/admin/finances` | Facturation |
| `/admin/site` | Contenu du site |
| `/admin/settings` | Paramètres |

---

## 🌐 Déploiement sur Vercel

### 1. Pusher sur GitHub

```bash
git init
git add .
git commit -m "Initial commit — NM Therapy"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/nm-therapy.git
git push -u origin main
```

### 2. Connecter Vercel

1. Va sur [vercel.com](https://vercel.com) → **Add New Project**
2. Sélectionne ton repo GitHub `nm-therapy`
3. Framework : **Vite** (détecté automatiquement)
4. Ajoute tes variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique **Deploy**

### 3. Déploiements automatiques

À chaque `git push` sur `main`, Vercel redéploie automatiquement. ✅

---

## 🔄 Workflow complet — Comment ça marche

```
[Visiteur remplit le formulaire sur le site]
         ↓
[Supabase INSERT dans table "contacts"]
         ↓
[Nancy voit le badge "Messages" s'incrémenter en temps réel]
         ↓
[Nancy ouvre Admin → Messages]
         ↓
[Elle lit le message, clique "Ouvrir dans Gmail" pour répondre]
         ↓ (optionnel)
[Elle clique "+ Créer un RDV" → Admin → Rendez-vous]
         ↓
[Elle crée le client dans "Clients" si nouveau]
         ↓
[Elle crée le RDV → table "appointments"]
         ↓
[Après la séance → Admin → Facturation → Nouvelle facture]
         ↓
[Elle marque la facture comme payée quand paiement reçu]
```

---

## 📧 (Optionnel) Envoi d'emails automatiques

Pour envoyer de vrais emails depuis l'admin (pas juste ouvrir Gmail), vous pouvez ajouter **Resend** :

1. Créer un compte sur [resend.com](https://resend.com) (gratuit jusqu'à 3000 emails/mois)
2. Créer une **Supabase Edge Function** `send-email`
3. L'appeler depuis `Messages.jsx` au lieu du mailto

Je peux vous créer cette Edge Function si vous en avez besoin.

---

## 🛠️ Commandes utiles

```bash
npm run dev      # Développement local
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

---

*NM Therapy · Nancy Massaoudi · nancymtherapy@gmail.com · 0495 65 01 30*
