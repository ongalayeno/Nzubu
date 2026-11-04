# Nzubu — Cartographie des métiers, responsabilités et périmètres fonctionnels

**Document de cadrage de l'équipe de conception et de développement**  
**Projet :** Nzubu — plateforme immobilière urbaine à Kinshasa  
**Périmètre :** application mobile Android au lancement, iOS ultérieurement, back-office Web, espace partenaires et outils opérationnels terrain.

---

## 1. Vision de l'équipe de développement

Nzubu ne doit pas être conçu comme une simple application de petites annonces. C'est un écosystème immobilier numérique qui combine :

1. La découverte de logements par un feed vidéo vertical.
2. La gestion et la vérification physique des logements.
3. La gestion commerciale et contractuelle des locations meublées et non-meublées.
4. La coordination des équipes opérationnelles, des agents terrain, des bailleurs, des hôtes et des clients.
5. Les visites, les réservations, les paiements, le service client et le suivi des opérations.

L'équipe de conception doit donc réunir cinq pôles de compétences :

| Pôle | Mission principale |
|---|---|
| Product & Business | Définir le produit, les besoins métier, les priorités et les processus. |
| UX/UI & Product Design | Concevoir les parcours, les interfaces et l'expérience utilisateur. |
| Software Engineering | Développer l'application mobile, le Web, le backend et les intégrations. |
| Infrastructure, DevOps & Security | Héberger, déployer, sécuriser et maintenir la plateforme. |
| Quality, Data & Analytics | Tester le produit, mesurer ses performances et exploiter les données. |

Tous ces métiers ne doivent pas nécessairement correspondre à des recrutements distincts. Au démarrage, plusieurs responsabilités peuvent être réunies dans une même personne ou confiées ponctuellement à des spécialistes externes.

## 2. Pôle Product & Business — Conception du produit

Ce pôle transforme l'idée de Nzubu en un produit structuré, avec des fonctionnalités, des règles de gestion, des priorités et des critères de réussite clairement définis.

### 2.1 Product Manager (PM)

**Priorité : indispensable.**

**Mission :** être responsable de la vision globale du produit Nzubu et s'assurer que le produit répond aux besoins du marché et aux objectifs de l'entreprise.

**Responsabilités :**
- Définir la vision et le positionnement de Nzubu.
- Étudier le marché immobilier de Kinshasa et les usages des clients, bailleurs et hôtes.
- Identifier les besoins des locataires, voyageurs, bailleurs et hôtes.
- Définir les fonctionnalités prioritaires et le périmètre du MVP.
- Construire la feuille de route (roadmap) du produit.
- Définir les indicateurs de performance (KPIs).
- Arbitrer les nouvelles fonctionnalités et les évolutions.
- Coordonner les équipes métier, design et techniques.

**Périmètres Nzubu à cadrer :**
- Feed vidéo et découverte immobilière.
- Recherche et filtres géographiques et financiers.
- Fiches détaillées des logements.
- Demandes de visites.
- Réservations courtes et locations longues durées.
- Paiements, commissions, annulations et remboursements.
- Gestion des bailleurs et hôtes.
- Back-office et outils de gestion des opérations.

**Livrables :** vision produit, roadmap, objectifs, priorisation, KPIs et stratégie de lancement du MVP.

### 2.2 Product Owner (PO)

**Priorité : indispensable.**

**Mission :** transformer la vision produit en tâches de développement précises et vérifiables.

**Responsabilités :**
- Construire et maintenir le Product Backlog.
- Rédiger les User Stories.
- Définir les critères d'acceptation de chaque fonctionnalité.
- Prioriser les tâches de développement.
- Répondre aux questions métier des développeurs.
- Vérifier les fonctionnalités livrées.
- Valider fonctionnellement les éléments avant leur intégration ou publication.

**Exemple de User Story :**

> En tant qu'utilisateur Nzubu, je veux filtrer les logements par commune, quartier, prix et type de logement afin de trouver rapidement une habitation qui correspond à mon budget.

**Critères d'acceptation possibles :**
- L'utilisateur peut sélectionner une commune.
- L'utilisateur peut sélectionner un quartier.
- L'utilisateur peut définir un prix minimum et maximum.
- L'utilisateur peut choisir entre meublé et non-meublé.
- Les résultats correspondent aux filtres sélectionnés.
- L'utilisateur peut réinitialiser les filtres.

**Livrables :** Product Backlog, User Stories, critères d'acceptation, priorités et validation fonctionnelle.

**Organisation au démarrage :** Product Manager et Product Owner peuvent être une seule personne si le volume de travail le permet.

### 2.3 Business Analyst (BA)

**Priorité : indispensable.**

**Mission :** analyser le fonctionnement réel de Nzubu et transformer les procédures métier en spécifications fonctionnelles exploitables par l'équipe technique.

**Responsabilités :**
- Comprendre le travail des différents services de Nzubu.
- Cartographier les processus métier.
- Définir les interactions entre opérations, responsables de marché, agents, service client, partenaires et direction.
- Formaliser les règles de gestion.
- Identifier les cas particuliers, les risques et les exceptions.
- Décrire les workflows à automatiser.

**Processus à formaliser notamment :**
- Réception d'une demande de logement.
- Identification du bailleur, de l'hôte ou de son mandataire.
- Vérification documentaire et contrôle du droit de proposer le logement.
- Planification et affectation d'une mission terrain.
- Inspection du logement et collecte des preuves.
- Production, transmission et validation des vidéos.
- Publication de l'annonce.
- Mise à jour de la disponibilité.
- Demande et confirmation d'une visite.
- Réservation, paiement, annulation et remboursement.
- Gestion d'une réclamation ou d'un litige.
- Location longue durée et accompagnement administratif.

**Livrables :** cahier des charges fonctionnel, diagrammes BPMN, cartographie des processus, règles métier et spécifications fonctionnelles.

### 2.4 Project Manager / Scrum Master

**Priorité : indispensable, fonction éventuellement mutualisée.**

**Mission :** organiser l'exécution du projet et coordonner les différents intervenants.

**Responsabilités :**
- Planifier les sprints et les étapes de livraison.
- Organiser les réunions de suivi.
- Suivre les tâches, délais et dépendances.
- Identifier les blocages.
- Coordonner les designers, développeurs, QA et DevOps.
- Suivre les anomalies et les corrections.
- Produire des rapports d'avancement et gérer les risques.

**Livrables :** planning, suivi des sprints, rapports d'avancement, registre des risques et coordination du projet.

## 3. Pôle UX/UI & Product Design

Ce pôle conçoit les interfaces et les parcours qui permettent aux utilisateurs, partenaires et collaborateurs de comprendre et d'utiliser Nzubu facilement.

### 3.1 UX Researcher — Chercheur en expérience utilisateur

**Priorité : fortement recommandé, notamment pendant la phase de découverte.**

**Mission :** comprendre les utilisateurs et leurs comportements avant de concevoir les interfaces.

**Travaux à réaliser :**
- Étudier comment les habitants de Kinshasa recherchent actuellement un logement.
- Identifier les difficultés des locataires et des voyageurs.
- Comprendre les besoins et les contraintes des bailleurs et hôtes.
- Étudier les habitudes de consultation des vidéos.
- Identifier les freins à la réservation en ligne et au paiement.
- Tester les parcours auprès de futurs utilisateurs.

**Livrables :** personas, enquêtes, parcours utilisateurs, rapports de recherche et recommandations UX.

### 3.2 UX/UI Designer / Product Designer

**Priorité : indispensable.**

**Mission :** concevoir les interfaces et l'expérience d'utilisation de Nzubu. Le rôle ne consiste pas uniquement à rendre l'application esthétique : il doit rendre les parcours clairs, cohérents et efficaces.

**Interfaces à concevoir :**

| Espace | Écrans et interfaces |
|---|---|
| Application mobile | Inscription, connexion, accueil, profil et navigation |
| Feed | Vidéos verticales, interactions, contrôles et navigation |
| Recherche | Filtres, résultats et carte |
| Logement | Vidéo, galerie, description, équipements et localisation |
| Réservation | Dates, nombre de personnes, prix et récapitulatif |
| Visites | Demande, choix de créneau et confirmation |
| Paiement | Récapitulatif, méthode, statut et confirmation |
| Profil | Informations personnelles, favoris et historique |
| Back-office | Tableaux de bord, formulaires, tableaux et calendriers |
| Agents | Missions, checklist, pièces jointes et rapports |
| Partenaires | Gestion des biens, tarifs, disponibilités et réservations |

**Livrables :** wireframes, maquettes haute fidélité, prototypes interactifs, design system, bibliothèque de composants et états d'erreur, de chargement et de confirmation.

### 3.3 Motion Designer / UI Animation Designer

**Priorité : évolutif ou mutualisable.**

**Mission :** concevoir les animations et interactions visuelles qui renforcent l'expérience Nzubu.

**Exemples :**
- Transitions entre les vidéos.
- Animations des boutons de réservation et des favoris.
- États de chargement du feed.
- Animations de confirmation de visite ou de réservation.
- Micro-interactions de navigation.

Cette fonction peut être assurée par le Product Designer au lancement.

## 4. Pôle Software Engineering — Développement logiciel

Ce pôle transforme les maquettes et spécifications en applications et services fonctionnels.

### 4.1 Software Architect / Solution Architect

**Priorité : indispensable, fonction pouvant être assumée par un CTO ou un Tech Lead senior.**

**Mission :** définir l'architecture technique globale de Nzubu et la manière dont les composants communiquent.

**Responsabilités :**
- Définir l'architecture logicielle.
- Évaluer et choisir les technologies adaptées.
- Structurer les composants applicatifs et les domaines métier.
- Définir les conventions de développement.
- Organiser la communication entre application mobile, Web et backend.
- Définir l'authentification et les permissions.
- Anticiper la montée en charge.
- Définir les principes de sécurité technique.

**Architecture à concevoir :** application mobile, backend/API, base de données, stockage et diffusion vidéo, back-office, espace partenaire, interface agent terrain, notifications, paiements et services externes.

**Livrables :** architecture technique, diagrammes, décisions d'architecture (ADR), documentation API et conventions techniques.

### 4.2 Tech Lead / Technical Lead

**Priorité : indispensable.**

**Mission :** diriger techniquement l'équipe de développement et garantir la cohérence du code avec l'architecture définie.

**Responsabilités :**
- Encadrer les développeurs.
- Effectuer ou superviser les revues de code.
- Définir les standards de qualité.
- Organiser les branches et les règles Git.
- Résoudre les problèmes techniques complexes.
- Contrôler les performances et la qualité des intégrations.
- Valider les choix techniques.
- Coordonner les intégrations entre modules.

**Livrables :** standards de développement, revues de code, architecture implémentée, décisions techniques et suivi de qualité.

Le Tech Lead peut contribuer au développement, mais ne doit pas devenir l'unique personne responsable de toute l'architecture et de tout le code.

### 4.3 Frontend Developer — Développeur Frontend

**Priorité : indispensable pour les interfaces Web.**

**Mission :** développer les interfaces visibles dans les navigateurs Web, notamment le back-office et les espaces partenaires.

**Fonctionnalités à développer :**

**Back-office Nzubu :**
- Tableau de bord général.
- Gestion des utilisateurs et des rôles.
- Gestion des logements et des annonces.
- Validation et modération des annonces.
- Gestion des vidéos.
- Gestion des missions terrain.
- Affectation des agents et calendriers.
- Gestion des visites et réservations.
- Suivi des paiements et transactions.
- Gestion des réclamations.
- Rapports et statistiques.

**Espace bailleurs et hôtes :**
- Création et modification des annonces.
- Dépôt de documents.
- Ajout de photos et vidéos.
- Gestion des tarifs et disponibilités.
- Consultation des réservations.
- Historique des opérations et suivi financier.

**Interface agents terrain :**
- Consultation des missions.
- Affichage de la localisation du logement.
- Checklist d'inspection.
- Téléversement de médias.
- Rédaction du rapport de mission.
- Mise à jour du statut de la mission.

**Livrables :** interfaces Web fonctionnelles, composants réutilisables, intégration API et optimisation responsive.

### 4.4 Backend Developer — Développeur Backend

**Priorité : indispensable.**

**Mission :** développer la logique interne de Nzubu : règles métier, services, traitement des demandes, accès aux données et communication avec les autres systèmes.

| Module | Responsabilités backend |
|---|---|
| Authentification | Inscription, connexion, OTP, sessions et récupération de compte |
| Utilisateurs | Profils, rôles, permissions et statuts |
| Logements | Création, modification, validation et archivage |
| Feed | Récupération et classement des vidéos et annonces |
| Recherche | Filtres, requêtes et pagination |
| Réservation | Création, confirmation, annulation et états |
| Calendrier | Disponibilités, blocage de dates et prévention des doubles réservations |
| Visites | Demandes, planification, affectation et confirmation |
| Paiements | Transactions, statuts, commissions et remboursements selon les règles définies |
| Notifications | Déclenchement et suivi des notifications |
| Avis | Notes, commentaires et modération |
| Réclamations | Création, affectation et suivi des dossiers |
| Administration | Règles métier, permissions et paramètres |

**Livrables :** API, règles métier, services applicatifs, gestion des données, intégrations et documentation technique.

### 4.5 Fullstack Developer — Développeur Fullstack

**Priorité : indispensable dans une équipe légère.**

**Mission :** développer à la fois les interfaces frontend et la logique backend d'une fonctionnalité ou d'un périmètre donné.

**Périmètres possibles dans Nzubu :**
- Développement complet du back-office.
- Espace partenaire.
- Formulaires de création et de modification des logements.
- Dashboards et tableaux de suivi.
- Modules de réservation et de gestion opérationnelle.
- Interfaces de reporting.
- API et services associés lorsque le périmètre est maîtrisé.

**Livrables :** fonctionnalités Web complètes, interfaces connectées aux API, composants et services métier.

**Différence entre les métiers :**

| Métier | Spécialité |
|---|---|
| Frontend Developer | Ce que l'utilisateur voit et utilise dans le navigateur |
| Backend Developer | La logique métier et les services côté serveur |
| Fullstack Developer | Les deux, sur un périmètre défini |

Un Fullstack peut couvrir plusieurs responsabilités dans une petite équipe, mais il ne doit pas être considéré comme le remplaçant automatique de tous les spécialistes sur un projet de la complexité de Nzubu.

### 4.6 Mobile App Developer — Développeur mobile

**Priorité : indispensable.**

**Mission :** développer l'application mobile Nzubu destinée aux utilisateurs, Android en premier et avec une stratégie compatible avec une future version iOS.

**Responsabilités et fonctionnalités :**
- Développer l'application Android.
- Connecter l'application aux API.
- Gérer les comptes et profils.
- Intégrer le lecteur vidéo et le feed vertical.
- Optimiser la navigation entre les vidéos.
- Développer la recherche et les filtres.
- Développer les favoris et le partage.
- Intégrer les demandes de visites.
- Intégrer les réservations et paiements.
- Gérer les notifications push.
- Optimiser les performances, l'autonomie et la consommation de données.

**Fonctionnalités principales :** inscription et authentification, feed vidéo vertical, lecture automatique, recherche de logements, filtres par commune et quartier, fiches immobilières, favoris, demandes de visites, réservations, historique, notifications et éventuellement messagerie selon le périmètre retenu.

**Livrables :** application Android, code source, intégration API, builds de test, préparation de publication et documentation.

**Recommandation :** étudier une technologie multiplateforme comme Flutter ou React Native pour faciliter une future version iOS. Le choix doit être confirmé après vérification des besoins vidéo, cartographiques, de paiement et des compétences de l'équipe.

### 4.7 iOS Developer — Développeur iOS

**Priorité : phase ultérieure si iOS n'est pas couvert directement par la technologie mobile choisie.**

**Mission :** développer, adapter et publier la version iOS de Nzubu.

**Responsabilités :**
- Adapter les interfaces à iOS.
- Gérer les permissions et fonctionnalités natives.
- Intégrer les notifications Apple.
- Optimiser le lecteur vidéo.
- Assurer la compatibilité avec les appareils Apple.
- Réaliser les tests et préparer la publication sur l'App Store.

Avec une technologie multiplateforme, un spécialiste iOS peut intervenir ponctuellement pour les adaptations natives et la publication.

### 4.8 API & Integration Developer — Développeur intégration

**Priorité : selon le nombre et la complexité des intégrations ; rôle souvent assuré par le Backend Developer.**

**Mission :** connecter Nzubu aux prestataires et services externes.

**Intégrations possibles :**
- Prestataires de paiement et Mobile Money.
- SMS et OTP.
- Notifications push.
- Cartographie et géolocalisation.
- Stockage et traitement vidéo.
- Envoi d'e-mails.
- Outils analytiques.
- CRM ou service client externe si choisi.

**Livrables :** connecteurs API, webhooks, gestion des erreurs, journalisation et documentation des intégrations.

### 4.9 Video Streaming / Media Engineer

**Priorité : très importante pour Nzubu ; expertise à mobiliser dès la conception du flux vidéo.**

**Mission :** concevoir et optimiser la chaîne de traitement et de diffusion vidéo.

**Fonctionnalités à prendre en charge :**
- Réception des vidéos filmées par les agents.
- Téléversement sécurisé.
- Compression et transcodage.
- Conversion en plusieurs résolutions.
- Génération de miniatures et métadonnées.
- Encodage adapté au streaming.
- Stockage des originaux et versions optimisées.
- Diffusion via CDN.
- Lecture adaptative selon la qualité de connexion.
- Préchargement des vidéos du feed.
- Gestion des vidéos retirées ou supprimées.
- Contrôle de la qualité des fichiers.

**Exemple de pipeline vidéo :**

1. L'agent filme le logement.
2. La vidéo est envoyée vers un espace de stockage sécurisé.
3. Le système compresse et transcode le fichier.
4. Les miniatures et métadonnées sont générées.
5. Le responsable de marché valide le contenu.
6. L'annonce et sa vidéo sont publiées.
7. Le CDN distribue la vidéo aux utilisateurs.
8. Le lecteur mobile adapte la qualité à la connexion.

**Livrables :** pipeline média, traitement vidéo, configuration de diffusion, optimisation de la bande passante et suivi des performances.

Ce rôle peut être externalisé pour la mise en place initiale, puis supervisé par le Backend et le DevOps.

### 4.10 Geospatial / GIS Developer — Développeur géospatial

**Priorité : recommandé ; peut être mutualisé au lancement.**

**Mission :** développer les fonctionnalités liées à la géographie et à la localisation.

**Fonctionnalités :**
- Enregistrement des coordonnées des logements.
- Recherche par province, ville, commune et quartier.
- Affichage des logements sur une carte.
- Recherche par proximité ou rayon géographique.
- Affectation des missions aux agents par zone.
- Visualisation de la couverture territoriale.
- Gestion des zones d'intervention.

**Livrables :** services de géolocalisation, recherche spatiale, cartographie et outils de gestion territoriale.

Le Backend Developer peut intégrer une première version avec une base de données géospatiale adaptée.

## 5. Pôle Infrastructure, DevOps & Cybersecurity

Ce pôle assure l'hébergement, les déploiements, la disponibilité, la sauvegarde et la protection de Nzubu.

### 5.1 DevOps Engineer

**Priorité : indispensable avant la production ; mobilisation dès les premières phases d'architecture.**

**Mission :** automatiser les processus de développement, de test, de déploiement et de maintenance.

**Responsabilités :**
- Mettre en place les environnements de développement, test, préproduction et production.
- Configurer les serveurs et services cloud.
- Mettre en place les pipelines CI/CD.
- Automatiser les déploiements.
- Configurer les certificats SSL.
- Gérer les variables d'environnement et les secrets.
- Superviser les ressources informatiques.
- Automatiser les sauvegardes.
- Mettre en place les alertes et le monitoring.
- Définir les procédures de maintenance et de reprise.

**Périmètres Nzubu :** hébergement backend, back-office, base de données, stockage vidéo, application Web, builds Android, sécurité des secrets, monitoring, sauvegardes et restauration.

**Livrables :** infrastructure cloud, pipelines CI/CD, environnements, scripts de déploiement, stratégie de sauvegarde, documentation et procédures d'incident.

### 5.2 Cloud Engineer / Cloud Architect

**Priorité : indispensable comme responsabilité, mais rôle mutualisable avec DevOps au lancement.**

**Mission :** concevoir et gérer l'environnement cloud qui héberge Nzubu.

**Responsabilités :**
- Choisir les solutions d'hébergement.
- Dimensionner les ressources.
- Concevoir l'infrastructure réseau.
- Configurer les espaces de stockage.
- Organiser les environnements cloud.
- Optimiser les coûts.
- Anticiper l'augmentation du trafic.
- Définir les politiques de disponibilité.

**Périmètres :** backend, back-office, stockage média, CDN, base de données, sauvegardes, réseau et sécurité cloud.

### 5.3 Database Administrator (DBA) / Database Engineer

**Priorité : indispensable comme compétence ; fonction mutualisable avec le Backend Developer au démarrage.**

**Mission :** concevoir, organiser, sécuriser et optimiser les bases de données.

**Responsabilités :**
- Concevoir le modèle de données.
- Organiser les relations entre les tables.
- Optimiser les requêtes et index.
- Surveiller les performances.
- Prévenir les pertes de données.
- Organiser les sauvegardes et restaurations.
- Gérer les migrations.
- Définir les règles d'accès et de conservation.

**Domaines de données :** utilisateurs, logements, partenaires, médias, territoires, missions, inspections, réservations, disponibilités, paiements, service client, avis et événements analytiques.

**Livrables :** modèle de données, schémas, scripts de migration, optimisation, sauvegardes et documentation.

### 5.4 Cybersecurity Engineer / Application Security Engineer

**Priorité : indispensable avant production ; audit spécialisé fortement recommandé.**

**Mission :** protéger l'application, les données et les infrastructures contre les menaces informatiques.

**Responsabilités :**
- Auditer la sécurité du code.
- Contrôler les mécanismes d'authentification.
- Sécuriser les API.
- Identifier les vulnérabilités.
- Prévenir les accès non autorisés.
- Contrôler les rôles et permissions.
- Sécuriser les fichiers téléversés.
- Mettre en place une journalisation adaptée.
- Réaliser des tests de pénétration.
- Contrôler les mesures de protection des données.

**Fonctionnalités et systèmes à sécuriser :** inscription, OTP, rôles et permissions, back-office, documents, paiements, téléversement vidéo, données partenaires, historiques et sessions.

**Livrables :** audit de sécurité, rapport de vulnérabilités, recommandations, tests de pénétration et plan de correction.

### 5.5 DevSecOps Engineer

**Priorité : évolutif ou mutualisable.**

**Mission :** intégrer les contrôles de sécurité dans le processus continu de développement et de déploiement.

**Responsabilités :**
- Scanner automatiquement les dépendances.
- Vérifier les vulnérabilités du code.
- Contrôler les images de conteneurs.
- Sécuriser les pipelines CI/CD.
- Gérer les secrets techniques.
- Détecter les mauvaises configurations cloud.
- Automatiser les contrôles de sécurité.

Au lancement, ces responsabilités peuvent être partagées entre le DevOps, le Tech Lead et un consultant en cybersécurité.

### 5.6 Site Reliability Engineer (SRE)

**Priorité : évolutif, surtout lorsque le trafic augmente.**

**Mission :** garantir la fiabilité, la disponibilité et la performance de Nzubu.

**Responsabilités :**
- Définir les objectifs de disponibilité.
- Suivre les temps de réponse.
- Identifier les ralentissements.
- Organiser la gestion des incidents.
- Mettre en place les systèmes de surveillance.
- Analyser les causes profondes des incidents.
- Réduire les interruptions de service.

**Périmètres :** feed vidéo, temps de chargement des annonces, performance des API, paiements, back-office et streaming.

Le DevOps peut couvrir ces fonctions au démarrage.

## 6. Pôle Quality Assurance — Tests et qualité logicielle

### 6.1 QA Engineer / Software Tester

**Priorité : indispensable.**

**Mission :** vérifier que les fonctionnalités développées fonctionnent correctement et respectent les besoins définis.

**Responsabilités :**
- Tester les fonctionnalités.
- Vérifier les parcours utilisateurs.
- Identifier et documenter les erreurs.
- Tester les différents rôles et permissions.
- Vérifier les cas limites.
- Contrôler les résultats des opérations.
- Effectuer les tests de régression.
- Préparer les rapports de validation.

**Exemples de scénarios de test :**

| Fonctionnalité | Scénario de test |
|---|---|
| Inscription | Un utilisateur crée son compte. |
| OTP | Le code est reçu et validé correctement. |
| Feed | Les vidéos s'affichent et se lisent correctement. |
| Recherche | Les filtres retournent les logements attendus. |
| Réservation | Une demande est créée avec les bonnes informations. |
| Disponibilité | Une date déjà réservée ne peut pas être attribuée une seconde fois. |
| Paiement | Les différents statuts de transaction sont traités correctement. |
| Annulation | Les règles d'annulation sont appliquées. |
| Terrain | Un agent reçoit et clôture une mission. |
| Validation | Une annonce non validée ne devient pas publique. |
| Permissions | Un agent ne peut pas accéder aux fonctions réservées à l'administration. |

**Livrables :** plans de tests, cas de test, rapports de bugs, rapports de validation et procès-verbaux de recette.

### 6.2 QA Automation Engineer

**Priorité : fortement recommandé ; rôle pouvant être assuré par le QA Engineer au départ.**

**Mission :** automatiser les tests répétitifs pour éviter que de nouvelles modifications cassent des fonctionnalités existantes.

**Travaux :**
- Automatiser les tests de connexion.
- Automatiser les tests de réservation.
- Automatiser les tests API.
- Tester les paiements en environnement de test.
- Créer des tests de régression.
- Intégrer les tests aux pipelines CI/CD.

**Livrables :** scripts, scénarios automatisés, rapports et intégration aux pipelines.

### 6.3 Performance & Load Tester

**Priorité : avant la montée en charge ; intervention ponctuelle possible.**

**Mission :** tester le comportement de Nzubu lorsque de nombreux utilisateurs sont connectés simultanément.

**Tests :** connexions simultanées, consultation massive des annonces, chargement vidéo, demandes de réservation simultanées, sollicitations API, montée en charge du back-office et résilience aux pics de trafic.

Cette spécialité peut être assurée par un QA Automation Engineer ou un prestataire externe.

## 7. Pôle Data, Intelligence & Analytics

### 7.1 Data Analyst / BI Analyst

**Priorité : recommandé.**

**Mission :** transformer les données de Nzubu en indicateurs utiles à la gestion et aux décisions commerciales.

**Tableaux de bord à produire :**

**Performance générale :**
- Nombre d'utilisateurs inscrits et actifs.
- Nombre de logements reçus, vérifiés et publiés.
- Nombre de visites demandées et réalisées.
- Nombre de réservations.
- Taux de conversion.
- Chiffre d'affaires et commissions générées.

**Analyse territoriale :**
- Logements par commune et quartier.
- Demandes et réservations par zone.
- Zones les plus consultées.
- Zones sous-représentées.
- Demande de logements meublés et non-meublés.

**Analyse du feed vidéo :**
- Nombre de vues.
- Durée moyenne de visionnage.
- Vidéos les plus consultées.
- Taux de clic sur une annonce.
- Conversion en demande de visite.
- Conversion en réservation.

**Livrables :** tableaux de bord, rapports, analyses et recommandations commerciales.

### 7.2 Data Engineer

**Priorité : évolutif, selon le volume et la complexité des données.**

**Mission :** organiser les flux de données et préparer les données pour les analyses avancées.

**Responsabilités :**
- Construire les pipelines de données.
- Organiser les données d'événements.
- Centraliser les données utiles.
- Concevoir les entrepôts de données.
- Préparer les données pour les analyses.
- Assurer la qualité des données.

### 7.3 AI / Machine Learning Engineer

**Priorité : phase avancée ; ne constitue pas une priorité du MVP.**

**Mission :** développer des fonctionnalités intelligentes à partir des données de Nzubu.

**Fonctionnalités possibles :**
- Recommandations personnalisées de logements.
- Classement des vidéos.
- Suggestions selon les préférences.
- Détection d'annonces potentiellement frauduleuses.
- Détection de contenus dupliqués.
- Analyse des comportements de navigation.
- Estimation des tendances de prix.
- Assistant conversationnel de recherche immobilière.

Ces fonctionnalités nécessitent des données suffisamment fiables et un volume pertinent. Elles ne doivent pas être développées avant d'avoir une base d'usage et de données exploitable.

## 8. Autres métiers complémentaires

| Métier | Rôle dans Nzubu | Priorité indicative |
|---|---|---|
| UX Writer / Content Designer | Rédaction des textes d'interface, messages d'erreur et instructions | Recommandé |
| Technical Writer | Documentation technique et guides d'utilisation | Recommandé |
| Release Manager | Organisation des versions, validations et publications | Mutualisable |
| Technical Support Engineer | Diagnostic des incidents techniques après lancement | Après lancement |
| Growth Product Manager | Acquisition, activation, rétention et conversion | Après lancement |
| ASO Specialist | Optimisation de la présence sur Google Play et App Store | Avant / après lancement |
| SEO Specialist | Référencement de la plateforme Web si elle est indexable | Évolutif |
| Accessibility Specialist | Vérification de l'accessibilité des interfaces | Recommandé |
| Legal / Compliance Specialist | Validation juridique et conformité des traitements | Avant production |
| Payment & Fintech Specialist | Vérification de l'architecture des paiements et rapprochement des transactions | Avant production |

Ces profils ne nécessitent pas tous un recrutement interne. Plusieurs peuvent intervenir ponctuellement.

## 9. Répartition des fonctionnalités entre les métiers

La responsabilité principale d'un module ne signifie pas qu'une seule personne réalise tout le code. Une fonctionnalité complète peut impliquer une interface mobile, une interface Web, des API, une base de données, une infrastructure et des tests.

| Module Nzubu | Responsable technique principal | Collaborateurs |
|---|---|---|
| Feed vidéo | Mobile Developer | Backend, Media Engineer, UX/UI |
| Lecteur vidéo | Mobile Developer | Media Engineer, Backend |
| Gestion des annonces | Backend Developer | Frontend, Fullstack |
| Recherche immobilière | Backend Developer | Frontend, Mobile, GIS |
| Géolocalisation | Backend Developer | GIS, Mobile |
| Profils utilisateurs | Backend Developer | Mobile, Frontend |
| Authentification OTP | Backend Developer | Mobile, Integration |
| Favoris | Backend Developer | Mobile, Frontend |
| Demandes de visites | Backend Developer | Frontend, Mobile, BA |
| Calendrier | Backend Developer | Frontend, Mobile |
| Réservations courtes durées | Backend Developer | Mobile, Frontend, BA |
| Locations longues durées | Backend Developer | Frontend, BA, Product |
| Paiements | Backend Developer | Integration, DevOps, QA |
| Remboursements | Backend Developer | Integration, QA, métier financier |
| Gestion des agents | Fullstack Developer | Backend, BA |
| Affectation des missions | Fullstack Developer | Backend, GIS, BA |
| Inspection terrain | Fullstack Developer | Backend, UX/UI |
| Validation des annonces | Fullstack Developer | Backend, Product |
| Portail partenaires | Frontend / Fullstack | Backend, UX/UI |
| Gestion du contenu | Fullstack Developer | Backend, Media Engineer |
| Service client | Fullstack Developer | Backend, BA |
| Notifications | Backend Developer | Mobile, Integration |
| Modération | Fullstack Developer | Backend, QA |
| Tableaux de bord | Fullstack Developer | Data Analyst, Backend |
| Statistiques avancées | Data Analyst | Data Engineer, Backend |

## 10. Les six grands modules fonctionnels de Nzubu

### Module A — Application mobile utilisateur

- Inscription et authentification.
- Feed vidéo immobilier.
- Recherche et filtres.
- Fiches logements.
- Favoris et partage.
- Demandes de visites.
- Réservations.
- Paiements.
- Avis et évaluations.
- Historique et notifications.

### Module B — Back-office d'administration

- Gestion des utilisateurs.
- Gestion des équipes et des permissions.
- Gestion des annonces et vidéos.
- Validation et modération.
- Gestion des réservations.
- Supervision des paiements.
- Gestion des litiges.
- Paramètres et statistiques.

### Module C — Opérations et terrain

- Réception des demandes de logements.
- Vérification documentaire.
- Planification des rendez-vous.
- Affectation des agents.
- Organisation par zones.
- Checklist d'inspection.
- Production et transmission des vidéos.
- Rapports de mission.
- Suivi des validations.

### Module D — Espace bailleurs et hôtes

- Enregistrement des partenaires.
- Soumission des logements.
- Dépôt de justificatifs.
- Tarification.
- Gestion des disponibilités.
- Consultation des réservations.
- Historique des opérations.
- Suivi des règlements.

### Module E — Service client

- Gestion des demandes.
- Gestion des réclamations.
- Historique des échanges.
- Gestion des annulations.
- Suivi des remboursements.
- Gestion des tickets.
- Base de connaissances.
- Suivi de satisfaction.

### Module F — Data & Business Intelligence

- Statistiques utilisateurs.
- Performances des annonces.
- Conversion des vidéos.
- Suivi des agents.
- Performances territoriales.
- Revenus et commissions.
- Taux de réservation.
- Analyse de la demande immobilière.

## 11. Architecture technique globale recommandée

### 11.1 Couches applicatives

| Couche | Composants |
|---|---|
| Applications et interfaces | Application Android, back-office Web, espace partenaires, interface agents |
| Backend et API | Authentification, règles métier, permissions, réservations, transactions et services |
| Données | Utilisateurs, logements, médias, opérations, paiements et réservations |
| Services média | Téléversement, stockage, transcodage, miniatures et CDN |
| Services externes | Mobile Money, SMS, notifications et cartographie |
| Analytics | Événements, statistiques et tableaux de bord |
| Infrastructure transversale | Cloud, DevOps, sécurité, monitoring, sauvegardes et tests |

### 11.2 Choix d'architecture

Pour le lancement, un **monolithe modulaire** avec des domaines métier bien séparés peut être plus adapté qu'une architecture microservices complète. Il réduit la complexité initiale, facilite le développement et limite les coûts d'exploitation.

Le traitement vidéo doit toutefois faire l'objet d'une chaîne dédiée, car ses besoins de stockage, de transcodage et de diffusion sont différents de ceux des opérations métier classiques.

### 11.3 Technologies envisageables

Les technologies suivantes sont des options à étudier et non des choix définitifs :

| Domaine | Technologies envisageables |
|---|---|
| Application mobile | Flutter ou React Native |
| Frontend Web | React / Next.js |
| Backend | NestJS, Laravel ou Django |
| API | REST, éventuellement WebSockets |
| Base de données | PostgreSQL |
| Recherche géographique | PostGIS |
| Cache | Redis |
| Stockage média | Object Storage compatible S3 |
| Transcodage vidéo | FFmpeg ou service média managé |
| Diffusion vidéo | CDN |
| Conteneurisation | Docker |
| Orchestration | À déterminer selon les besoins réels |
| CI/CD | GitHub Actions ou GitLab CI/CD |
| Monitoring | Prometheus, Grafana ou solution managée |

Le choix final doit tenir compte des compétences disponibles, des coûts, des contraintes d'hébergement, du volume vidéo anticipé et de la maintenance à long terme. Il ne faut pas choisir une technologie uniquement parce qu'elle est populaire.

## 12. Équipe principale recommandée pour le lancement

Identifier une vingtaine de métiers ne signifie pas recruter vingt personnes. L'équipe doit être dimensionnée selon les fonctionnalités du MVP et les compétences réellement disponibles.

### 12.1 Équipe principale indicative

| Poste | Nombre indicatif | Mode de mobilisation |
|---|---:|---|
| Product Manager / Product Owner / Business Analyst | 1 | Temps plein, responsabilités regroupées au départ |
| UI/UX Product Designer | 1 | Temps plein pendant conception, puis selon charge |
| Tech Lead / Software Architect | 1 | Temps plein |
| Backend Developer | 1 | Temps plein |
| Mobile Developer | 1 à 2 | Temps plein |
| Fullstack Developer | 1 à 2 | Temps plein |
| QA Engineer | 1 | Temps plein ou partagé selon la phase |
| DevOps / Cloud Engineer | 1 | Temps plein ou partagé selon l'infrastructure |

Cela représente environ **8 à 10 personnes** selon les regroupements de rôles et le nombre de développeurs mobilisés. Le nombre exact doit être fixé après estimation du périmètre MVP et du calendrier.

### 12.2 Spécialistes à mobiliser ponctuellement

| Spécialiste | Intervention |
|---|---|
| Video Streaming Engineer | Conception initiale et optimisation média |
| Cybersecurity Engineer | Audit et tests de sécurité |
| DBA | Conception et optimisation avancée |
| GIS Developer | Recherche géographique avancée |
| Payment Integration Specialist | Intégration et validation des paiements |
| QA Automation Specialist | Automatisation des tests |
| Performance Tester | Tests de montée en charge |
| Data Analyst | Mise en place des indicateurs |
| Legal / Compliance Specialist | Validation réglementaire |
| iOS Developer | Phase d'extension iOS si nécessaire |
| AI Engineer | Phase de développement intelligent |

## 13. Équipe technique et équipe opérationnelle : deux équipes différentes

Il faut distinguer les personnes qui construisent les outils des collaborateurs de Nzubu qui les utilisent au quotidien.

| Équipe opérationnelle Nzubu | Équipe technique responsable des outils |
|---|---|
| Chargée des opérations | Fullstack et Backend Developer, avec cadrage du BA/PO |
| Responsable marché meublé | Product Owner, Business Analyst et Backend |
| Responsable marché non-meublé | Product Owner, Business Analyst et Backend |
| Agent de terrain | Fullstack / Frontend et Backend |
| Service client | Fullstack et Backend |
| Social Media Manager | Product Designer et développeurs du module média/CMS |
| Direction | Product Manager et Data Analyst |

**Exemple — Chargée des opérations :** elle doit pouvoir consulter les demandes reçues, affecter un agent, programmer un rendez-vous et suivre le rapport de mission. Elle n'a pas besoin de savoir programmer : l'équipe technique lui fournit cet outil.

**Exemple — Responsable de marché :** il ou elle doit pouvoir consulter les annonces du marché concerné, contrôler les informations, valider ou refuser une publication, contrôler les disponibilités et suivre les performances.

Le système de rôles et permissions doit donner à chaque collaborateur uniquement les accès nécessaires à son travail.

## 14. Ordre d'intervention des métiers

Le développement doit suivre un cycle organisé. Les phases peuvent se chevaucher, mais les dépendances doivent être respectées.

### Phase 1 — Discovery & Business Analysis

**Métiers :** Product Manager, Business Analyst, Product Owner, UX Researcher.

**Travaux :** étude du marché, définition des besoins, cartographie des processus, règles métier, périmètre MVP et spécifications.

### Phase 2 — UX/UI & Prototypage

**Métiers :** Product Designer, UX/UI Designer, UX Writer.

**Travaux :** wireframes, parcours, maquettes, prototypes et design system.

### Phase 3 — Architecture & Infrastructure

**Métiers :** Architecte, Tech Lead, Backend Developer, DevOps et DBA.

**Travaux :** architecture, base de données, API, sécurité initiale, environnements et stockage vidéo.

### Phase 4 — Développement

**Métiers :** Mobile, Frontend, Backend, Fullstack et Media Engineer.

**Travaux :** application Android, back-office, portail partenaires, opérations terrain et services backend.

### Phase 5 — Quality Assurance

**Métiers :** QA, QA Automation, Cybersecurity et Performance Tester.

**Travaux :** tests fonctionnels, techniques, sécurité, performance, régression et correction.

### Phase 6 — Préproduction & Release

**Métiers :** DevOps, Tech Lead, QA et Product Owner.

**Travaux :** recette, déploiement, vérification des paiements, sauvegardes, monitoring et publication.

### Phase 7 — Exploitation & amélioration continue

**Métiers :** support, DevOps, Product, Data et développeurs.

**Travaux :** surveillance, corrections, analyse des performances et développement des nouvelles fonctionnalités.

## 15. Priorisation des fonctionnalités

### P0 — Indispensable au lancement du MVP

- Authentification et gestion des comptes.
- Feed vidéo et lecteur.
- Gestion des annonces et fiches logements.
- Recherche et filtres.
- Favoris.
- Vérification des biens et workflow de publication.
- Missions terrain et rapports d'inspection.
- Demandes de visites.
- Réservations et gestion des disponibilités.
- Back-office, rôles et permissions.
- Notifications essentielles.
- Paiements selon le modèle commercial retenu et journal des transactions.
- Sécurité, sauvegardes, monitoring et tests de base.

### P1 — À développer après stabilisation du MVP ou selon nécessité commerciale

- Espace partenaires avancé.
- Messagerie.
- CRM et gestion avancée des tickets SAV.
- Cartographie avancée.
- Tableaux de bord analytiques.
- Automatisation avancée des tests.
- Outils de modération avancés.

### P2 — Évolutions

- Recommandations personnalisées par IA.
- Tarification intelligente.
- Programme de fidélité.
- Fonctionnalités avancées de croissance.
- Application iOS si elle n'est pas couverte par la stratégie multiplateforme.

Les réservations meublées de courte durée et les locations non-meublées de longue durée doivent être séparées dès la conception : elles ont des parcours, contrats, durées et règles financières différents.

## 16. Recommandations stratégiques

1. **Éviter de développer trop d'applications distinctes.** Au lancement, privilégier une application Android pour les utilisateurs, un back-office Web pour le personnel et une interface Web responsive ou PWA pour les agents et partenaires. Une application mobile interne séparée ne sera justifiée que si les usages le nécessitent.
2. **Faire du système vidéo une priorité architecturale.** La rapidité d'affichage, la compression, la qualité de lecture, la bande passante et le coût de diffusion doivent être pensés dès le départ.
3. **Formaliser les processus métier avant de coder les dashboards.** Il faut savoir qui reçoit une demande, qui la vérifie, qui planifie, qui inspecte, qui valide et qui autorise la publication.
4. **Prévoir un système de permissions avancé.** Un agent de terrain ne doit pas avoir les mêmes droits qu'un administrateur. Les accès aux transactions financières doivent être contrôlés.
5. **Prévoir le fonctionnement avec une connexion instable.** Les formulaires terrain doivent pouvoir conserver des brouillons hors connexion. Les téléversements vidéo doivent permettre une reprise après interruption.
6. **Construire une infrastructure évolutive, mais pas surdimensionnée.** Commencer par des services maîtrisables, documentés et supervisés. Une architecture plus distribuée doit être justifiée par des besoins mesurés.

## 17. Livrables à exiger de l'agence de développement

L'agence ne doit pas simplement remettre une application qui fonctionne sur ses propres machines. Le contrat et le plan de livraison doivent prévoir la remise à Nzubu de :

- Cahier des charges fonctionnel et technique.
- Maquettes et prototypes.
- Code source complet.
- Dépôts Git appartenant à Nzubu ou contrôlés par Nzubu.
- Documentation de l'architecture.
- Documentation des API.
- Modèle de base de données.
- Scripts de déploiement et configuration d'infrastructure.
- Environnements de test, préproduction et production.
- Procédures de sauvegarde et de restauration.
- Rapports de tests et d'audit de sécurité.
- Comptes et accès aux infrastructures au nom de Nzubu.
- Instructions de maintenance et de reprise du projet.

La propriété intellectuelle, la confidentialité, les droits sur le code, les licences des dépendances, les accès aux comptes et les modalités de transfert doivent être définis dans le contrat.

## 18. Conclusion

Le principal défi technique de Nzubu n'est pas simplement de développer un feed vidéo. Le véritable défi est de faire communiquer correctement quatre dimensions :

1. La découverte immobilière par vidéo.
2. La gestion et la vérification physique des logements.
3. La gestion commerciale et contractuelle des locations.
4. La coordination des équipes opérationnelles.

C'est leur intégration qui fera de Nzubu une véritable plateforme immobilière, et non une simple application de petites annonces enrichie de vidéos.

**Étape suivante recommandée :** rédiger le cahier des charges fonctionnel et technique global de Nzubu, organisé par modules, écrans, rôles, workflows, règles métier, API et critères d'acceptation. Ce document servira de référence commune au Product Manager, aux designers, aux développeurs, au QA et au DevOps pendant toute la conception.
