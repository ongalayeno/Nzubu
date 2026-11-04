# NZUBU

Application pilote immobilière pour Kinshasa. Deux interfaces coexistent : le **mode API** (par défaut), connecté à PostgreSQL, et le **mode démo**, basé sur des données simulées.

## Démarrage local

Prérequis : Node.js 24+, npm, Docker.

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
npm ci
npm run dev:full
```

Ouvrir `http://localhost:3000/`. Le compte administrateur de développement est l'adresse `BOOTSTRAP_ADMIN_EMAIL` du fichier `.env`. Sans clé Brevo, son code de connexion apparaît uniquement dans la sortie de `npm run api`. Créer ensuite les comptes partenaire et agent depuis l'interface administrateur. Le mode démo est activé en définissant `VITE_API_MODE=demo` dans `.env`, puis en relançant Vite.

## Vérifications

```powershell
npm run lint
npm test
npm run test:integration
npm run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-backup.ps1
```

Les tests d'intégration exigent l'API et PostgreSQL en cours d'exécution. Ils créent puis suppriment leurs propres données de test.

## Configuration de production

- Définir `DATABASE_URL`, `APP_ORIGIN` (URL HTTPS), `OTP_PEPPER` aléatoire, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `PRIVATE_S3_BUCKET` et, selon l'hébergeur, `S3_ENDPOINT` et `AWS_REGION` dans le gestionnaire de secrets. Les codes OTP sont envoyés exclusivement par e-mail.

### Activer Brevo pour les essais locaux

1. Dans Brevo, ajouter et vérifier `pourtoutlestravaux@gmail.com` comme expéditeur. La vérification de l'adresse est nécessaire ; sans domaine propre, la délivrabilité peut être réduite et Brevo peut remplacer l'adresse d'expédition affichée.
2. Créer une clé API v3 dans **Paramètres → SMTP et API → Clés API**. Garder cette clé privée.
3. Ouvrir le fichier local `.env` et remplacer la ligne `BREVO_API_KEY=""` par `BREVO_API_KEY="votre_clé_api"`. Ce fichier est exclu de Git. Ne pas placer la clé dans `.env.example` ni dans le navigateur.
4. Redémarrer l'API avec `npm run api` (ou `npm run dev:full`). L'adresse d'expéditeur et l'adresse administrateur sont déjà configurées dans `.env`.
5. Sur `http://localhost:3000`, demander un code pour `ongalayeno@gmail.com`, puis vérifier la boîte de réception et les indésirables. Tester ensuite `liwadvisorgroup@gmail.com` pour le compte administrateur. Les envois réels ne commencent qu'après installation de la clé.
- Construire l'image avec `docker build -t nzubu .`. Le conteneur sert l'API et l'interface compilée sur le port 3001.
- Le stockage objet compatible S3 doit être privé. Le service doit disposer d'un accès limité à ce seul bucket. Ne pas rendre les pièces ou photos publiques.
- Les sauvegardes PostgreSQL, la rétention et la restauration doivent être configurées et testées sur l'hébergement choisi.
- Les validations réglementaires et de transfert de données doivent précéder l'activation des utilisateurs et des envois réels.

Voir [READINESS.md](READINESS.md) pour les travaux qui restent avant un pilote public.
