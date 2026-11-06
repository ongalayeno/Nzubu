# Consolidation P0 — recette sur données fictives

## Parcours vérifiés

Le mode API est le parcours de référence (`VITE_API_MODE=server`). Les scénarios d'intégration créent des comptes et logements `@test.local`, puis suppriment leurs lignes métier. Ils vérifient :

1. Le partenaire soumet une annonce ; les pièces, la vidéo et l'inspection sont approuvées ; l'annonce devient publique seulement après validation.
2. Le client trouve l'annonce par commune, durée et budget, voit la date ainsi que l'agent de vérification et choisit ses dates dans le calendrier visuel.
3. L'hôte bloque des dates occupées hors NZUBU ; la disponibilité les affiche et une demande sur ces dates est refusée.
4. Une demande de séjour libre comporte le nombre d'occupants et l'acceptation datée des conditions conservées en copie ; elle est acceptée par l'hôte, le client déclare un paiement direct fictif, l'hôte confirme, puis les opérations clôturent le séjour et créent la facture de commission.
5. Une visite longue durée est planifiée et clôturée avec compte rendu ; la candidature passe par la revue, la négociation, la préparation du bail et la signature externe avec référence et bail signé validé obligatoires.
6. Deux demandes concurrentes ne peuvent pas être acceptées sur les mêmes dates.

Commande : lancer PostgreSQL et l'API, puis `npm run test:integration` et `npm run test:load`. Les tests unitaires, le typage et le build se lancent avec `npm test`, `npm run lint` et `npm run build`. La sauvegarde/restauration locale est vérifiée par `scripts/verify-backup.ps1`. La recette actuelle inclut aussi les refus d'accès aux preuves d'un autre partenaire, l'upload d'un faux PDF, la publication prématurée et la validation vidéo sans checklist.

## Vidéo et terrain

En production, FFprobe valide la durée et les dimensions d'une vidéo verticale, et FFmpeg crée une variante MP4 légère, une vignette et deux débits HLS. L'interface utilise HLS quand le navigateur le permet et revient au MP4 léger sinon. Une checklist de revue humaine des droits, personnes identifiables, conformité à la fiche et contenu sensible est obligatoire avant publication. Le Dockerfile installe FFmpeg. Sans FFmpeg en développement local, la revue manuelle MP4 reste utilisable, mais le traitement automatisé n'est pas exercé. Le test vidéo reproductible `scripts/verify-video.mjs` s'exécute dans l'image Docker.

Le brouillon terrain est enregistré localement avec ses photos. Au retour du réseau ou après redémarrage et reconnexion de l'agent, une mission mise en file est rouverte et sa synchronisation retentée automatiquement ; l'agent peut aussi la déclencher manuellement. Les envois sont idempotents côté serveur. Un bouton permet d'effacer les brouillons de l'appareil. Les conflits entre plusieurs appareils et le chiffrement des données locales sur appareil partagé restent à traiter avant le pilote réel.

Les preuves de paiement/remboursement et le bail signé sont stockés en privé. Le client, le partenaire du dossier et les opérations peuvent les consulter ; un tiers reçoit un refus. Un responsable doit approuver le bail signé avant la clôture du dossier longue durée. Une déclaration de paiement direct et un reçu fourni par un utilisateur ne constituent pas une preuve bancaire indépendante.

## État des scénarios AT du dossier

| Scénarios | État de recette locale | Limite |
|---|---|---|
| AT-001, 004 à 009, 011 à 014, 016 à 017, 021 à 024 | Vérifiés par tests d'intégration, tests métier ou contrôle serveur | AT-003 (hors réseau), AT-019 (restauration) et l'interface complète requièrent aussi une recette manuelle sur appareil |
| AT-002 | Contrôle du rapport terrain et checklist vidéo | La divergence visuelle entre deux appartements exige une décision humaine |
| AT-003 | Brouillon IndexedDB, reprise et idempotence testés séparément | Coupure réelle de réseau et redémarrage Android à tester sur appareil |
| AT-010, 020 | Annulation par l'hôte, suspension, ticket critique, remboursement dû et notification testés | Relogement et paiement direct réels restent des procédures humaines |
| AT-015 | Aucune action de remboursement manuel déléguée au service client dans ce MVP | Une future délégation financière nécessitera un workflow d'approbation |
| AT-018 | Revue d'hébergement documentée | Aucune infrastructure réelle choisie ; contrôle du transfert à faire avant déploiement |
| AT-019 | `pg_dump` et restauration locale, comparaison migrations/utilisateurs/logements/réservations/audit | RPO et temps de restauration à mesurer sur l'hébergement final |
| AT-022 | Changement de partenaire testé : anciens accès et validations révoqués, offre retirée du public | Le nouveau partenaire doit fournir ses pièces, une vidéo et une inspection avant nouvelle publication |

La recette automatisée ne remplace pas un audit de sécurité indépendant, un test de charge sur l'infrastructure cible ni l'acceptation par les équipes métier.

## Décisions de direction et conditions de pilote réel

Les chiffres actuellement codés dans le parcours fictif (avance 20 %, commission 10 %, blocage de 30 minutes, validité 90 jours, annulation 72/24 h) restent des **hypothèses**, pas des politiques approuvées. Avant données ou paiements réels, la direction doit signer le registre D-001 à D-022 du dossier de conception, notamment :

| Décision | Responsable | Résultat attendu |
|---|---|---|
| D-003, D-012, D-013, D-022 | Direction, juriste local, autorités compétentes | Agrément immobilier, qualification touristique et formalités données confirmés par écrit |
| D-006 à D-011 | Direction, Finance, juridique et hôtes pilotes | Commission, annulation, avance, canaux de paiement, visite et bail contractualisés |
| D-014, D-015, D-019 | Direction, CTO, DPO | Hébergement et stockage choisis, localisation et transferts validés, devis et budget approuvés |
| D-001, D-002, D-004, D-017 à D-021 | Direction et opérations | Identité juridique, territoire, capacité, horaires et périmètre du pilote confirmés |

La [proposition d'hébergement](HOSTING_DECISION.md) permet de comparer des offres RDC ; aucun fournisseur n'est sélectionné ni déployé. L'ouverture à des personnes réelles reste conditionnée à la conformité, aux contrats, aux sauvegardes, à la sécurité, à la recette complète des écrans et à un GO formel.
