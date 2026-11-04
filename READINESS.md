# NZUBU - état de préparation du pilote

## Implémenté et vérifié localement

- API REST `/v1` avec PostgreSQL, migrations versionnées, rôles imposés côté serveur, sessions HttpOnly et codes de connexion limités en durée et en tentatives.
- Adaptateur Brevo pour l'envoi des codes et des notifications transactionnelles par e-mail uniquement ; sans clé, seul le développement local affiche les codes dans les logs.
- Dépôt privé des pièces et photos en stockage local de développement ou dans un bucket S3 privé en production ; accès contrôlé par rôle et affectation.
- Parcours annonce : soumission, dépôt et revue des pièces, upload MP4, mission terrain, rapport, validation, publication et suspension. Une annonce non validée n'est pas publique.
- Réservation : prix calculé côté serveur, clé d'idempotence, dates indisponibles consultables, blocage temporaire de 30 minutes, contrôle transactionnel des chevauchements et contrainte PostgreSQL pour les réservations confirmées. L'annulation calcule un remboursement direct à suivre.
- Parcours visite et candidature longue durée simple, tickets de support, journal d'audit, notifications en file, factures de commission après séjour réalisé.
- Brouillon terrain conservé en IndexedDB, photos incluses, avec reprise manuelle et upload idempotent. Coquille de l'application mise en cache par le service worker en production.
- Image Docker, PostgreSQL local via Compose, test de sauvegarde/restauration, tests métier et tests d'intégration des scénarios de publication et de concurrence.

## Toujours bloquant avant ouverture à de vrais clients

1. **Médias** : l'upload et la lecture MP4 sont simples ; il manque l'analyse automatisée du contenu, le transcodage HLS, la diffusion adaptée aux faibles réseaux et le feed vidéo vertical complet.
2. **Opérations complètes** : calendrier visuel et mise à jour des indisponibilités hors NZUBU, rapprochement des paiements et remboursements directs (la déclaration actuelle n'est pas une preuve bancaire), factures exportables, suivi complet des visites et baux signés.
3. **Hors connexion** : synchronisation automatique de toutes les missions, reprise après fermeture complète de l'application, gestion des conflits et protection des données locales sur appareils partagés. La reprise actuelle exige que l'agent se reconnecte puis choisisse la mission.
4. **Hébergement** : le propriétaire a décidé de poursuivre les essais sur son ordinateur. Avant une ouverture publique, choisir un hébergeur et créer les ressources réelles (réseau, PostgreSQL, stockage privé, service conteneur, sauvegardes, secrets, domaine, HTTPS, monitoring, alertes et budgets). Le Dockerfile est prêt à être utilisé ; aucun déploiement cloud n'a été effectué. Namecheap est un fournisseur déjà utilisé par le propriétaire, mais son offre précise reste à confirmer ; voir `HOSTING_DECISION.md`.
5. **Conformité et prestataires** : valider l'expéditeur Brevo, la délivrabilité des e-mails, les transferts de données et les documents contractuels. La clé API n'est pas encore configurée et aucun vrai e-mail n'a été envoyé pendant les tests. L'offre gratuite de 300 e-mails par jour peut retarder les OTP si son quota est atteint.
6. **Recette et sécurité** : tests de charge, tests d'accès horizontal/vertical étendus, audit des uploads, pentest indépendant, restauration chronométrée et validation de tous les scénarios du dossier de conception.

Le prototype initial reste accessible avec `VITE_API_MODE=demo`. Le mode par défaut utilise l'API et PostgreSQL. Le dossier produit dans `public/assets/aistudio/` reste la spécification fonctionnelle de référence.
