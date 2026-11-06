# NZUBU — Comptes, travail et parcours pour réaliser l’Appflow

**Document de transmission — analyse du projet au 6 novembre 2026.**

## 1. Comment utiliser ce document

Ce document explique qui fait quoi dans NZUBU, dans son espace numérique et dans son activité réelle, puis décrit les actions à représenter dans une cartographie des parcours. Il s’appuie sur le mode connecté à l’API, choisi par défaut dans le projet. Le mode démo contient d’autres écrans et des données simulées : il ne faut pas automatiquement considérer ses boutons ou ses rôles comme disponibles en mode connecté.

Trois niveaux doivent rester visibles dans l’Appflow :

- **[ACTUEL]** : comportement identifiable dans le code du mode API. Cela indique une implémentation, pas une garantie que chaque écran a été entièrement testé en conditions réelles.
- **[PRÉVU]** : intention du dossier produit, pas nécessairement disponible dans le compte actuel.
- **[À DÉCIDER / À CONCEVOIR]** : proposition complémentaire ou question ouverte ; ne pas la dessiner comme une fonction déjà livrée.

Une « page » ci-dessous peut être un onglet, un panneau superposé, une section dans une même page ou un dialogue. Dans l’application actuelle, beaucoup de liens des espaces professionnels font simplement défiler la page jusqu’à une section ; ils ne créent pas forcément une nouvelle URL. Les actions peuvent échouer : une destination de parcours décrit le comportement du clic, pas une garantie de succès.

## 2. La logique globale de NZUBU

NZUBU est une plateforme immobilière opérée : elle aide un client à découvrir un bien, mais elle coordonne aussi la vérification de ce bien, les personnes qui le proposent et le suivi des demandes. Deux activités commerciales différentes coexistent :

1. **Courte durée** : un voyageur demande un séjour ; l’hôte accepte ; le client paie directement l’hôte et déclare ce paiement ; l’hôte confirme la réception ; les opérations clôturent le séjour après le départ et suivent une commission.
2. **Longue durée** : un client peut demander une visite et/ou déposer une candidature ; les opérations suivent la visite et le dossier ; le bail est signé à l’extérieur de la plateforme et sa preuve est contrôlée.

Avant tout cela, un partenaire propose le logement, transmet ses pièces et une vidéo ; les opérations contrôlent le dossier et affectent un agent ; l’agent inspecte réellement les lieux ; les opérations contrôlent le résultat et la vidéo avant publication. Le badge indique un contrôle limité à un périmètre et à une date : il ne garantit ni une disponibilité permanente ni l’absence de tout risque.

**Règle essentielle :** publier un bien, constater un paiement, transférer de l’argent, déclarer un remboursement et vérifier indépendamment un paiement sont des actes différents. Le code actuel ne transforme pas les déclarations en preuve bancaire indépendante.

## 3. Les comptes existants et les métiers

| Compte réel [ACTUEL] | Titulaire et mission | Périmètre principal | Limite majeure |
|---|---|---|---|
| Visiteur non connecté | Personne qui explore | Offres publiées et éligibles, recherche, fiche et informations publiques | Les actions personnelles exigent un compte client. |
| Client `CLIENT` | Voyageur ou candidat locataire | Ses favoris, réservations, visites, candidatures, preuves et tickets | Ne modifie pas un bien, ne valide pas un badge ni la réception d’un paiement. |
| Partenaire `PARTNER` | Propriétaire, bailleur, hôte ou représentant du bien | Ses annonces et leurs dossiers associés | Ne publie pas lui-même et ne modifie pas les constats de l’agent. Son droit réel à agir doit être vérifié. |
| Agent terrain `FIELD_AGENT` | Collaborateur qui inspecte physiquement | Missions qui lui sont attribuées et documents autorisés de ces biens | Ne publie pas, ne décide pas des réservations, ne confirme pas les encaissements. |
| Administration/opérations `OPERATIONS_ADMIN` | Équipe interne de pilotage | Comptes, biens, contrôle, missions, dossiers, incidents et suivi des commissions | C’est actuellement un accès large : les métiers internes ne sont pas isolés en comptes techniques distincts. |

**Important [PRÉVU] :** le dossier métier distingue notamment la personne chargée des opérations/dispatch, les responsables de marché meublé et non meublé, le service client, la finance, la modération, l’administration et la direction. Ce sont des responsabilités métier utiles pour l’Appflow cible ; le serveur actuel ne leur attribue pas chacun un rôle et des permissions séparés. De même, propriétaire, hôte, mandataire et gestionnaire ne sont pas quatre comptes techniques distincts : ils sont regroupés dans `PARTNER`. Ne pas promettre une séparation des tâches, des périmètres géographiques ou une validation à deux personnes généralisée qui n’est pas réellement imposée aujourd’hui.

## 4. Accès commun, inscription et connexion

### 4.1 Visiteur → client

1. [ACTUEL] L’accueil public ouvre l’expérience de découverte ; les annonces éligibles sont celles publiées dont la vérification n’est pas expirée. Le visiteur peut naviguer et consulter la fiche.
2. En cliquant sur **Se connecter**, ou en tentant une action nécessitant un compte, il est dirigé par défilement vers la section de connexion. L’action initiale n’est pas nécessairement reprise automatiquement après connexion.
3. **Inscription** → saisir e-mail, téléphone international facultatif et mot de passe de 10 à 128 caractères → **Recevoir le code par e-mail** → section de saisie du code à six chiffres → **Vérifier et créer mon compte** → compte activé et session ouverte. Un nouvel inscrit public reçoit le rôle client.
4. **Connexion** → e-mail ou téléphone associé + mot de passe → espace correspondant au rôle du compte. **Mot de passe oublié ?** → e-mail → code reçu par e-mail → nouveau mot de passe → retour à la connexion.
5. **Déconnexion** → fin de session et retour à l’expérience publique. Dans l’espace client, **Fermer le compte** demande confirmation ; certains dossiers liés à un litige ouvert peuvent être conservés avec accès restreint.

### 4.2 Création d’un compte professionnel

[ACTUEL] Un administrateur crée ou attribue un rôle partenaire, agent ou administrateur à partir d’une adresse e-mail. Son titulaire passe ensuite par **Inscription**, vérifie son e-mail et définit son mot de passe, avant de se connecter. Un visiteur ne choisit pas librement un rôle professionnel. Le serveur ne modélise actuellement qu’un rôle par utilisateur ; l’interface de création peut aussi modifier le rôle d’une adresse existante. [À CONCEVOIR] Prévoir une procédure explicite d’invitation, de changement de rôle, de désactivation et de contrôle renforcé des privilèges ; ne pas supposer que ces étapes sont toutes opérationnelles.

## 5. Compte client : ce que je fais et où je vais

### 5.1 Ma mission et mes limites

Je cherche un bien, j’évalue son adéquation à mes besoins, je demande un séjour ou une visite, et je suis mes dossiers. Je communique des informations exactes, respecte les conditions acceptées et conserve les justificatifs de paiement. Sur le terrain, je me présente à la visite ou au séjour convenu et je signale un problème réel.

Je ne peux pas consulter les dossiers d’autres clients, changer le prix d’une annonce, publier un logement ni confirmer moi-même que l’hôte a reçu mon paiement. Une demande envoyée n’est pas encore une réservation confirmée. Les moyens et instructions exacts de paiement hors plateforme restent à préciser avec l’hôte et l’équipe.

### 5.2 Navigation client [ACTUEL]

| Départ / action | Arrivée et effet |
|---|---|
| Accueil **Feed** | Affiche une annonce vidéo à la fois ; balayage vertical ou commandes de navigation pour passer aux biens. Lecture/pause selon les contrôles présents. |
| Choisir une commune | Met à jour le filtre et les résultats. |
| **Explorer** | Ouvre la vue de recherche et les filtres disponibles : commune, courte/longue durée, meublé et prix maximum. Les résultats répondent aux filtres. |
| Choisir un bien / **Détails** | Ouvre un panneau de fiche : description, localisation disponible, prix, équipements, conditions et action principale selon la durée. |
| Badge ou **Voir les contrôles NZUBU** | Ouvre le panneau de vérification, avec date/périmètre et limites du contrôle. Revenir ferme ou remplace ce panneau. |
| Cœur / favori | Si client connecté, ajoute ou retire le bien ; sinon dirige vers connexion. Les favoris dépendent des biens publics et des filtres visibles. |
| **Partager** | Ouvre le partage natif si disponible ou copie/propose le lien selon le navigateur ; un lien peut ouvrir le bien via un paramètre dans l’adresse. |
| **Dossiers** | Ouvre les rubriques de suivi : séjours, visites, candidatures, favoris, assistance, notifications et compte selon les options affichées. |
| **Signaler la vidéo** dans la fiche | Demande un texte ; si accepté par le serveur, crée une alerte critique, masque l’annonce et remet en cause la validation média. |
| Assistance → saisir message → envoyer | Crée un ticket consultable dans mes dossiers ; minimum de 10 caractères côté serveur. Il ne s’agit pas d’une messagerie complète en temps réel. |
| Notifications | Affiche les notifications disponibles pour mon compte ; ne présumez pas qu’une notification est émise à chaque étape. |

### 5.3 Demander un séjour court [ACTUEL]

1. Feed ou Explorer → fiche d’un logement courte durée → **Demander à réserver** → panneau de réservation ; les indisponibilités sont chargées. Si elles ne chargent pas, la demande reste bloquée dans l’interface.
2. Je sélectionne arrivée et départ dans le calendrier ou les champs de date, indique de 1 à 20 voyageurs et accepte les conditions affichées et le paiement direct à l’hôte. Le serveur exige des dates valides, une arrivée non passée, 1 à 90 nuits et des conditions enregistrées pour le bien. Le prix total est calculé par le serveur : prix/nuit × nombre de nuits.
3. **Envoyer ma demande de réservation** → fermeture du panneau et affichage de **Dossiers → Séjours** ; l’envoi serveur s’effectue en parallèle et un message de succès ou d’erreur apparaît. Il faut donc représenter aussi le cas où l’écran de suivi s’ouvre mais où la création échoue.
4. Statut initial **demande envoyée** : elle n’est pas une réservation confirmée et ne bloque pas à elle seule les dates. Lorsque l’hôte accepte, un blocage temporaire de 30 minutes commence. Le client est informé de l’acceptation.
5. Je verse l’avance directement à l’hôte selon le canal convenu, puis dans **Dossiers → Séjours**, **Déclarer le paiement** → saisir la référence → dossier au statut paiement déclaré. L’avance actuellement calculée est de 20 % du prix ; le solde affiché est de 80 %. Ces chiffres sont des hypothèses non approuvées pour l’exploitation réelle.
6. L’hôte doit confirmer la réception avant la fin du blocage ; le dossier devient alors **confirmé**. Après expiration, la déclaration ou la confirmation ne peut plus suivre normalement et un conflit peut être signalé. [À CONCEVOIR] Définir le parcours exact si le client a réellement payé mais que le délai expire ou que l’hôte ne confirme pas : assistance, preuve, contrôle et décision.
7. Dans le dossier, le client peut ajouter un reçu de paiement privé et consulter les preuves auxquelles il a droit. Il peut demander l’annulation tant que le dossier n’est ni annulé ni terminé. Après le séjour, les opérations le clôturent.

### 5.4 Visite et candidature longue durée [ACTUEL]

Fiche longue durée → **Demander une visite** → choisir un créneau → envoyer → **Dossiers → Visites**. Les opérations confirment ensuite le créneau demandé, puis consignent la réalisation ou une absence. Une demande peut aussi être annulée par les opérations. La visite physique et l’échange avec le propriétaire sont des actions humaines ; la présence d’un agent à cette visite n’est pas automatiquement assignée par le parcours actuel.

Depuis ce même panneau, je peux aussi rédiger une candidature → **Déposer une candidature** → **Dossiers → Candidatures**. Le message doit comporter au moins 10 caractères côté serveur. L’application actuelle ne m’oblige pas à avoir terminé une visite pour candidater et n’associe pas automatiquement la candidature à la visite depuis ce formulaire. Les opérations font ensuite progresser le dossier. Le bail est signé hors application ; sa preuve est déposée par le partenaire et validée par les opérations.

## 6. Compte partenaire : propriétaire, bailleur, hôte ou mandataire

### 6.1 Ma mission et mes limites

Je propose uniquement les logements que je suis réellement autorisé à commercialiser. Je fournis des informations, conditions, documents et médias exacts, je facilite la visite de contrôle, je tiens compte des réservations obtenues hors NZUBU et je traite les demandes concernant mes biens.

Sur le terrain, je rends le logement accessible à l’inspection et aux visites convenues, je présente les justificatifs pertinents, je fournis les moyens convenus pour le paiement direct, j’organise l’accueil et le départ, et je réalise les remboursements directs qui me sont dus. Un mandataire ou gestionnaire agit dans les limites de son mandat ou contrat : le système actuel ne vérifie pas automatiquement toutes ces limites juridiques.

Je ne peux pas approuver mes propres documents, publier ou attribuer moi-même le badge, modifier le rapport de l’agent ni consulter les biens d’un autre partenaire. La simple création d’un compte professionnel ne prouve pas mon identité ni mon droit de proposer chaque bien.

### 6.2 Parcours de dépôt et de vérification [ACTUEL]

| Départ / action | Arrivée et résultat |
|---|---|
| Tableau de bord → **Déposer un nouveau logement** | Fait défiler jusqu’à **Proposer un logement**. |
| Saisir titre, commune, durée, prix en CDF, description, caractère meublé, conditions et, selon le cas, charges et garantie → **Soumettre** | Crée un bien en attente de pièces ; message de résultat et actualisation. Cela ne le publie pas. |
| **Mes logements** → **Gérer le logement** → **Voir les pièces** | Accède à la section et charge les documents du logement sélectionné. |
| Choisir un type et un fichier → déposer | Envoie la pièce privée. Pièces nécessaires à l’étape suivante : identité, titre de propriété **ou** mandat, et autorisation de contenu média ; chacune doit être approuvée par les opérations. |
| **Vidéos des logements** → choisir MP4 | Envoie la vidéo pour traitement et revue ; le dépôt n’est disponible que dans certains états du dossier. Les opérations doivent contrôler droits, personnes identifiables, correspondance au bien et contenu sensible. |
| **Disponibilités** → dates et motif → **Bloquer ces dates** | Déclare une indisponibilité hors plateforme ; **Retirer** supprime le blocage. Les conflits sont contrôlés côté serveur. |
| Consulter le statut | Suit l’avancement : pièces → inspection → validation → publication, ou suspension. Il faut compléter/corriger avec l’équipe si le dossier ne peut pas avancer. |

[À CONCEVOIR] Prévoir un vrai parcours de retour pour pièce refusée, correction et nouvelle soumission, ainsi que modification du prix ou des caractéristiques après publication : les sections de suivi actuelles ne constituent pas un cycle d’édition complet.

### 6.3 Traiter les séjours [ACTUEL]

Tableau de bord → **Demandes & Séjours** : voir logement, dates, voyageurs, montant total et coordonnées de contact disponibles. Pour une demande **REQUESTED**, **Accepter · Bloquer 30 min** vérifie les conflits et ouvre le délai temporaire. Après déclaration par le client et avant expiration, **Confirmer la réception de l’avance** confirme la réservation si les conditions de disponibilité restent satisfaites. En cas de conflit ou d’expiration, afficher l’erreur et organiser une intervention humaine.

Le partenaire peut annuler un dossier non terminé. Si un séjour confirmé est annulé par l’hôte, le bien est suspendu, un ticket critique est créé et le relogement/remboursement doit être coordonné humainement. Un remboursement dû apparaît dans **Remboursements** : après l’avoir réellement effectué hors plateforme, **Déclarer le remboursement effectué** demande une référence. Il peut ajouter un reçu de remboursement dans **Preuves de séjour**. Une déclaration n’est pas une vérification bancaire.

**Mes logements** mène à la gestion des biens. **Facturation Commissions** affiche les commissions calculées après clôture et permet de télécharger un CSV de suivi interne ; ce n’est pas une facture fiscale validée. Les sections **Visites**, **Candidatures et baux**, **Preuves**, **Assistance** et **Notifications** permettent le suivi des objets concernés. Les changements de statut des visites et des candidatures sont opérés par les opérations, pas par le partenaire dans le flux actuel. Le partenaire dépose le bail signé dans **Preuves des baux**.

## 7. Compte agent terrain

### 7.1 Ma mission et mes limites

Je contrôle sur place les biens affectés à mes missions et je transmets des constats fidèles, avec preuves et réserves. Je ne dois jamais cocher un contrôle que je n’ai pas effectué, inventer une position ou masquer une anomalie. J’interviens en coordination avec les opérations et la personne qui peut donner accès au bien.

Je vois mes missions et les informations/documents accessibles pour ces missions. Je ne choisis pas librement tous les biens à inspecter, ne crée pas mon affectation, ne valide pas ma propre inspection, ne publie pas le bien, ne change pas le prix et ne gère ni réservations ni paiements. La capture GPS prouve qu’une position a été enregistrée par l’appareil ; elle ne prouve pas à elle seule l’ensemble des faits du rapport.

### 7.2 Parcours d’inspection [ACTUEL]

1. Connexion → espace **Contrôles terrain & archives** → onglet **Missions actives** → sélectionner une mission → fiche du bien et contact disponible. **Voir les pièces** charge les justificatifs autorisés ; l’agent peut les consulter selon le contrôle d’accès.
2. Dans l’environnement réel, prendre rendez-vous par les moyens convenus, se rendre au bien, identifier le proposant et examiner ses justificatifs. La planification complète et la gestion de rendez-vous ne sont pas une fonction dédiée aboutie dans cet espace.
3. Sur place → **Position GPS** → autoriser la géolocalisation ; l’appareil enregistre latitude, longitude et précision. Si l’autorisation est refusée ou le GPS indisponible, réessayer : le rapport ne peut pas être envoyé sans GPS.
4. Remplir les neuf contrôles : identité ; titre ou mandat ; présence physique ; eau ; électricité ; concordance des pièces ; prix et dépôt ; vidéo/vie privée ; issues et serrures. Ajouter jusqu’à trois photos dans l’interface et leurs légendes, puis les notes.
5. Choisir l’avis : **Favorable**, **Réserves visibles**, **Correctifs requis** ou **Alerte sécurité**. Pour un avis favorable, les neuf contrôles et au moins une photo sont obligatoires. Les autres avis ne rendent pas actuellement le bien publiable automatiquement : réserves/correctifs le laissent à inspecter ; une alerte sécurité le suspend et crée un ticket critique.
6. **Envoyer le rapport** → si réseau disponible, envoi des photos puis du rapport, affichage du résultat et mise à jour de la mission ; si hors ligne, mise en file sur l’appareil. Une fois soumis, le rapport n’est plus éditable par ce formulaire.
7. **Archives** → rechercher/filtrer les missions terminées ou soumises, consulter le rapport et utiliser l’export PDF disponible. L’agent peut aussi consulter ses notifications, contacter l’assistance et effacer les brouillons locaux de l’appareil.

**Hors connexion [ACTUEL] :** le brouillon et ses photos sont stockés localement ; un rapport déjà mis en file peut être retenté au retour du réseau ou après reconnexion et réouverture de la mission. Une recharge hors ligne peut nécessiter une connexion pour retrouver les dossiers. La synchronisation multiappareil, les conflits et le chiffrement local ne sont pas achevés. Il ne faut pas dessiner un accès hors ligne universel.

## 8. Administration et opérations

### 8.1 Ma mission et mes limites [ACTUEL]

Je coordonne les comptes, les dossiers, les agents, les contrôles, les annonces, les visites, les candidatures, les séjours et les incidents. Le tableau de bord présente des annonces à examiner, des missions, des alertes et des accès directs aux sections correspondantes. Dans le code actuel, ce compte rassemble des pouvoirs que l’organisation pourra ensuite répartir : création d’autres administrateurs, validation, publication, suspension et suivi des dossiers.

Je peux examiner les justificatifs et les preuves privées autorisées ; je dois respecter la confidentialité. Je ne devrais pas confondre une validation de dossier avec une expertise juridique, ni affirmer qu’un paiement a été vérifié par la banque. Les règles de double validation et la restriction par métier décrites dans le dossier produit ne sont pas généralisées dans cette implémentation.

### 8.2 Des pièces à l’annonce publique [ACTUEL]

| Étape et action | Effet / destination | Condition ou limite |
|---|---|---|
| **Comptes partenaires et agents** → e-mail, rôle → **Créer** | Crée/attribue le rôle ; le titulaire active son accès par inscription. | L’action peut aussi changer le rôle d’une adresse existante. |
| **Annonces et pièces** → **Voir les pièces** → ouvrir et **Approuver** | La pièce porte une validation. | Contrôle humain nécessaire. |
| **Valider le dossier** | Le logement passe de `PENDING_DOCUMENTS` à `PENDING_INSPECTION`. | Identité, titre ou mandat et consentement média approuvés. |
| Sélectionner agent → **Créer mission** | Mission `ASSIGNED` dans l’espace de l’agent choisi. | Agent de rôle adéquat et logement en attente d’inspection. |
| Agent transmet un rapport favorable | Mission `REPORT_SUBMITTED`, logement `PENDING_APPROVAL`. | GPS, neuf contrôles et photo requis pour l’avis favorable. |
| **Revue des vidéos** → visionner, cocher les quatre contrôles → **Approuver la vidéo** | Vidéo approuvée pour ce bien. | Si doublon candidat détecté, examen et note sont aussi requis. |
| **Valider et publier** / **Publier** | Logement `PUBLISHED`, mission approuvée ; vérification valable 90 jours dans l’implémentation actuelle. | Il faut un rapport favorable complet, les pièces requises approuvées et la vidéo approuvée. |
| **Suspendre** | Le bien devient `SUSPENDED` et ne figure plus dans les résultats publics. | Motif et procédure détaillée à renforcer dans le parcours cible. |
| **Réinspection** → motif | Bien remis en attente d’inspection. | Un signalement média ouvert bloque cette réouverture ; une nouvelle inspection est nécessaire avant publication. |
| **Changement de partenaire** → nouveau partenaire, motif | Retour à l’attente de documents ; ancien accès et validations remis en cause, vidéo retirée, nouvelle vérification nécessaire. | Refusé notamment s’il reste des réservations actives ou des candidatures non closes. |

Une vidéo signalée entraîne une suspension et une alerte critique. Résoudre le ticket ne signifie pas republier automatiquement : il faut traiter les pièces et la vidéo concernées, puis suivre la procédure de réinspection et de publication applicable.

### 8.3 Visites, baux, séjours et support [ACTUEL]

- **Visites** : une demande `REQUESTED` peut être confirmée au créneau proposé (`SCHEDULED`) ou annulée ; une visite planifiée peut être clôturée (`COMPLETED`) avec compte rendu ou marquée en absence (`NO_SHOW`) avec motif. L’API prévoit aussi l’annulation d’une visite planifiée ; le bouton correspondant n’est pas présenté de la même manière dans l’interface actuelle. L’état et le compte rendu deviennent visibles dans les dossiers concernés.
- **Candidatures et baux** : progression autorisée `SUBMITTED` → `UNDER_REVIEW` → `NEGOTIATING` → `LEASE_PREPARED` → `SIGNED_EXTERNALLY`, avec possibilité d’annulation aux étapes prévues. La clôture par signature exige une référence et un bail signé déposé puis approuvé. La signature elle-même se fait hors plateforme. L’API accepte un loyer convenu, mais l’interface actuelle ne propose pas nécessairement la saisie de tous les champs.
- **Séjours** : consulter les réservations et, après la date de départ d’un séjour confirmé, **Clôturer le séjour** → état terminé et création d’une commission de suivi égale actuellement à 10 % du prix. Cette valeur est une hypothèse à valider. L’administrateur peut annuler, mais n’accepte pas la demande ni ne confirme à la place de l’hôte dans le parcours serveur.
- **Tickets et alertes** : consulter les signalements, examiner le contexte et les preuves disponibles, coordonner les actions sur le terrain ; **Résoudre avec justification** exige un texte d’au moins 10 caractères et passe le ticket en `RESOLVED`. Cela ne déclenche pas à lui seul un remboursement ou un relogement.
- **Preuves des réservations / baux** : ouvrir les fichiers privés et valider les pièces à contrôler ; l’approbateur doit être différent de la personne ayant déposé la pièce. Client, partenaire concerné et opérations y accèdent selon les droits du dossier.
- **Commissions** : consulter le suivi et exporter le CSV. Le rapprochement bancaire indépendant, la gestion complète des impayés et l’émission de factures officielles restent à organiser.

## 9. Métiers internes à dessiner dans la cible, sans prétendre qu’ils sont déjà séparés

| Métier [PRÉVU ou À CONCEVOIR] | Travail concret | Accès cible recommandé et limites à valider |
|---|---|---|
| Chargé des opérations / dispatcher | Reçoit les dossiers, organise les rendez-vous, choisit l’agent, suit délais et anomalies. | Missions et dossier utiles ; pas de publication autonome si la séparation des tâches est retenue. |
| Responsable marché courte durée / meublé | Contrôle les dossiers, conditions et médias de son périmètre ; décide la publication ou le refus. | Offres de son marché ; aucune modification financière hors délégation. Meublé et courte durée ne sont pas strictement synonymes : décider le périmètre exact. |
| Responsable marché longue durée / non meublé | Suit qualité des offres, visites, candidatures et conditions locatives. | Offres de son périmètre ; ne pas supposer que toute longue durée est non meublée. |
| Service client | Reçoit demandes et réclamations, collecte les faits, informe les parties et escalade incidents. | Accès limité aux dossiers nécessaires ; ne décide pas seul d’un remboursement financier hors délégation. |
| Modération | Examine les vidéos, signalements et problèmes de confidentialité ; masque et escalade si nécessaire. | Accès au contenu nécessaire ; ne valide pas à lui seul les droits immobiliers ou une transaction. |
| Finance | Suit commissions, factures, rapprochement et impayés selon le modèle retenu. | Données financières nécessaires ; pas de modification des rapports de terrain. |
| Administrateur des accès | Crée, modifie et retire les habilitations selon procédure. | Droits d’administration contrôlés, approbation pour les rôles sensibles à définir. |
| Direction / responsable produit | Arbitre les règles, exceptions et indicateurs, décide du lancement. | Accès au pilotage ; accès nominatif et limité aux données utiles. |

[À DÉCIDER] Une même personne peut-elle cumuler plusieurs de ces casquettes ? Si oui, sous quelles conditions de contrôle ? Faut-il des profils distincts ou des permissions cumulables dans un même compte ? Ces décisions changent directement la cartographie et les accès.

## 10. États, branches et exceptions à faire apparaître dans l’Appflow

### 10.1 Annonce

`PENDING_DOCUMENTS` → pièces approuvées → `PENDING_INSPECTION` → rapport favorable → `PENDING_APPROVAL` → revue finale + vidéo approuvée → `PUBLISHED` → éventuellement `SUSPENDED`. Un rapport avec réserves ou correctifs ne passe pas en validation finale dans le code actuel ; une alerte sécurité suspend. Un bien publié dont la vérification est expirée disparaît des résultats publics même si son statut reste publié. `REJECTED` existe dans le modèle, mais ne supposez pas un parcours complet de refus/reprise disponible en interface.

### 10.2 Séjour courte durée

`REQUESTED` → acceptation de l’hôte et blocage temporaire → `HOST_ACCEPTED_TERMS` → déclaration client → `PAYMENT_DECLARED` → confirmation de l’hôte avant expiration → `CONFIRMED` → après départ et clôture par opérations → `COMPLETED`. Une annulation possible avant clôture conduit à `CANCELLED`. Une demande initiale n’est pas un blocage ; une demande concurrente peut exister mais l’acceptation et la confirmation contrôlent les conflits. Un blocage expiré cesse de protéger les dates, même si le libellé de statut enregistré n’est pas automatiquement transformé en un nouvel état « expiré ».

**Annulation et remboursement codés, à valider commercialement :** pour un séjour confirmé, le calcul porte sur l’avance ; si le client annule plus de 72 h avant l’arrivée, remboursement de 100 % de cette avance ; entre 24 h incluses et 72 h incluses, 50 % ; moins de 24 h, 0 %. Si l’annulation confirmée vient du partenaire ou des opérations, le code calcule 100 % de l’avance. Avant confirmation, le calcul actuel est de 0 même si un paiement a été déclaré : c’est un cas important à traiter manuellement et à redéfinir avant exploitation réelle. Le paiement et le remboursement restent directs et externes. Les heures limites et leur fuseau de référence doivent être confirmés avant d’en faire une politique client.

### 10.3 Visite et bail

Visite : `REQUESTED` → `SCHEDULED` → `COMPLETED` ou `NO_SHOW` ; annulation selon l’étape autorisée. Candidature : `SUBMITTED` → `UNDER_REVIEW` → `NEGOTIATING` → `LEASE_PREPARED` → `SIGNED_EXTERNALLY`, ou `CANCELLED` selon transition autorisée. Une visite n’est pas automatiquement un bail et le dépôt d’une candidature ne réserve pas automatiquement le logement.

### 10.4 Erreurs et états d’écran

Pour chaque étape, prévoir dans la carte : chargement, aucun résultat/dossier, succès, action désactivée ou droits insuffisants, données manquantes ou incorrectes, conflit de dates, vérification expirée, incident réseau, session expirée, délai de paiement écoulé, échec de téléversement, annulation du dialogue et retour au contexte précédent. Pour le terrain, distinguer brouillon local, rapport en attente de synchronisation, synchronisé et échec à reprendre. Ajouter une confirmation claire avant une action sensible, puis conserver la trace et le résultat.

## 11. Points décisifs à compléter avant une Appflow cible et un pilote réel

1. **Habilitations :** nommer le responsable de chaque décision, définir les droits par métier, périmètre et dossier ; préciser qui peut cumuler les rôles et les validations à deux personnes réellement obligatoires.
2. **Réservation et argent :** approuver l’avance, les délais, la tarification, les annulations, le cas « paiement réalisé mais non confirmé », les moyens de paiement, les preuves et le responsable des contrôles. Aucun paiement intégré ni rapprochement indépendant n’est démontré par ce code.
3. **Visites et exploitation réelle :** qui contacte qui, qui accompagne, qui remet les clés, que faire en cas d’absence, retard, bien indisponible, relogement ou urgence ? Définir les heures de service et les délais de traitement.
4. **Refus et corrections :** parcours de refus motivé d’une pièce, d’une vidéo, d’un bien, d’une candidature ou d’une demande ; correction, réexamen, notifications et recours. Ne pas assimiler automatiquement « annuler » à « refuser ».
5. **Cycle de vie des biens :** édition d’annonce, changement de prix, disponibilité, mandat expiré, doublons, retrait définitif, renouvellement du badge, nouvelle inspection, changement de partenaire et traitement des dossiers en cours.
6. **Support :** identité du responsable, priorités, escalade, échanges et pièces jointes, délais, réouverture, protection des personnes et suivi d’un remboursement jusqu’à réception effective. Le ticket simple actuel ne couvre pas tout cela.
7. **Comptes et données :** invitation et retrait des accès professionnels, utilisation d’un même individu comme client et partenaire, clôture et conservation, confidentialité des pièces, sécurité des appareils terrain et conflits hors ligne.
8. **Notifications et navigation :** matrice précise « événement → destinataire → canal → contenu → écran ouvert » ; le système actuel ne couvre pas nécessairement chaque événement et ne fournit pas automatiquement un lien direct vers chaque dossier.
9. **Cadre légal et mise en service :** valider localement contrats, droit de proposer, protection des données et moyens de paiement ; réaliser la recette, la sécurité, l’hébergement et la validation des procédures avant d’utiliser de vraies données ou de vrais paiements. Les documents du projet signalent ces points comme ouverts.

## 12. Consignes pratiques pour la personne qui dessine l’Appflow

- Dessiner **quatre couloirs de comptes** — client/visiteur, partenaire, agent, administration — et, pour la cible organisationnelle, subdiviser visuellement les responsabilités internes sans les présenter comme des comptes existants.
- Pour chaque nœud, préciser : acteur, écran ou panneau, données visibles, action, préconditions, effet serveur, état obtenu, prochaine destination, notification effective ou souhaitée, erreur et retour possible.
- Utiliser des branchements séparés courte durée / longue durée, et montrer les transmissions entre personnes, y compris les actions hors application : visite du bien, paiement direct, réception des clés, remboursement et signature du bail.
- Distinguer les écrans réellement présents des écrans proposés ; indiquer qu’un même clic peut simplement faire défiler vers une section ou ouvrir une fenêtre superposée.
- Cartographier les interactions croisées : dépôt partenaire → contrôle opérations → mission agent → publication → demande client → traitement partenaire/opérations → clôture et support.
- Produire deux vues : **existant mode API** et **parcours cible à valider**. Les pourcentages et délais codés sont des hypothèses de test, pas des décisions de direction.

## 13. Sources du projet examinées

- `README.md`, `READINESS.md` et `P0_RECETTE.md` : contexte, limites et scénarios de recette documentés.
- `public/assets/aistudio/NZUBU_Dossier_Conception_Produit_Fonctionnement_MVP_v1_9039cba8.md` : vision et rôles métier proposés.
- `src/PilotApp.tsx` et `src/components/client/LiveClientExperience.tsx`, `src/components/partner/LivePartnerDashboard.tsx`, `src/components/agent/LiveAgentWorkspace.tsx`, `src/components/admin/LiveAdminDashboard.tsx` : écrans et navigation du mode API.
- `src/components/CaseEvidence.tsx`, `src/offlineMission.ts` et `server/index.ts` : preuves, brouillons et règles d’accès et de transition côté serveur.

Cette analyse est fondée sur la lecture du projet, pas sur une recette exhaustive de tous les écrans ni sur l’observation de chaque activité réelle. Les décisions de gestion et les processus humains qui ne sont pas écrits dans le projet doivent être confirmés par NZUBU.

---

## 14. Complément de cartographie : contrôle des neuf points pour chaque acteur

Les tableaux suivants servent d’inventaire utilisable pour dessiner l’Appflow. Ils complètent les explications précédentes, qui restent nécessaires pour le contexte et les conditions détaillées. Chaque ligne indique l’écran ou la section, l’action, le résultat et le prochain responsable lorsque c’est applicable. Une flèche vers un autre acteur décrit **une passation de travail** : elle ne signifie pas forcément que cet acteur reçoit une notification automatique ni que son écran s’ouvre automatiquement.

Les écrans signalés ici correspondent au **mode API actuel**, sauf mention contraire. Les noms peuvent désigner des onglets, des panneaux ou des sections d’une même page. « Aucun changement » signifie qu’aucun changement d’état métier n’a été identifié pour cette action ; un message, un filtre local ou un affichage peut néanmoins changer.

### 14.1 Visiteur non connecté

**Rôle et responsabilité.** Je découvre les annonces et décide si je souhaite créer un compte. Je n’ai pas encore de dossiers personnels.

**Accès, permissions et limites.** J’accède aux annonces publiques éligibles et aux informations de découverte. Je peux ouvrir une fiche, une explication de vérification et le panneau d’une demande ; je dois devenir client connecté pour envoyer cette demande, enregistrer un favori ou signaler un média. Je ne vois pas les justificatifs privés, comptes professionnels, réservations d’autrui, missions ou outils d’administration.

| Écran ou section | Action → destination | État, validation et relais |
|---|---|---|
| Feed vidéo | Faire défiler, précédent/suivant, lecture/pause, filtre commune → reste dans le feed. | Aucun changement métier ; résultat vide ou vidéo indisponible possibles. |
| Feed / Explorer | **Fiche**, **Détails** → panneau du logement ; **Contrôles** → panneau de vérification ; **Réserver/Visiter** → panneau de demande. | Aucun dossier créé à l’ouverture ; retour par fermeture du panneau. |
| Feed | **Partager** → partage natif ou copie du lien. | Aucun changement métier ; partage ou copie indisponibles possibles. |
| Feed | **Aimer** → section de connexion. | Aucun favori enregistré avant connexion ; l’action n’est pas rejouée automatiquement. |
| Panneau de demande | **Se connecter pour continuer** → section de connexion. | L’envoi de la demande reste réservé au client connecté. |
| Connexion / Inscription | Envoyer formulaire, recevoir et vérifier le code → espace lié au rôle du compte. | Création publique = client ; code incorrect, expiré, limite de tentatives ou échec d’envoi possibles. |
| Mot de passe oublié | Demander le code et définir un nouveau mot de passe → retour à Connexion. | Code par e-mail ; aucune nouvelle réservation ou candidature. |

### 14.2 Client connecté

**Rôle et responsabilité.** Je recherche un logement, formule des demandes sincères, respecte les conditions que j’accepte, réalise le paiement convenu directement à l’hôte et conserve ses preuves. Sur place, je participe à la visite ou au séjour et je signale les incidents.

**Accès et interdictions.** Je dispose des écrans publics et de mes propres favoris, séjours, visites, candidatures, tickets, notifications et preuves de dossier autorisées. Je ne peux pas modifier ou publier une annonce, affecter un agent, approuver un badge, confirmer moi-même l’encaissement par l’hôte ni traiter les dossiers privés d’un autre client.

| Écran / accès | Action → destination ou retour | Changement, condition et acteur suivant |
|---|---|---|
| Feed / Explorer | Parcourir, filtrer, ouvrir **Fiche** ou **Contrôles**, partager → panneau ou vue correspondante. | Lecture seule ; si aucun résultat, revoir les filtres. |
| Feed | **Aimer** → reste sur le bien ; **Dossiers → Favoris** pour le retrouver. | Ajout ou retrait du favori ; le bien doit rester éligible. |
| Fiche → court séjour | **Demander à réserver** → panneau du calendrier et des conditions. | Charger les disponibilités ; choisir dates, voyageurs, accepter les conditions. |
| Panneau de réservation | **Envoyer ma demande** → **Dossiers → Séjours** immédiatement. | Création `REQUESTED` si le serveur accepte ; **relais partenaire** pour l’acceptation. Le panneau se ferme même si l’envoi échoue ensuite : vérifier le message. |
| Dossiers → Séjours | Après acceptation : **Déclarer mon paiement** → saisie référence → reste dans Séjours. | `HOST_ACCEPTED_TERMS` → `PAYMENT_DECLARED`, seulement avant expiration ; **relais partenaire** pour confirmer la réception. |
| Dossiers → Séjours | Ajouter un reçu privé → reste dans le dossier ; ouvrir une preuve existante → fichier autorisé. | Preuve ajoutée, sans confirmation bancaire ; les opérations peuvent l’examiner. |
| Dossiers → Séjours | **Annuler** → confirmation → reste dans Séjours. | `CANCELLED` si accepté ; remboursement éventuel et ticket selon les règles de la section 10 ; **relais partenaire/opérations** si suivi nécessaire. |
| Fiche → longue durée | Choisir créneau → **Demander une visite** → **Dossiers → Visites**. | `REQUESTED` si création acceptée ; **relais opérations** pour planifier et clôturer. L’ouverture du suivi précède la réponse du serveur. |
| Panneau longue durée | Rédiger message → **Déposer une candidature** → **Dossiers → Candidatures**. | `SUBMITTED` si accepté, message d’au moins 10 caractères ; **relais opérations**, partenaire associé au dossier. L’ouverture du suivi précède la réponse serveur. |
| Dossiers → Visites / Candidatures | Consulter état, créneau ou compte rendu ; ouvrir une preuve de bail accessible. | Lecture seule sur la progression ; dans l’interface actuelle, le client ne fait pas avancer le bail lui-même. |
| Dossiers → Favoris | Sélectionner un bien visible → panneau **Fiche**. | Aucun changement d’état ; un bien filtré ou indisponible peut ne pas être affiché normalement. |
| Fiche → **Signaler la vidéo** | Saisir un motif → reste dans l’expérience client. | Si accepté : annonce `SUSPENDED`, vidéo rejetée, ticket critique ; **relais opérations** pour examen. |
| Dossiers → Assistance | Saisir un message → **Envoyer un signalement**. | Ticket `OPEN` si accepté ; au moins 10 caractères côté serveur ; **relais opérations**. |
| Dossiers → Notifications | Ouvrir la rubrique. | Consultation de la liste ; elle ne confirme pas, à elle seule, la lecture d’un e-mail ou l’exécution d’une action. |
| Dossiers → Compte | **Fermer mon compte** → confirmation → retour public. | Compte fermé ; certaines données liées à un litige peuvent être conservées avec accès restreint. |

**Exceptions à relier à cet acteur.** Bien retiré ou expiré, calendrier non chargé, dates non valides ou devenues indisponibles, durée hors limites, conditions absentes, délai de paiement dépassé, paiement réel sans confirmation, annulation, remboursement contesté, visite non honorée, pièce refusée, problème de réseau et ticket non résolu. Pour une visite ou un bail, l’interface ne remplace pas les échanges et la signature réalisés hors plateforme.

### 14.3 Partenaire : propriétaire, bailleur, hôte ou représentant

**Rôle et responsabilité.** Je présente des biens que je peux réellement proposer, fournis les pièces et médias, facilite l’inspection et les visites, maintiens mes indisponibilités et traite les demandes de séjour. Je reçois directement le paiement convenu et exécute les remboursements directs qui me sont dus.

**Accès et interdictions.** Je vois mes biens et les dossiers associés, ainsi que les justificatifs qui me sont accessibles. Je peux déposer mes documents et gérer les demandes autorisées. Je ne peux pas approuver mes propres pièces, modifier le rapport terrain, publier un bien ou accéder librement aux biens d’un autre partenaire. L’interface de suivi des visites et candidatures ne me donne pas les boutons administratifs de changement d’état.

| Écran / accès | Action → destination ou retour | Changement, condition et acteur suivant |
|---|---|---|
| Tableau de bord → **Déposer un nouveau logement** | Aller à **Proposer un logement**, saisir puis **Soumettre**. | Création `PENDING_DOCUMENTS` si validation serveur réussie ; **relais partenaire** pour pièces puis opérations pour contrôle. |
| **Mes logements** → **Gérer le logement** / **Voir les pièces** | Ouvrir le dossier et déposer identité, titre ou mandat, consentement média. | Pièces privées en attente ; **relais opérations** pour approbation. Formats PDF/JPEG/PNG et limites de taille contrôlés. |
| **Vidéos** | Sélectionner un MP4 autorisé → reste dans la section. | Vidéo en revue ; **relais opérations** pour contrôle humain. Un fichier invalide ou un état interdisant l’envoi bloque l’opération. |
| **Disponibilités** | Saisir période et motif → **Bloquer ces dates** ; **Retirer** pour supprimer un blocage. | Indisponibilité externe créée ou retirée ; contrôle des dates et conflits côté serveur. |
| Tableau de bord → **Demandes & Séjours** | Demande nouvelle → **Accepter · Bloquer 30 min**. | `REQUESTED` → `HOST_ACCEPTED_TERMS` si dates toujours disponibles ; **relais client** pour payer et déclarer ; notification client. |
| Même écran | Après déclaration → **Confirmer la réception de l’avance**. | `PAYMENT_DECLARED` → `CONFIRMED` si délai et disponibilité valides ; **relais client**, puis opérations après le séjour ; notification client. |
| Même écran | **Annuler la réservation** → confirmation. | `CANCELLED` ; si séjour confirmé annulé par l’hôte, suspension et ticket critique ; **relais opérations/client** pour la suite. |
| **Remboursements** | Après remboursement réel externe → saisir référence et **Déclarer le remboursement effectué**. | `PENDING_PARTNER` → `CONFIRMED_BY_PARTNER` ; notification au client, qui doit vérifier la réception. |
| **Preuves de séjour** | Ajouter un reçu de remboursement ou ouvrir une preuve autorisée. | Preuve ajoutée ; **relais opérations** pour examen si nécessaire ; pas de rapprochement bancaire automatique. |
| **Visites** / **Candidatures et baux** | Consulter les dossiers associés à mes biens. | Lecture du suivi ; les opérations assurent les changements d’état. |
| **Preuves des baux** | Déposer un bail signé hors plateforme. | Preuve à revoir ; **relais opérations** pour approbation avant clôture du bail. |
| **Facturation Commissions** | Consulter et télécharger le CSV. | Suivi interne ; aucun paiement de commission ni facture fiscale officielle automatique ne doit être supposé. |
| **Assistance** / **Notifications** | Créer un ticket ou consulter les notifications. | Ticket `OPEN` si accepté ; **relais opérations** pour traitement. |

**Exceptions à relier à cet acteur.** Document manquant, fichier invalide, vidéo refusée ou signalée, mission à corriger, annonce suspendue, disponibilité contradictoire, demande concurrente, paiement tardif, remboursement dû ou contesté, conflit sur le mandat et changement de partenaire interdit à cause de dossiers actifs. Un véritable bouton de refus motivé ou un parcours complet de modification après publication restent à concevoir.

### 14.4 Agent terrain

**Rôle et responsabilité.** Je me rends sur place pour les missions affectées, rencontre le contact, vérifie les faits, collecte GPS et photos, décris fidèlement les écarts et transmets mon rapport. Je n’invente ni contrôle ni preuve.

**Accès et interdictions.** Je vois mes missions, les biens qui leur sont associés et les documents autorisés selon leur provenance ; je peux transmettre mes photos d’inspection. Je ne peux pas attribuer les missions, approuver mes constats, publier, modifier le prix ou confirmer les paiements. Les échanges par téléphone/e-mail proposés par l’interface ouvrent les applications de l’appareil, pas une messagerie NZUBU complète.

| Écran / accès | Action → destination ou retour | Changement, condition et acteur suivant |
|---|---|---|
| **Missions actives** | Sélectionner une mission → détail dans l’espace agent. | Aucun changement métier automatique démontré ; lire les coordonnées et le statut. |
| Détail mission | Appeler ou écrire au partenaire si ses coordonnées existent. | Lance le téléphone ou l’e-mail de l’appareil ; rendez-vous à organiser humainement. |
| Détail mission → pièces | **Consulter les pièces du logement** puis **Ouvrir**. | Lecture des pièces permises par le serveur ; accès refusé si non autorisé. |
| Détail mission → GPS | **Capturer position GPS** → accepter la permission de l’appareil. | Position ajoutée au brouillon ; GPS requis pour transmettre. Refus ou panne à gérer sur place. |
| Détail mission → grille | Cocher les neuf contrôles, ajouter jusqu’à trois photos, choisir un avis et rédiger les observations. | Brouillon local ; pour un avis favorable, tous les contrôles et une photo au minimum sont requis. |
| Détail mission | **Transmettre le rapport** ou **Conserver pour synchronisation**. | Après envoi : mission `REPORT_SUBMITTED` ; bien en attente de validation, en attente d’inspection ou suspendu selon avis ; **relais opérations**. Hors réseau : brouillon mis en file, sans prétendre que le serveur l’a reçu. |
| **Archives** | Rechercher, filtrer par commune, trier, sélectionner un rapport ; **Exporter le rapport PDF**. | Consultation/export ; aucun changement de décision métier. |
| **Assistance** / **Notifications** | Envoyer un signalement ou consulter les messages. | Ticket `OPEN` si accepté ; **relais opérations**. |
| Espace agent | **Effacer les brouillons de cet appareil** → confirmation. | Supprime les brouillons locaux du compte sur l’appareil ; ne revient pas sur un rapport déjà synchronisé. |

**Exceptions à relier à cet acteur.** Pas de mission, contact absent, accès refusé au bien, documents ou GPS indisponibles, contrôle impossible, risque de sécurité, brouillon hors ligne, stockage local indisponible, échec d’envoi ou rapport déjà transmis. Un avis avec réserves ne crée pas automatiquement une publication avec réserves ; les opérations doivent reprendre le dossier.

### 14.5 Administration / opérations

**Rôle et responsabilité.** Je crée les accès professionnels, qualifie les dossiers, contrôle les documents et vidéos, attribue les missions, décide la publication ou la suspension, suis les visites et baux, clôture les séjours et traite les incidents. Je coordonne aussi les interventions humaines qui ne sont pas automatisées.

**Accès et limites.** Le compte actuel a une portée large sur les données et fonctions d’administration. Je ne confirme pas à la place du partenaire qu’il a encaissé une avance ; je ne déclenche pas automatiquement un remboursement bancaire ni une signature de bail. Les restrictions fines par métier, territoire et validation croisée restent à construire ou à confirmer.

| Écran / accès | Action → destination ou retour | Changement, condition et acteur suivant |
|---|---|---|
| Tableau de bord → **Comptes** | Saisir e-mail, rôle → **Créer**. | Compte créé ou rôle attribué ; **relais titulaire** pour vérification et mot de passe. Pas d’invitation automatique garantie. |
| **Annonces et pièces** | **Voir les pièces** → ouvrir → **Approuver** ; puis **Valider le dossier**. | Pièces approuvées, puis bien `PENDING_INSPECTION` si les trois catégories requises sont validées ; **relais opérations** pour affectation. |
| Dossier logement | Choisir agent → **Créer mission**. | Mission `ASSIGNED` ; **relais agent** pour l’inspection ; pas de notification automatique d’affectation identifiée. |
| **Missions et dispatch** | Consulter missions et rapports ; revenir au dossier logement. | Consultation ; un rapport favorable met le bien en attente d’approbation. |
| **Revue des vidéos** | Visionner, renseigner contrôles et éventuelle revue du doublon → **Approuver la vidéo**. | Média `APPROVED` si préconditions satisfaites ; **relais opérations** pour publication. |
| Dossier logement / **Revue marché** | **Publier** / **Valider et publier**. | `PENDING_APPROVAL` → `PUBLISHED`, mission `APPROVED` ; visibilité publique si date valide ; publication refusée si préconditions absentes. |
| Dossier / alerte | **Suspendre** → confirmation. | Bien `SUSPENDED`, retiré des résultats publics ; **relais opérations et partenaire** pour résolution. |
| **Réinspection** | Saisir motif → **Démarrer une réinspection**. | `SUSPENDED` → `PENDING_INSPECTION` si autorisé ; nouvelle mission à créer, **relais agent**. |
| **Changement de partenaire** | Choisir nouveau partenaire, saisir motif → **Transférer et suspendre**. | Bien `PENDING_DOCUMENTS`, validations révoquées et vidéo retirée ; **relais nouveau partenaire**. Le transfert est bloqué si certains dossiers sont actifs. |
| **Visites** | Confirmer créneau, clôturer avec compte rendu, signaler absence ou annuler selon les boutons disponibles. | Transition de visite ; notification au client ; **relais client et partenaire** pour la visite réelle. |
| **Candidatures et baux** | Choisir prochain statut ; pour signature, saisir référence. | Transition autorisée uniquement ; bail signé et approuvé requis pour `SIGNED_EXTERNALLY`. **Relais partenaire** pour dépôt et parties pour signature externe. |
| **Preuves des réservations / baux** | Ouvrir puis **Valider** une preuve. | Preuve approuvée par une personne différente du déposant ; cela ne confirme pas un paiement bancaire. |
| **Séjours** | **Annuler** ou, après départ, **Clôturer le séjour**. | `CANCELLED` ou `COMPLETED` ; la clôture crée une commission de suivi ; **relais partenaire/client** selon le cas. |
| **Tickets et alertes** | Examiner, suspendre si nécessaire, saisir justification → **Résoudre**. | `OPEN` → `RESOLVED` ; pas de remboursement ou réactivation automatique ; **relais acteur chargé de l’action réelle**. |
| **Remboursements / Commissions** | Consulter les montants en attente, exporter CSV. | Suivi ; la déclaration d’un remboursement direct reste au partenaire. |
| **Notifications** | Consulter les messages du compte. | Lecture ; aucune promesse que chaque événement génère un message. |

**Exceptions à relier à cet acteur.** Pièces incomplètes, conflit d’intérêts, rapport défavorable, alerte sécurité, vidéo non approuvée ou doublon candidat, signalement média encore ouvert, transfert interdit, transition de bail invalide, preuve absente, séjour pas encore terminé, panne ou accès refusé. La gestion des refus motivés, corrections et décisions exceptionnelles doit être explicitement conçue.

## 15. Notifications, validations et transferts : matrice explicite

### 15.1 Notifications réellement mises en file [ACTUEL]

Le serveur crée les notifications métier ci-dessous pour le **client concerné**. Elles sont visibles dans sa rubrique **Dossiers → Notifications**. Un traitement tente également leur envoi par e-mail lorsque le service est configuré ; la mise en file ne prouve pas la délivrance. Aucun lien direct vers un dossier n’est garanti dans ces messages. Les codes de vérification et de réinitialisation sont des e-mails d’authentification distincts de cette liste.

| Événement déclencheur | Destinataire effectif | Information et suite | Condition / échec |
|---|---|---|---|
| Le partenaire accepte une demande de séjour | Client | Demande acceptée et délai de paiement direct de 30 minutes ; le client consulte ses séjours. | L’acceptation peut être refusée si les dates ne sont plus disponibles. |
| Le partenaire confirme la réception de l’avance | Client | Réservation confirmée ; le client consulte son séjour. | Déclaration et confirmation avant expiration et absence de conflit. |
| Client, partenaire ou opérations annule une réservation | Client | Réservation annulée et message de suivi par l’équipe ; remboursement/relogement ne sont pas réalisés par ce message. | Le calcul et l’existence d’un ticket varient selon l’état et l’auteur ; voir section 10. |
| Le partenaire déclare un remboursement effectué | Client | Remboursement déclaré ; le client doit vérifier sa réception. | Seulement pour un remboursement en attente avec référence acceptée. |
| Les opérations changent le statut d’une visite | Client | Nouveau statut de la visite ; consulter **Dossiers → Visites**. | Transition valide et, selon le cas, créneau ou compte rendu renseigné. |

**Absences à ne pas masquer dans l’Appflow actuel :** aucune mise en file de notification métier n’a été identifiée, dans ces routes, à la création d’un logement ou d’une mission, à l’envoi d’une demande, à la déclaration de paiement, à l’envoi d’un rapport, à la publication, à la création/résolution d’un ticket ou à un changement de statut de candidature. Les acteurs concernés peuvent voir les données dans leur espace après actualisation, mais une notification automatique ne doit pas être supposée. [À CONCEVOIR] Définir les destinataires, canaux, délais, liens vers dossiers, rappels et traitement d’échec pour chacun de ces événements.

### 15.2 Validations nécessaires et passage de relais [ACTUEL]

| Travail terminé / décision | Qui l’effectue | Résultat remis au prochain acteur | Validation ou limite avant la suite |
|---|---|---|---|
| Compte professionnel préparé | Administrateur | Titulaire du compte : activer son accès | E-mail vérifié et mot de passe défini ; le rôle n’est pas choisi par inscription publique. |
| Logement, justificatifs et média déposés | Partenaire | Opérations : dossier à examiner | Identité, titre ou mandat, consentement média et revue vidéo ; les documents ne sont pas automatiquement approuvés. |
| Documents validés et mission créée | Opérations | Agent affecté : mission à réaliser | Bien en attente d’inspection et compte agent valide. Aucun envoi automatique d’affectation n’est identifié. |
| Rapport envoyé | Agent | Opérations : constater le résultat et poursuivre ou traiter l’alerte | Pour avis favorable : GPS, neuf contrôles et au moins une photo. Une alerte crée un ticket critique. |
| Revue finale et publication | Opérations | Visiteur/client : annonce éligible à la découverte | Pièces approuvées, rapport favorable complet, vidéo approuvée ; vérification non expirée. |
| Demande de séjour | Client | Partenaire : examiner et décider | Demande créée sous `REQUESTED` ; elle ne bloque pas encore les dates. |
| Demande acceptée | Partenaire | Client : paiement direct et déclaration | Le serveur bloque temporairement les dates après contrôle de conflit. |
| Paiement déclaré | Client | Partenaire : vérifier réellement puis confirmer | Déclaration avec référence pendant le délai ; elle n’est pas un encaissement vérifié indépendamment. |
| Paiement reçu et confirmé | Partenaire | Client : séjour confirmé ; opérations : clôture après départ | Confirmation avant expiration ; aucune remise de clés automatique. |
| Séjour réalisé | Opérations | Partenaire / suivi finance interne : commission calculée | Date de départ atteinte, réservation confirmée ; l’outil ne vérifie pas automatiquement le déroulement physique du séjour. |
| Visite demandée | Client | Opérations : organiser ; partenaire et client : réaliser la visite | Confirmation d’un créneau, puis compte rendu ou constat d’absence. |
| Candidature déposée | Client | Opérations et partenaire : étudier et négocier | La candidature n’est pas une signature ni une réservation du bien. |
| Bail signé hors plateforme | Partenaire dépose la preuve | Opérations : contrôler la preuve et enregistrer la signature | Référence de signature et preuve approuvée requises avant `SIGNED_EXTERNALLY`. |
| Ticket ou alerte | Client, partenaire, agent ou système selon le cas | Opérations : examiner, décider, coordonner | Résolution justifiée ; la clôture du ticket n’exécute pas à elle seule une action financière ou une remise en ligne. |
| Remboursement dû | Opérations coordonnent ; partenaire rembourse directement | Client : vérifier la réception | Le partenaire saisit sa référence ; aucune vérification bancaire indépendante automatique. |

### 15.3 Notifications et validations à définir pour la cible [À CONCEVOIR]

Pour chaque transfert ci-dessus, décider si le destinataire doit recevoir une alerte dans l’application, un e-mail, un autre canal ou plusieurs ; définir le délai, le contenu, la langue, le lien vers le bon dossier et la conduite à tenir si le message échoue. Priorités recommandées à étudier : nouvelle mission, demande de séjour, paiement déclaré, rapport à examiner, pièce à corriger, visite modifiée, incident critique et remboursement en attente.

Définir aussi qui valide les exceptions, qui peut remplacer une personne absente, quelles décisions nécessitent deux personnes et à quel moment l’auteur est informé du résultat. Ce sont des propositions pour la carte cible, pas des notifications ou permissions supplémentaires déjà prouvées.

## 16. Fiches de parcours pour les métiers internes envisagés [PRÉVU / À CONCEVOIR]

Ces métiers ne correspondent pas à des comptes techniques distincts dans le mode API étudié. Les écrans ci-dessous sont donc des **écrans cibles proposés** ; les états « à concevoir » ne doivent pas être confondus avec des états déjà enregistrés. Les questions de permissions et d’organisation doivent être validées par NZUBU avant réalisation.

| Acteur, rôle et responsabilité | Écrans et actions cibles proposés | Droits, limites, validations, relais et exceptions à définir |
|---|---|---|
| **Chargé des opérations / dispatcher** : qualifier les demandes, planifier et suivre les missions. | File de dossiers → vérifier pièces reçues ; planning → choisir agent et créneau ; fiche mission → suivre l’avancement ou replanifier. | Accès aux dossiers et agents de son périmètre ; pas de modification silencieuse d’un rapport transmis. Mission affectée → agent ; mission impossible ou agent absent → réaffectation et information au partenaire. Notification d’affectation et approbation éventuelle à concevoir. |
| **Responsable marché courte durée** : vérifier qualité, prix et conditions de son marché, arbitrer la publication. | File de revue → consulter dossier, médias et rapport ; approuver, demander correction ou refuser avec motif. | Limiter au marché attribué ; ne pas modifier un paiement sans délégation. Approbation → publication ; correction → partenaire/opérations. Définir cas de conflit d’intérêts, escalade et notification du résultat. |
| **Responsable marché longue durée** : contrôler les offres et suivre les dossiers locatifs de son périmètre. | File longue durée → examiner annonce ; dossier de candidature → contrôler négociation et préparation du bail. | Accès aux seuls dossiers utiles ; ne pas signer à la place des parties. Dossier complet → parties pour signature puis contrôle de preuve. Définir refus, modification de loyer, désaccord et notification. |
| **Service client** : écouter, qualifier, informer et coordonner le traitement. | File de tickets → consulter dossier et preuves nécessaires ; demander des informations, transmettre à un spécialiste, documenter la réponse puis clôturer. | Ne pas approuver seul un remboursement hors délégation. Ticket ouvert → enquête → escalade → réponse → clôture : états supplémentaires à concevoir. Définir urgence, absence de réponse, réouverture et notifications. |
| **Modérateur média** : contrôler droits, contenu, confidentialité et signalements. | File de revue → visionner et documenter la décision ; file de signalements → masquer, demander correction ou escalader. | Ne valide pas à lui seul le droit immobilier ni une transaction. Média suspect → opérations/partenaire ; confidentialité critique → suspension et suivi. Définir refus motivé et notifications. |
| **Finance** : suivre les commissions et rapprocher les paiements de NZUBU selon les procédures approuvées. | Tableau commissions → examiner montant et statut ; rapprochement → rapprocher des relevés ; facturation → produire ou corriger selon validation. | Accès limité aux données financières ; ne modifie pas les inspections. Écart → opérations/direction ; correction ou remboursement sensible → approbateur à définir. Rapprochement et facture officielle ne sont pas livrés par le CSV actuel. |
| **Administrateur des accès** : attribuer, revoir et retirer les habilitations. | Annuaire → créer/inviter ; fiche compte → modifier rôle, suspendre ou révoquer les sessions ; journal → examiner les changements. | Accès nominatif ; changement privilégié et validation croisée à définir. Départ collaborateur → responsable pour réaffectation ; compte compromis → suspension et récupération sécurisée. Ces écrans complets ne sont pas tous livrés. |
| **Direction / responsable produit** : fixer les règles, arbitrer exceptions et décider le lancement. | Tableau de pilotage → suivre indicateurs ; registre de décisions → approuver ou refuser une proposition ; exceptions → arbitrer. | Accès aux données nécessaires, sans accès automatique aux secrets. Décision → équipe concernée ; désaccord ou risque non résolu → escalade et décision documentée. Écrans, alertes et signatures à concevoir. |

Pour ces métiers, chaque futur écran doit recevoir les mêmes neuf informations que les comptes actuels : rôle, droits, interdictions, écran, actions, états, validations/notifications, passage de relais et erreurs. Le tableau fournit une base de discussion ; les écrans et états précis doivent être décidés avec les personnes qui exerceront réellement ces fonctions.

## 17. Contrôle de couverture des neuf demandes

| Point demandé | Où le trouver |
|---|---|
| 1. Rôle et responsabilités | Sections 3 à 9, puis fiches acteur 14 et métiers cibles 16. |
| 2. Droits d’accès et permissions | Tableau des comptes, limites de chaque fiche en section 14 et tableau cible 16. |
| 3. Limites et opérations interdites | Explications par compte et champs « accès et interdictions » de la section 14 ; restrictions à valider en section 16. |
| 4. Écrans accessibles | Tableaux par acteur de la section 14 ; écrans proposés, explicitement distincts, en section 16. |
| 5. Actions sur chaque écran | Tableaux « écran / action » de la section 14 et parcours détaillés des sections 5 à 8. |
| 6. Changements d’état | Tableaux par acteur, cycles de la section 10 et matrice de passation 15.2. |
| 7. Notifications et validations | Conditions dans les parcours, notifications effectives en 15.1, validations en 15.2, besoins à concevoir en 15.3. |
| 8. Transferts entre acteurs | Colonnes « acteur suivant » en section 14 et matrice complète 15.2 ; processus cibles en 16. |
| 9. Exceptions et scénarios particuliers | Fin de chaque fiche acteur, sections 10 et 11, et exceptions proposées en section 16. |

**Limite de précision :** ce document couvre les parcours et fonctions identifiés dans le code examiné, mais ne prétend pas inventorier chaque effet visuel de chaque contrôle ni remplacer une recette manuelle complète. L’Appflow cible et les règles opérationnelles non écrites doivent être validés par les responsables de NZUBU.
