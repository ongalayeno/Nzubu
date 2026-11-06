# NZUBU - état de préparation du pilote

## Implémenté et vérifié localement

- API REST `/v1` avec PostgreSQL, migrations versionnées, rôles imposés côté serveur, sessions HttpOnly et codes de connexion limités en durée et en tentatives.
- Adaptateur Brevo pour l'envoi des codes et des notifications transactionnelles par e-mail uniquement ; sans clé, seul le développement local affiche les codes dans les logs.
- Dépôt privé des pièces et photos en stockage local de développement ou dans un bucket S3 privé en production ; accès contrôlé par rôle et affectation.
- Parcours annonce : soumission, dépôt et revue des pièces, upload MP4, mission terrain, rapport, validation, publication et suspension. Une annonce non validée n'est pas publique.
- Réservation : prix calculé côté serveur, clé d'idempotence, dates indisponibles consultables, blocage temporaire de 30 minutes, contrôle transactionnel des chevauchements et contrainte PostgreSQL pour les réservations confirmées. L'annulation calcule un remboursement direct à suivre.
- Parcours visite et candidature longue durée simple, tickets de support, journal d'audit, notifications en file, factures de commission après séjour réalisé.
- Brouillon terrain conservé en IndexedDB, photos incluses, avec reprise automatique d'un rapport mis en file après reconnexion et upload idempotent. Coquille de l'application mise en cache par le service worker en production.
- Image Docker, PostgreSQL local via Compose, test de sauvegarde/restauration, tests métier et tests d'intégration des scénarios de publication et de concurrence.
- Filtres publics du mode API (commune, durée, meublé, budget), fiche avec périmètre et date de vérification, indisponibilités déclarées par l'hôte et contrôlées à la réservation.
- Visites planifiées et clôturées avec compte rendu ; bail externe clôturé avec référence ; recette fictive de la publication à la facture de commission.
- Validation technique de la vidéo, variante MP4 légère, vignette et HLS à deux débits lorsque FFmpeg est disponible ; FFmpeg est inclus dans l'image de production. Revue humaine documentée avant publication.
- Calendrier client visuel, preuves privées de paiement et bail signé avec contrôle d'accès ; bail externe clôturable après validation de la preuve.
- Annulation par l'hôte suivie par un ticket critique et suspension de l'offre ; signalement média masquant l'annonce ; changement de partenaire avec révocation des validations et des anciens accès ; clôture de compte client avec conservation restreinte en cas de litige.
- Export CSV des commissions réservé au partenaire concerné et aux opérations, vérifié par tests d'accès. Il s'agit d'un suivi interne, pas d'une facture fiscale validée.

## Toujours bloquant avant ouverture à de vrais clients

1. **Médias** : l'analyse automatique du contenu et le feed vidéo vertical complet restent à réaliser ; la revue humaine documentée est en place. Les débits HLS doivent être mesurés sur les réseaux réels du pilote.
2. **Opérations complètes** : rapprochement bancaire indépendant des paiements/remboursements directs, émission de factures officielles selon les règles approuvées et validation juridique des preuves de bail restent ouverts. Le CSV actuel sert seulement au suivi.
3. **Hors connexion** : gestion des conflits entre plusieurs appareils et chiffrement des données locales sur appareils partagés restent ouverts. La reprise automatique concerne les rapports déjà mis en file, après reconnexion de l'agent.
4. **Hébergement** : le propriétaire a décidé de poursuivre les essais sur son ordinateur. Avant une ouverture publique, choisir un hébergeur et créer les ressources réelles (réseau, PostgreSQL, stockage privé, service conteneur, sauvegardes, secrets, domaine, HTTPS, monitoring, alertes et budgets). Le Dockerfile est prêt à être utilisé ; aucun déploiement cloud n'a été effectué. Namecheap est un fournisseur déjà utilisé par le propriétaire, mais son offre précise reste à confirmer ; voir `HOSTING_DECISION.md`.
5. **Conformité et prestataires** : valider l'expéditeur Brevo, la délivrabilité des e-mails, les transferts de données et les documents contractuels. La clé API n'est pas encore configurée et aucun vrai e-mail n'a été envoyé pendant les tests. L'offre gratuite de 300 e-mails par jour peut retarder les OTP si son quota est atteint.
6. **Recette et sécurité** : la recette locale couvre les principaux flux et un test de charge léger, mais il reste les tests de charge sur infrastructure cible, un audit d'accès et d'uploads indépendant, un pentest, une restauration chronométrée sur l'hébergement retenu et la recette de tous les états d'écran du dossier.

Le prototype initial reste accessible avec `VITE_API_MODE=demo`. Le mode par défaut utilise l'API et PostgreSQL. Le dossier produit dans `public/assets/aistudio/` reste la spécification fonctionnelle de référence.
