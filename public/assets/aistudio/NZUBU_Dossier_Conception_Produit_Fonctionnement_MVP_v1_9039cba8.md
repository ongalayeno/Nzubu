# NZUBU — Dossier de conception du produit et de fonctionnement du MVP

**Version :** 1.0 — dossier de travail destiné au GO de conception et au lancement du développement  
**Date de référence :** 4 novembre 2026  
**Marché pilote :** Kinshasa, République démocratique du Congo  
**Plateformes :** Android pour les clients ; application Web responsive/PWA pour les opérations, agents et partenaires ; iOS après le pilote  
**Statut :** proposition de l'agence — décisions produit recommandées, contraintes juridiques identifiées et points de validation explicitement signalés.

> **Attention au nom du produit.** Le présent brief emploie « NZUBU », comme le document juridique initial. Les livrables antérieurs et une partie des échanges ont employé « PIOL ». Le dossier utilise donc NZUBU comme nom de travail, mais le nom commercial, la dénomination sociale, le domaine et les identifiants des applications doivent être harmonisés avant publication. Le nom ne doit pas être codé en dur dans l'application.

---

## 0. Comment lire ce dossier

Ce document vise à répondre à la question de l'équipe de développement : **pour chaque situation du MVP, qui peut faire quoi, avec quelles informations, selon quelles règles, et comment vérifier que le résultat est correct ?**

Trois statuts sont employés :

- **DÉCISION DE CONCEPTION PROPOSÉE** : choix recommandé par l'agence pour rendre le produit cohérent et réalisable. Il devient la règle de travail du MVP, sous réserve de validation du propriétaire du produit.
- **VALIDATION FONDATEUR / DIRECTION** : choix commercial, territorial, financier ou organisationnel que l'agence ne peut pas engager à la place de l'entreprise.
- **BLOCAGE JURIDIQUE / RÉGLEMENTAIRE** : fonctionnalité qui peut être conçue et testée avec des données fictives, mais ne doit pas traiter de vraies données ou de vrais paiements avant validation et formalités applicables.

Les faits juridiques et réglementaires sont distingués des recommandations métier. Les hypothèses de marché ne sont pas présentées comme des statistiques : elles doivent être testées auprès de clients, bailleurs, hôtes et agents à Kinshasa.

### Résultat attendu du dossier

À l'issue de sa validation, l'équipe doit pouvoir produire sans inventer les règles métier :

1. l'architecture fonctionnelle et technique du MVP ;
2. le modèle de données et les transitions d'état ;
3. les maquettes et états d'interface ;
4. les API et les contrats d'intégration ;
5. le backlog de développement ;
6. les tests d'acceptation ;
7. les procédures d'exploitation et de support ;
8. les éléments de conformité nécessaires au pilote.

---

# PARTIE I — DÉFINITION DU PRODUIT ET DÉCISIONS FONDATRICES

## 1. Mission exacte de NZUBU

### 1.1 Mission

**NZUBU est une plateforme immobilière opérée qui aide les personnes à découvrir des logements par la vidéo, à demander une visite ou une réservation, et à accéder à une offre dont l'existence, les caractéristiques visibles et le droit de commercialisation ont fait l'objet de contrôles documentés.**

La promesse centrale n'est pas « toutes les annonces sont garanties sans risque ». Elle est : **« les informations essentielles affichées ont été contrôlées selon une procédure définie, à une date connue, et les limites de ce contrôle sont visibles ».**

NZUBU combine quatre services :

1. **Découverte immobilière** : feed vidéo vertical, recherche géographique et fiches de biens.
2. **Contrôle de l'offre** : vérification du proposant, du droit de présenter le bien, de l'existence physique et des informations publiées.
3. **Coordination** : organisation de visites, demandes de réservation et suivi des dossiers.
4. **Intermédiation** : accompagnement des parties jusqu'à la réservation de courte durée ou, pour le bail résidentiel, jusqu'à la conclusion et au suivi administratif convenu.

### 1.2 Publics prioritaires

| Public | Besoin principal | Réponse NZUBU au MVP | Priorité |
|---|---|---|---|
| Habitants de Kinshasa cherchant une location | Réduire les déplacements inutiles, les annonces inexactes, les intermédiaires opaques et l'incertitude sur le prix ou l'état du bien | Feed, filtres, fiche contrôlée, demande de visite, suivi du dossier | **P0** |
| Personnes recherchant un meublé de courte durée à Kinshasa | Voir le logement réel, connaître les conditions, vérifier les dates et obtenir une confirmation traçable | Vidéo, calendrier déclaré, demande de réservation, confirmation par l'hôte et assistance | **P0** |
| Professionnels, visiteurs et diaspora préparant un séjour | Organiser un séjour avant leur arrivée, sans supposer que la vidéo remplace la vérification | Fiche détaillée, contact encadré, réservation sur confirmation, règles de séjour explicites | **P0**, sans parcours diaspora spécifique |
| Bailleurs, propriétaires et mandataires | Trouver des candidats, exposer leur bien avec un contenu crédible et réduire les visites improductives | Dépôt de dossier, vérification, vidéo, demandes et suivi | **P0** |
| Hôtes et gestionnaires de meublés | Recevoir des demandes de séjour et tenir les disponibilités à jour | Espace partenaire, calendrier, conditions, confirmation et historique | **P0** |
| Entreprises et organisations | Trouver des logements pour collaborateurs ou missions | Demande assistée par le service client au pilote | P1 — pas de portail entreprise dédié |
| Étudiants et nouveaux arrivants | Trouver une offre accessible et comparer les conditions | Parcours standard, sans scoring social ou collecte excessive de justificatifs | P0 comme utilisateurs, règles spécifiques ultérieures |

**Principe de conception :** la plateforme n'exige pas de l'utilisateur qu'il sache distinguer seul un propriétaire, un mandataire, un agent ou un gestionnaire. NZUBU doit afficher le statut du partenaire et expliquer sur quelle base il est autorisé à proposer le bien.

### 1.3 Rôle commercial et limites de responsabilité

**Décision de conception proposée : NZUBU agit comme opérateur de plateforme et intermédiaire immobilier actif, mais n'est pas gestionnaire locatif du bien au MVP.**

- Pour le bail résidentiel de longue durée, NZUBU met en rapport bailleur et preneur, organise les visites et accompagne le dossier jusqu'à la signature et aux formalités administratives convenues. Cette activité doit être exercée sous le régime d'agrément applicable aux intermédiaires immobiliers.
- Pour le séjour meublé de courte durée, NZUBU facilite la découverte, la demande, la confirmation et le suivi de réservation. L'hôte reste responsable de la mise à disposition, de l'accueil, de l'état du logement et des prestations annoncées.
- NZUBU n'est **pas** propriétaire du logement, assureur, expert en structure du bâtiment, service de police foncière, garant absolu de titre, ni gestionnaire des loyers après l'entrée du locataire.
- NZUBU ne signe pas le bail résidentiel comme troisième partie par défaut. Le bail lie le bailleur et le preneur ; NZUBU intervient en qualité d'agence/intermédiaire en présence des parties et sur la base de son mandat et de l'agrément requis.
- Aucun agent de terrain ou agent de service client ne peut encaisser des loyers, cautions ou avances pour le compte d'un partenaire.

**Blocage juridique :** l'arrêté ministériel n° CAB/MIN.UH/015/2017 prévoit qu'on ne peut agir en qualité d'intermédiaire immobilier sans agrément du ministère compétent. Le modèle d'exploitation de NZUBU doit être soumis à un conseil local et au service de l'Habitat afin de déterminer les agréments de la société et les conditions applicables à ses collaborateurs avant toute intermédiation effective [S2].

### 1.4 Engagements envers les clients

NZUBU s'engage au MVP à :

- publier uniquement des annonces ayant passé les validations obligatoires ;
- afficher la date de la dernière visite et le périmètre des contrôles réellement effectués ;
- distinguer les faits observés des déclarations du partenaire ;
- afficher le prix et les charges séparément, en CDF par défaut ;
- recueillir l'accord du partenaire sur les conditions avant de présenter une demande comme confirmée ;
- conserver les preuves d'acceptation, de paiement déclaré, de visite et de réservation ;
- traiter les signalements et documenter les décisions ;
- retirer ou suspendre une annonce lorsque sa fiabilité n'est plus suffisante.

NZUBU ne promet pas :

- que le titre foncier est authentique ou exempt de litige, sauf vérification officielle distincte documentée ;
- que la structure du bâtiment est techniquement sûre ;
- que l'eau, l'électricité ou Internet seront disponibles en permanence ;
- que le logement restera disponible sans confirmation récente du partenaire ;
- qu'un remboursement est automatique lorsque le paiement a été réalisé directement auprès du partenaire ;
- que la vidéo remplace une visite physique.

### 1.5 Définition officielle du badge « Vérifié par NZUBU »

Le badge ne peut être affiché que si les contrôles suivants sont terminés et approuvés :

1. identité du proposant contrôlée ;
2. justificatif du droit de proposer le logement examiné ;
3. logement/localisation visités par un agent identifié ;
4. principales caractéristiques comparées à la fiche ;
5. médias produits ou contrôlés par NZUBU et autorisation d'usage enregistrée ;
6. prix, charges et conditions renseignés ;
7. rapport terrain approuvé par le responsable de marché ou son délégataire.

Le badge doit ouvrir une explication :

- **Vérifié le :** date de la dernière inspection ;
- **Vérifié par :** identifiant professionnel de l'agent ou équipe NZUBU ;
- **Contrôles réalisés :** identité/droit de proposer, visite physique, caractéristiques visibles, médias, prix/conditions ;
- **Non certifié :** authenticité définitive du titre, absence de litige foncier, solidité structurelle, disponibilité permanente et qualité future du séjour.

Un badge est retiré automatiquement à l'expiration de sa validité ou lorsqu'un événement impose une nouvelle inspection.

### 1.6 Périmètre géographique du pilote

**Décision de conception proposée :** lancer le pilote dans trois communes — **Gombe, Lingwala et Ngaliema** — afin de concentrer les missions, maîtriser les temps de déplacement et établir une qualité de service avant extension.

- Le référentiel géographique doit dès le départ supporter toute la ville-province de Kinshasa : commune, quartier, avenue, numéro/parcelle si connu, repère local et coordonnées.
- Les annonces hors zone pilote peuvent être enregistrées en liste d'attente, mais ne reçoivent pas le badge « vérifié » et ne peuvent pas être réservées tant que la zone n'est pas couverte par une équipe opérationnelle.
- Le choix des trois communes est une décision de capacité opérationnelle, **pas une conclusion d'étude de marché**. La direction doit confirmer les communes en fonction des agents réellement disponibles et du portefeuille de biens initial.
- Une adresse ne doit pas dépendre uniquement d'un code postal ou d'un numéro de rue. Le dossier doit enregistrer un repère descriptif compréhensible localement et une position GPS interne. La position publique reste approximative jusqu'à la confirmation d'une visite/réservation.

### 1.7 Indicateurs de succès du pilote

Les indicateurs suivants sont ceux que le logiciel doit pouvoir mesurer. Les seuils sont des **objectifs proposés**, à confirmer après le premier mois de collecte réelle.

| Indicateur | Définition | Cible pilote proposée |
|---|---|---:|
| Complétude des annonces | Annonces publiées avec tous les champs P0, médias et conditions | 100 % |
| Preuve de vérification | Annonces publiques avec un rapport approuvé et une date valide | 100 % |
| Droit de commercialisation | Annonces avec justificatif accepté ou exception juridique documentée | 100 % |
| Exactitude de disponibilité | Demandes acceptées après confirmation explicite du partenaire | 100 % |
| Double réservation | Deux réservations confirmées sur une même unité et une période incompatible | 0 |
| Délai de traitement du dossier complet | De la soumission complète à la décision de validation | Médiane ≤ 3 jours ouvrables, objectif initial |
| Délai de réponse client | Première réponse humaine aux demandes d'assistance | ≤ 1 jour ouvrable |
| Fiabilité du pipeline vidéo | Vidéos valides après traitement, sans doublon ni corruption | ≥ 98 % |
| Conversion | Vues qualifiées → fiche → visite/demande → visite réalisée → location/séjour | Mesurée, puis seuil défini après 30 jours |
| Satisfaction | Note après visite ou séjour et taux de réclamation fondée | Mesurée par cohorte |

---

## 2. Décision sur le périmètre du MVP

### 2.1 Décision structurante : les deux durées sont incluses, mais avec des parcours différents

**Décision de conception proposée :** le MVP couvre les logements meublés et non-meublés, ainsi que les demandes de courte et de longue durée. Il ne doit toutefois pas traiter la courte durée comme une simple variante de la location longue durée.

| Axe | Courte durée / séjour | Longue durée / bail résidentiel |
|---|---|---|
| Objet | Séjour temporaire, date d'arrivée et départ | Jouissance locative d'un logement sur période longue |
| Parcours MVP | Demande de réservation avec confirmation manuelle de l'hôte | Demande d'information, visite, candidature simple, négociation encadrée et dossier de bail |
| Disponibilité | Calendrier par nuit/jour | Statut disponible / en négociation / loué |
| Paiement du prix du logement | Direct entre client et hôte au MVP ; NZUBU ne détient pas les fonds | Direct entre preneur et bailleur ; NZUBU ne collecte pas le loyer ni la garantie |
| Contrat | Conditions de séjour affichées et acceptées ; forme juridique à valider selon l'activité d'hébergement | Contrat de bail résidentiel conforme aux textes applicables, entre bailleur et preneur |
| Commission proposée | 10 % du prix d'hébergement effectivement réalisé, facturés à l'hôte | Honoraires d'agence correspondant à un mois de loyer selon l'article 10 de la Loi 15/025 et l'identité du demandeur du service |
| Gestion après mise à disposition | Assistance de réservation et réclamation liée au séjour ; pas de conciergerie complète | Suivi jusqu'à la remise des clés et à la preuve de formalités ; pas de gestion des loyers, renouvellements ou départs au MVP |

**Conséquence technique :** le champ `furnished` (meublé/non-meublé) est indépendant du champ `rental_mode` (short_stay/long_term). Il est interdit de déduire automatiquement « meublé = courte durée » ou « non-meublé = longue durée ».

### 2.2 Fonctionnalités incluses au MVP (P0)

**Application Android client**

- consultation du feed et des fiches publiques sans compte ;
- recherche par commune/quartier, type de bien, meublé/non-meublé, durée, budget et disponibilité ;
- fiche détaillée : médias, caractéristiques, équipements, prix, charges, localisation approximative, conditions et badge de vérification ;
- favoris liés au compte ;
- inscription/connexion après validation des formalités applicables au traitement des numéros de téléphone ;
- demande de visite pour longue durée ;
- demande de réservation de courte durée avec dates et nombre d'occupants ;
- suivi des demandes, confirmations, annulations et notifications ;
- signalement d'une annonce ou d'un problème.

**Back-office Web unique à menus et permissions**

- réception et qualification des dossiers partenaires/logements ;
- gestion des partenaires et justificatifs ;
- création et affectation des missions terrain ;
- checklist d'inspection et dépôt des preuves ;
- validation du responsable de marché ;
- traitement média et publication ;
- gestion des disponibilités ;
- demandes de visite et réservations ;
- pipeline des dossiers de location longue durée ;
- tickets du service client ;
- factures de commission et journal des paiements externes déclarés ;
- rôles, permissions et journal d'audit.

**Espace partenaire Web/PWA**

- soumission d'un logement ;
- dépôt de justificatifs ;
- consultation de l'état de vérification ;
- saisie des prix et conditions ;
- mise à jour des disponibilités ;
- réponse aux demandes ;
- déclaration des encaissements directs reçus et confirmation de réservation ;
- consultation des factures et commissions dues à NZUBU.

**Outil agent terrain Web/PWA**

- consultation des missions assignées ;
- confirmation de prise en charge ;
- navigation vers le repère et la position GPS ;
- checklist, photos, notes et preuves ;
- capture/chargement de vidéo ;
- brouillon hors connexion et reprise de synchronisation ;
- rapport de mission et transmission au responsable de marché.

### 2.3 Prévu après le pilote (P1/P2)

- app iOS publiée ;
- réservation instantanée ;
- paiement intégré du prix du séjour ;
- reversement automatisé vers les partenaires ;
- wallet, compte séquestre ou conservation de fonds ;
- signature électronique des baux ;
- collecte automatisée de loyers, rappels de loyers et gestion de quittances récurrentes ;
- gestion immobilière complète, maintenance et conciergerie ;
- synchronisation externe de calendriers ;
- chat temps réel entre tous les utilisateurs ;
- recommandations par intelligence artificielle ;
- classement personnalisé avancé ;
- application native dédiée aux agents terrain ;
- portail entreprises et contrats-cadres ;
- intégration aux registres fonciers ou services publics, si une interface officielle existe.

### 2.4 Exclu du MVP

- garantie par NZUBU de la propriété juridique ou de l'absence de litige foncier ;
- expertise de stabilité structurelle ou certification technique du bâtiment ;
- encaissement de loyers, cautions et dépôts sur le compte de NZUBU ;
- paiement ou remboursement manuel par un agent de terrain ;
- portefeuille électronique interne ;
- mécanisme d'entiercement/escrow sans qualification et autorisation réglementaires ;
- négociation automatique du loyer ;
- location commerciale/professionnelle ;
- ventes immobilières ;
- gestion des copropriétés et syndic ;
- gestion de maintenance des logements après la transaction.

### 2.5 Contraintes de budget et de calendrier

Aucun budget plafond, calendrier contractuel, nombre de développeurs effectivement disponibles, ni portefeuille initial de biens n'a été fourni dans le brief. L'agence ne peut donc pas certifier un budget total ni promettre une date de production sans inventer des coûts.

**Hypothèse de planification :** un pilote contrôlé peut être planifié sur environ 16 à 20 semaines à compter de la validation des décisions fondatrices, avec une équipe de 7 à 10 personnes équivalent temps plein et des spécialistes juridiques, sécurité et médias ponctuels. Cette fourchette est une estimation de planification, non un devis. Les formalités liées aux données personnelles, à l'agrément immobilier, au tourisme et aux prestataires de paiement peuvent décaler le lancement réel.

---

## 3. Modèle de rémunération et circuits financiers du MVP

Cette section est une décision structurante. Les règles financières doivent être implémentées sous forme de paramètres datés et de contrats partenaires, jamais comme des montants codés en dur.

### 3.1 Modèle de revenus recommandé

| Source | Qui paie ? | Quand ? | Calcul proposé | Statut |
|---|---|---|---|---|
| Honoraires d'agence — longue durée | Partie qui a sollicité les services de l'agence ; si les deux parties ont simultanément sollicité la même agence, partage par moitié | À la conclusion du bail | Un mois de loyer, selon l'article 10 de la Loi n°15/025 | Règle de loi à appliquer sous réserve de conseil local et d'agrément |
| Commission — courte durée | Hôte/partenaire | Après séjour réalisé, facture périodique | **10 % provisoires** du prix d'hébergement hors caution remboursable | Proposition commerciale à valider et contractualiser |
| Frais de visite | Aucun au pilote | — | Gratuit au pilote | Décision de lancement proposée |
| Frais de publication | Aucun au pilote | — | Gratuit au pilote | Décision de lancement proposée |
| Frais de service client | Aucun frais caché | — | Inclus dans le service | Décision proposée |

**Pourquoi ce choix ?**

- Il évite d'imposer au client une succession de frais avant qu'il ait pu voir le logement.
- Il distingue la rémunération immobilière longue durée prévue par la loi de la commission commerciale courte durée.
- Il évite de faire transiter les loyers et cautions par NZUBU au MVP.
- Il simplifie la comptabilité et limite le risque de confusion entre paiement du logement et revenu de la plateforme.

**Exemple long terme :** loyer mensuel convenu = 1 000 000 CDF. Les honoraires d'agence sont calculés à 1 000 000 CDF. Si seul le preneur a demandé les services de l'agence, le preneur est le payeur ; si les deux parties ont simultanément saisi la même agence, 500 000 CDF chacun. Le dossier conserve la preuve de la demande de service. Cette règle reflète l'article 10 de la Loi 15/025 [S1].

**Exemple courte durée :** prix d'hébergement confirmé et réalisé = 300 000 CDF. Commission provisoire de 10 % = 30 000 CDF due par l'hôte à NZUBU. La caution remboursable, si elle existe, est exclue de l'assiette. Toute charge distincte doit être identifiée et son inclusion/exclusion de la commission définie dans le contrat partenaire. La facture de commission est consolidée en fin de mois et payable sous 7 jours calendaires ; un rappel est envoyé à l'échéance, puis après 7 jours de retard. Après 14 jours de retard, les nouvelles demandes peuvent être suspendues après notification, sans annuler automatiquement les séjours déjà confirmés. Ces délais sont des conditions commerciales proposées, à intégrer au contrat partenaire.

### 3.2 Circuit d'encaissement — courte durée

**Règle MVP : le client paie directement l'hôte, et NZUBU ne reçoit, ne conserve, ne fractionne ni ne reverse le prix du séjour.**

**Règle commerciale standard proposée :** une avance de réservation de 20 % du prix d'hébergement est payée directement à l'hôte pour sécuriser la demande ; le solde de 80 % est réglé à l'arrivée, sauf condition différente approuvée dans le contrat partenaire. Cette avance de 20 % appartient intégralement à l'hôte : elle n'est jamais partagée avec NZUBU et ne constitue pas la commission de NZUBU. Le client peut être accepté sur une modalité « paiement à l'arrivée » uniquement si l'hôte l'a explicitement activée et si le client l'accepte avant confirmation. La possibilité d'exiger cette avance dans chaque catégorie de séjour doit être validée par le conseil juridique et par le ministère compétent au regard de la qualification exacte de l'hébergement ; ce n'est pas une règle de la Loi 15/025 sur le bail résidentiel.

1. L'hôte déclare les moyens qu'il accepte : Mobile Money professionnel vérifié, virement ou espèces à l'arrivée si le contrat de l'hôte le permet.
2. NZUBU affiche le bénéficiaire, le montant, le motif, l'échéance et les conditions avant que le client accepte.
3. Le client paie directement le partenaire selon le canal annoncé.
4. Le client peut saisir la référence du paiement ou signaler un paiement en espèces.
5. L'hôte confirme la réception. Si le moyen de paiement propose une vérification API officielle et que l'intégration est activée, la confirmation peut provenir du prestataire.
6. NZUBU enregistre le statut et la preuve ; le système ne marque pas un paiement comme « confirmé par le prestataire » si seule une déclaration de l'utilisateur ou de l'hôte existe.
7. Après le séjour, le système calcule la commission sur la base contractuelle et émet une facture à l'hôte.
8. L'hôte règle cette facture sur le compte professionnel de NZUBU. Le paiement de cette facture est distinct du prix du séjour.

**États de paiement à distinguer :** `NOT_REQUIRED`, `INSTRUCTIONS_ISSUED`, `DECLARED_BY_CUSTOMER`, `CONFIRMED_BY_HOST`, `CONFIRMED_BY_PROVIDER`, `DISPUTED`, `REFUND_REQUESTED`, `REFUNDED_BY_HOST`, `CANCELLED`.

Un reçu téléversé par le client n'est pas une preuve bancaire définitive. Il reste une pièce déclarative jusqu'à vérification indépendante. Le système conserve séparément : montant attendu, montant déclaré, bénéficiaire, canal, référence, date/heure, source de confirmation et auteur de la confirmation. Il ne doit jamais transformer une déclaration en confirmation du prestataire.

**Règle de confirmation métier :** `CONFIRMED` signifie que l'hôte a accepté la réservation et que la condition financière annoncée a été satisfaite ou explicitement différée jusqu'à l'arrivée. Cela ne signifie pas automatiquement que NZUBU a reçu de l'argent. Le statut de paiement reste un objet séparé du statut de réservation.

### 3.3 Circuit d'encaissement — longue durée

- Loyer : payé directement par le preneur au bailleur, selon les modalités du bail.
- Garantie locative : payée directement au bailleur ou à son mandataire légalement autorisé ; NZUBU ne la détient pas.
- Honoraires d'agence : facturés par NZUBU à la partie qui a demandé le service, ou répartis si les deux parties ont simultanément demandé le service, selon l'article 10 de la Loi 15/025.
- Les agents terrain ne collectent jamais les fonds et ne transportent jamais de caution.
- Le logiciel conserve le montant, la devise, le payeur, le bénéficiaire, la date, le motif, la référence et le statut de la preuve.

La Loi 15/025 prévoit notamment que la garantie locative résidentielle ne peut excéder trois mois de loyer, que le loyer est payé en monnaie ayant cours légal en RDC et interdit au bailleur d'exiger le paiement anticipatif du loyer (articles 18, 21 et 22) [S1]. Le paramétrage longue durée doit empêcher la publication d'une garantie supérieure à trois mois et ne doit pas proposer un paiement anticipatif du loyer comme exigence standard. Les formulations contractuelles exactes doivent être validées par le juriste de l'entreprise.

### 3.4 Circuits interdits au MVP

- Compte collectif NZUBU recevant le prix de tous les logements.
- Solde client/hôte conservé dans un wallet NZUBU.
- Split automatique non contractualisé.
- Débit d'une caution par NZUBU.
- Reversement de fonds à un hôte depuis un compte non autorisé.
- Encaissement de cash par un agent sans procédure de caisse approuvée ; par défaut, aucun encaissement terrain.

La Banque Centrale du Congo supervise les systèmes et moyens de paiement, les prestataires de services de paiement et les prestataires critiques [S8]. L'architecture doit donc être validée au regard de la qualification de l'activité réelle de NZUBU. L'intégration d'une API marchand ne suffit pas à autoriser NZUBU à tenir des fonds pour compte de tiers.

### 3.5 Prestataires de paiement à évaluer

- **M-Pesa/Vodacom RDC** : le portail officiel documente notamment des API C2B, B2C, B2B et de vérification de statut de transaction ; l'accès marchand passe par un compte business et des étapes d'onboarding [S9].
- **Airtel Money** : le portail développeur Airtel RDC présente l'inscription, les tests, puis l'accès production après conformité légale et onboarding [S10].
- Orange Money et autres prestataires : ne pas supposer la disponibilité d'une API marchande sans obtenir documentation, contrat et environnement de test local.

Le choix final dépendra des frais, délais de règlement, plafonds, disponibilité des API, gestion des remboursements, accès à la preuve de paiement, support et contrat professionnel. L'agence doit comparer les offres sur des devis écrits.

### 3.6 Devise et règles de prix

**Paramètre par défaut : CDF uniquement dans le catalogue, les contrats générés par le système et les montants de facture.**

- Le prix de location résidentielle est exprimé et payé en monnaie ayant cours légal en RDC selon l'article 21 de la Loi 15/025 [S1].
- En janvier 2026, la Banque Centrale a rappelé, selon une communication rapportée par l'ACP, la règle de fixation, d'affichage et de paiement en monnaie nationale des biens et services de consommation, sauf dérogation expresse [S11].
- Le système conserve le montant en entier CDF, sans conversion automatique en USD.
- Si une dérogation légale est invoquée, l'option doit être activée uniquement après avis juridique documenté ; elle n'est pas proposée au MVP.

### 3.7 Remboursements et annulations

**Courte durée :** au MVP, le remboursement du prix du séjour est exécuté directement par l'hôte, puisque le paiement du séjour ne transite pas par NZUBU. NZUBU ouvre le dossier, collecte les preuves, applique le barème contractuel communiqué au client et suit la confirmation du remboursement.

**Politique commerciale proposée à négocier avec les hôtes (non présentée comme une règle légale) :**

| Événement | Proposition de traitement |
|---|---|
| Annulation par le client plus de 72 h avant l'arrivée | Remboursement intégral de l'avance de 20 % versée à l'hôte |
| Annulation par le client entre 24 h et 72 h | Remboursement de 50 % de l'avance versée à l'hôte |
| Annulation par le client moins de 24 h ou non-présentation | Avance non remboursable, sauf exception prévue par la politique ou manquement du partenaire |
| Annulation par l'hôte | Remboursement intégral au client et recherche d'une alternative ; le partenaire supporte les conséquences prévues dans son contrat |
| Logement matériellement non conforme à l'arrivée | Ouverture immédiate d'un incident ; comparaison avec la fiche et les preuves ; solution amiable, relogement ou remboursement à décider selon la gravité et les obligations contractuelles |

Ces pourcentages sont une proposition de travail ; ils ne doivent pas être codés ni publiés avant validation par la direction et un juriste local. Le système doit stocker un instantané de la politique acceptée lors de la réservation afin qu'une modification ultérieure ne change pas rétroactivement les droits du client.

**Longue durée :** les frais, dépôts et remboursements suivent le contrat de bail et les dispositions applicables. NZUBU ne rembourse pas une somme qu'elle n'a pas encaissée. Toute compensation éventuelle doit faire l'objet d'une décision autorisée et traçable.

---

## 4. Vocabulaire métier et modèle de l'offre immobilière

Les termes doivent être employés de manière constante dans les interfaces, API, bases de données et documents contractuels.

| Terme | Définition produit |
|---|---|
| Bien immobilier / propriété (`property`) | Ensemble immobilier ou parcelle/localisation de référence. Ce n'est pas nécessairement l'unité louée. |
| Immeuble / bâtiment (`building`) | Structure bâtie pouvant contenir plusieurs unités. Entité facultative si le bien est une maison indépendante. |
| Unité louable (`unit`) | Espace précis proposé à la location : maison entière, appartement, studio ou chambre indépendante. C'est l'inventaire physique qui peut être réservé. |
| Offre / annonce (`listing`) | Conditions commerciales publiées pour une unité : durée, prix, disponibilité, équipements, règles et médias. |
| Mode de location (`rental_mode`) | `SHORT_STAY` ou `LONG_TERM`. |
| État de mobilier (`furnishing_status`) | `FURNISHED`, `UNFURNISHED`, `PARTIALLY_FURNISHED`. Ne détermine pas la durée. |
| Partenaire (`partner`) | Personne physique ou morale liée à NZUBU par un contrat commercial ou mandat. |
| Propriétaire / bailleur (`owner/landlord`) | Personne qui détient le droit de donner le bien à bail. Le bailleur légal doit être identifié dans le dossier. |
| Mandataire (`authorized_representative`) | Personne pouvant agir pour le compte du propriétaire sur la base d'un mandat vérifié. |
| Hôte (`host`) | Partenaire qui met à disposition un logement pour un séjour de courte durée et assure les prestations d'accueil convenues. |
| Gestionnaire (`property_manager`) | Personne qui administre le bien pour le compte d'un propriétaire dans le cadre d'un contrat ou mandat vérifié. |
| Agent terrain (`field_agent`) | Collaborateur NZUBU qui réalise les missions de contrôle et de collecte de médias. |
| Vérification (`verification`) | Ensemble daté de contrôles, preuves, constats et décisions ; ce n'est pas une certification foncière ou structurelle. |
| Visite (`viewing`) | Rendez-vous physique planifié avec le candidat et le partenaire/représentant. |
| Demande de réservation (`booking_request`) | Demande d'un client concernant un séjour ; elle n'est pas confirmée tant que l'hôte n'a pas validé les conditions. |
| Dossier locatif (`rental_case`) | Processus de longue durée allant de la demande/visite à la décision du bailleur, au bail et à la remise des clés. |

### 4.1 Hiérarchie des objets

```text
PROPERTY (parcelle / ensemble immobilier)
  └── BUILDING (facultatif : bâtiment, villa, bloc)
        └── UNIT (inventaire réservable : appartement, studio, chambre, maison)
              ├── LISTING SHORT_STAY (conditions de séjour)
              └── LISTING LONG_TERM (conditions de bail)
```

### 4.2 Plusieurs unités dans un même immeuble

- Un immeuble peut contenir un nombre illimité d'unités.
- Chaque unité reçoit un identifiant interne distinct.
- Chaque unité a ses propres caractéristiques, médias, disponibilité, prix et inspection.
- Les parties communes sont décrites séparément ; elles ne doivent pas être confondues avec la surface privative.

### 4.3 Chambres proposées séparément

Une chambre peut être une unité louable indépendante si le client peut identifier clairement :

- la chambre privative incluse ;
- les espaces partagés (cuisine, salon, sanitaires, cour, parking) ;
- le nombre maximal d'occupants ;
- les autres occupants éventuels ou leur nombre maximal ;
- les règles d'accès et de cohabitation.

Le produit ne doit pas publier « appartement entier » si seule une chambre est proposée.

### 4.4 Plusieurs offres pour une même unité

Une même unité peut avoir une offre meublée de courte durée et une offre de longue durée, si le partenaire l'autorise et si les conditions juridiques sont remplies. Les deux offres doivent partager un mécanisme d'inventaire commun : **une période confirmée dans une offre bloque les périodes incompatibles de l'autre offre**.

Une seule offre active par combinaison unité/mode de location/conditions commerciales peut être publiée à la fois. Les modifications sont historisées. Les doublons probables sont signalés au responsable de marché ; ils ne sont pas fusionnés automatiquement.

### 4.5 Détection des doublons

Le système calcule un score de suspicion à partir de :

- adresse/coordonnées ou proximité géographique ;
- partenaire et numéro de contact ;
- identifiant de parcelle ou référence fournie ;
- photos/vidéos similaires ;
- nom et description du bien.

Le score ne supprime pas automatiquement une annonce. Il crée une tâche de revue humaine. Les agents ne doivent pas fusionner deux unités simplement parce qu'elles se trouvent à la même adresse.

---

## 5. Acteurs, rôles et permissions

### 5.1 Principes d'autorisation

Le système utilise une combinaison de :

- **RBAC** : permissions associées à un rôle ;
- **ABAC** : restriction selon le territoire, le marché, l'unité, la mission ou le dossier ;
- **séparation des tâches** : certaines actions sont initiées par un collaborateur et approuvées par un autre ;
- **audit immuable** : toutes les actions sensibles conservent auteur, date, valeur précédente, nouvelle valeur, motif et objet concerné.

Les comptes administratifs sont créés sur invitation. Un client peut aussi devenir partenaire, mais ses droits sont accordés séparément et ne lui ouvrent pas l'accès aux outils internes.

### 5.2 Rôles opérationnels du MVP

| Rôle | Périmètre principal | Peut faire | Ne peut pas faire seul |
|---|---|---|---|
| Client | Son compte et ses dossiers | Voir, chercher, favoriser, demander une visite/réservation, annuler selon règles, signaler | Modifier l'annonce, valider son paiement externe ou décider d'un remboursement partenaire |
| Propriétaire/bailleur | Ses biens mandatés | Soumettre, voir ses annonces et demandes, confirmer disponibilité, valider conditions | Modifier un rapport terrain ou publier sans validation NZUBU |
| Hôte | Ses offres de séjour | Définir prix/conditions, calendriers, accepter/refuser demandes, déclarer paiement reçu, confirmer séjour | Modifier les preuves d'inspection ou valider lui-même le badge NZUBU |
| Mandataire | Biens couverts par mandat | Actions du propriétaire dans la limite du mandat | Agir hors périmètre ou durée du mandat |
| Gestionnaire immobilier | Biens couverts par contrat de gestion | Actions prévues au contrat | Se déclarer propriétaire ou proposer un bien non mandaté |
| Agent terrain | Missions assignées | Consulter mission, faire checklist, téléverser preuves, soumettre rapport | Approuver sa propre inspection, changer prix, publier, encaisser |
| Chargé des opérations / Dispatcher | Toutes les missions du périmètre | Qualifier, programmer, affecter, replanifier, suivre | Modifier les constats de l'agent après soumission sans trace ; publier une annonce non approuvée |
| Responsable marché meublé | Offres `FURNISHED`/short stay selon son périmètre | Examiner dossiers, contrôler contenu, approuver/rejeter la mise en ligne | Modifier le grand livre financier ou consulter des documents hors périmètre |
| Responsable marché non-meublé | Offres non-meublées/long terme selon périmètre | Examiner dossiers, contrôler données, approuver le statut de marché | Valider ses propres justificatifs partenaires si conflit d'intérêt ; modifier paiement |
| Service client | Tickets et dossiers client | Répondre, catégoriser, collecter preuves, escalader | Modifier un statut financier ou approuver un remboursement au-delà du seuil délégué |
| Finance | Factures et paiements NZUBU | Générer facture, rapprocher encaissement, déclarer impayé, exporter rapports | Modifier inspection, contenu d'annonce ou accès d'administration |
| Modérateur | Annonces et contenus | Masquer temporairement un contenu, signaler, escalader | Approuver le droit de proposer le bien ou modifier une transaction |
| Administrateur fonctionnel | Configuration des utilisateurs et référentiels | Créer utilisateurs, attribuer rôles, gérer zones et paramètres autorisés | Effacer les journaux ou valider ses propres remboursements sensibles |
| Super-administrateur | Administration technique exceptionnelle | Déblocage, récupération d'accès, configuration d'urgence | Toute opération d'argent sans approbation Finance + Direction ; effacement de l'audit |
| Direction / Product Owner | Paramètres métier et validation de lancement | Décider des règles, consulter les indicateurs, arbitrer les exceptions | Accéder aux secrets techniques non nécessaires |

### 5.3 Matrice synthétique des actions sensibles

Légende : `O` = autorisé ; `S` = autorisé dans son périmètre ; `D` = demande/initiative seulement ; `A` = approbation requise ; `—` = interdit.

| Action | Agent terrain | Opérations | Resp. marché | Service client | Finance | Admin | Direction |
|---|---:|---:|---:|---:|---:|---:|---:|
| Créer une mission | — | O | D | — | — | S | O |
| Affecter un agent | — | O | D | — | — | — | O |
| Soumettre un rapport terrain | O | S | — | — | — | — | — |
| Approuver une vérification | — | D | O | — | — | — | A en cas d'exception |
| Publier une annonce | — | D | O | — | — | — | A pour exception |
| Suspendre une annonce | D | O | O | D | — | S | O |
| Modifier un prix | — | D | A | — | — | — | O selon politique |
| Confirmer une réservation | — | D | S | D | — | — | — |
| Confirmer un encaissement partenaire | — | — | — | — | S | — | A si contesté |
| Émettre facture commission | — | — | — | — | O | — | A selon seuil |
| Approuver remboursement NZUBU | — | D | D | D | O jusqu'au seuil | — | A au-dessus du seuil |
| Consulter justificatif d'identité | S si mission le nécessite | S | S | — sauf ticket justifié | — | S | — sauf nécessité |
| Attribuer rôles | — | — | — | — | — | O | A pour rôle privilégié |
| Export données personnelles | — | — | S agrégé | S limité ticket | S financier | D | A / DPO |

### 5.4 Contrôle à deux personnes

Les opérations suivantes exigent deux personnes distinctes :

- approbation d'un remboursement depuis un compte NZUBU ;
- modification rétroactive d'un montant facturé ;
- forçage manuel d'une réservation confirmée ;
- réactivation d'un partenaire suspendu pour fraude ;
- changement d'un statut d'encaissement contesté ;
- export massif de documents d'identité ;
- changement du rôle d'un administrateur.

Le système doit bloquer l'approbation par la même personne ayant initié la demande.

### 5.5 Retrait d'accès

- Chaque compte interne est nominatif, jamais partagé.
- La désactivation d'un collaborateur révoque les sessions, tokens et accès externes gérés par NZUBU.
- Les dossiers et missions restent attribués à l'équipe ou au responsable de remplacement.
- Les journaux sont conservés selon une durée définie par la politique juridique et de sécurité.
- Un compte suspendu ne peut pas se réactiver avec le même mot de passe ; la réinitialisation passe par un administrateur habilité.

---

## 6. Comptes, inscription et authentification

### 6.1 Consultation sans compte

Sans connexion, une personne peut :

- consulter le feed public ;
- rechercher et filtrer les offres ;
- ouvrir une fiche ;
- voir les caractéristiques, prix et conditions publiques ;
- consulter l'explication du badge de vérification.

Un compte est nécessaire pour :

- enregistrer des favoris sur plusieurs appareils ;
- envoyer une demande de visite ;
- envoyer une demande de réservation ;
- consulter ses dossiers et notifications privées ;
- soumettre un signalement nécessitant un suivi.

### 6.2 Authentification

**Solution UX proposée :** téléphone + code à usage unique (OTP) pour les utilisateurs locaux, mot de passe/session sécurisée pour les comptes internes ; e-mail de récupération facultatif.

**BLOCAGE JURIDIQUE :** l'article 187 du Code du numérique cite expressément les numéros de téléphone parmi les identifiants dont le traitement est soumis à autorisation préalable. La procédure de formalités préalables a fait l'objet d'une décision publiée au Journal officiel en avril 2026 selon une analyse juridique spécialisée ; cette analyse rapporte que l'ARPTC assure provisoirement certaines fonctions dans l'attente de l'installation de l'autorité dédiée [S4, S5]. Le traitement de vrais numéros ne doit pas être activé sans confirmation écrite de la procédure, du destinataire et de l'autorisation requise. Les essais avant cette validation utilisent des numéros fictifs.

L'e-mail n'est pas automatiquement une solution d'évitement : le traitement d'autres données personnelles et les transferts internationaux restent soumis au Code du numérique.

### 6.3 Règles OTP à implémenter

- Code aléatoire à usage unique, durée de validité proposée : 5 minutes.
- Maximum 5 tentatives par code.
- Renvoi possible après 60 secondes.
- Plafond de renvoi : 5 codes par numéro sur 24 heures, avec seuils ajustables anti-abus.
- Blocage temporaire après échecs répétés, sans révéler si le compte existe.
- Limitation par appareil, adresse IP et numéro haché, sous réserve de minimisation et de conformité.
- OTP jamais stocké en clair ; seul un hash ou une valeur sécurisée est conservé.
- Journal d'envoi sans exposer le code.
- Le changement de numéro exige une authentification renforcée et une preuve de contrôle du nouveau numéro.

### 6.4 Profils et comptes multiples

Une personne peut agir comme cliente et comme partenaire. Le système utilise un compte personne unique et un ou plusieurs profils partenaires reliés à ce compte.

Les collaborateurs NZUBU ont des comptes distincts, créés par invitation et non par inscription publique.

### 6.5 Suppression et clôture

Une demande de suppression :

1. vérifie l'identité du demandeur de manière proportionnée ;
2. ferme les sessions et bloque les connexions ;
3. identifie les réservations, transactions, litiges ou obligations comptables encore actifs ;
4. supprime ou anonymise les données qui peuvent l'être ;
5. conserve uniquement les éléments dont la conservation est juridiquement justifiée et pour la durée requise ;
6. informe l'utilisateur du traitement de sa demande.

La suppression du compte ne doit pas effacer les preuves nécessaires à un litige ou une obligation comptable, mais ces données sont mises en accès restreint.

---

---

## 7. Partenaires : inscription, capacité à proposer et mandat

### 7.1 Profils de proposant acceptés

Un logement ne peut être soumis que par l'une des catégories suivantes :

1. **Propriétaire/bailleur** : personne physique ou morale déclarant détenir le droit de proposer le bien.
2. **Mandataire** : personne autorisée par le propriétaire à faire promouvoir le bien, organiser les visites et, si le mandat le permet, négocier ou conclure.
3. **Gestionnaire immobilier** : personne/entreprise liée au propriétaire par un contrat de gestion précisant le périmètre de ses pouvoirs.
4. **Exploitant/hôte** : personne ou entité responsable de l'exploitation d'une offre de séjour, qui doit justifier son droit d'utiliser et de commercialiser le logement.

Un simple « contact du propriétaire » ou une déclaration orale ne suffit pas pour publier.

### 7.2 Pièces et vérifications proposées

| Catégorie | Preuve minimale à collecter | Contrôle NZUBU |
|---|---|---|
| Identité personne physique | Pièce d'identité officielle pertinente, nom complet, moyen de contact | Comparaison du nom et de la photo avec le proposant ; contrôle visuel et date du contrôle ; pas de reconnaissance biométrique automatique au MVP |
| Société | RCCM, identification nationale et document établissant le représentant | Concordance de la société, du signataire et du pouvoir de représentation |
| Propriétaire | Certificat d'enregistrement ou autre preuve officielle de droit reconnue par le conseil local | Vérification documentaire et cohérence du propriétaire avec le bien ; absence de présomption de titre incontestable |
| Mandataire | Mandat écrit signé par le propriétaire, identité du mandant, durée et pouvoirs détaillés | Confirmer que le mandat autorise la publicité, les visites et les actes demandés ; obtenir confirmation directe du mandant lorsque possible |
| Gestionnaire | Contrat de gestion ou mandat précisant les biens et pouvoirs | Vérifier validité, durée, périmètre, pouvoirs d'encaissement ou absence de pouvoir d'encaissement |
| Hôte/exploitant | Identité, droit d'occupation/exploitation, accord du propriétaire si nécessaire, documents d'exploitation applicables | Contrôle du droit de recevoir des voyageurs et vérification réglementaire sectorielle à confirmer |

**Minimisation :** demander uniquement les pièces nécessaires à établir l'identité et le droit de proposer le logement. Ne pas collecter de données biométriques, d'informations sensibles ou de documents excessifs. Les copies d'identité et justificatifs sont chiffrés, accessibles seulement aux personnes habilitées et conservés selon une durée approuvée par le responsable juridique/données.

### 7.3 Vérification du droit de proposer

Le dossier est noté selon les niveaux suivants :

- `RIGHTS_UNCHECKED` : pièces non examinées ;
- `RIGHTS_IN_REVIEW` : examen commencé ;
- `RIGHTS_CONFIRMED_DOCUMENTARY` : documents examinés et cohérents ;
- `RIGHTS_NEED_MORE_INFO` : pièces complémentaires nécessaires ;
- `RIGHTS_REJECTED` : incohérence grave, mandat expiré ou pouvoir insuffisant ;
- `RIGHTS_EXPIRED` : justificatif ou mandat arrivé à échéance.

Une validation documentaire ne constitue pas une vérification cadastrale exhaustive. L'interface doit préciser la nature du contrôle, la pièce et sa date, sans afficher la pièce au public.

### 7.4 Contrat partenaire et autorisation de contenu

Avant toute publication, le partenaire signe :

- le contrat de collaboration/mandat avec NZUBU ;
- la déclaration d'exactitude des informations ;
- l'autorisation de prise de vue et d'utilisation des photos/vidéos sur l'application et les canaux marketing prévus ;
- les conditions financières (commission, base de calcul, facture, paiement) ;
- les conditions de disponibilité, de réservation, d'annulation et de remboursement ;
- la responsabilité en cas d'information fausse, d'indisponibilité ou de comportement abusif.

Le droit d'utiliser les médias doit préciser les supports, la durée, le territoire, les possibilités de recadrage/montage, la possibilité de retrait et le traitement des contenus déjà diffusés. Les personnes reconnaissables, plaques et documents privés ne doivent pas être filmés ou publiés sans base juridique/autorisation appropriée.

### 7.5 Activation partenaire

Un partenaire est activé uniquement si :

- son identité est vérifiée ;
- le signataire a le pouvoir requis ;
- le contrat partenaire est accepté ;
- le canal de notification est opérationnel ;
- les documents requis selon son activité sont validés ;
- il a accepté le guide de disponibilité et les règles d'annulation.

Un partenaire peut être actif pour un bien et non autorisé pour un autre si son mandat ne couvre pas ce second bien.

---

## 8. Fiche logement — dictionnaire de données du MVP

Chaque champ de la fiche doit avoir un nom stable dans l'API et un libellé utilisateur compréhensible. Les champs internes ne sont pas tous publics.

### 8.1 Identification et localisation

| Champ | Format | Obligatoire | Public ? | Règle |
|---|---|---:|---:|---|
| `property_id` | UUID | Oui, interne | Non | Identifiant immuable de l'ensemble immobilier |
| `building_id` | UUID/null | Non | Non | Nécessaire si ensemble à plusieurs bâtiments |
| `unit_id` | UUID | Oui | Non | Identifiant de l'unité réellement louable |
| `unit_reference` | Texte | Oui si immeuble | Partiel | Ex. Appartement 3B, chambre arrière ; ne pas exposer une référence sensible |
| `unit_type` | Enum | Oui | Oui | `HOUSE`, `VILLA`, `APARTMENT`, `STUDIO`, `ROOM`, `OTHER` |
| `furnishing_status` | Enum | Oui | Oui | `FURNISHED`, `UNFURNISHED`, `PARTIALLY_FURNISHED` |
| `rental_mode` | Enum | Oui | Oui | `SHORT_STAY`, `LONG_TERM` ; indépendant du mobilier |
| `province_id` | Référence | Oui | Oui | Pour le pilote : Kinshasa |
| `city_id` | Référence | Oui | Oui | Kinshasa comme ville-province dans le référentiel métier |
| `commune_id` | Référence | Oui | Oui | Valeur contrôlée dans le référentiel |
| `quartier_id` | Référence/texte normalisé | Oui | Oui | Quartier choisi dans un référentiel, ou `OTHER` avec validation |
| `avenue` | Texte | Recommandé | Non au départ | Visible uniquement aux équipes habilitées et après étape prévue |
| `street_number_or_parcel` | Texte | Si connu | Non | Ne pas bloquer la fiche si le système de numérotation local n'est pas disponible |
| `landmark` | Texte | Oui | Approximation | Repère local utile et clair, sans exposer inutilement la porte exacte |
| `latitude`, `longitude` | Décimal | Oui après terrain | Approximatif côté public | Coordonnées exactes privées ; géolocalisation interne ; public au niveau du quartier |
| `address_accuracy` | Enum | Oui | Oui sous forme d'indication | `EXACT`, `APPROXIMATE`, `LANDMARK_ONLY` |

### 8.2 Caractéristiques et capacité

| Champ | Format | Obligatoire | Règle |
|---|---|---:|---|
| `title` | Texte 5–80 caractères | Oui | Description utile sans promesse trompeuse |
| `description` | Texte 50–2 000 caractères | Oui | Contenu modéré ; pas de numéro de téléphone public non autorisé |
| `bedrooms_count` | Entier ≥ 0 | Oui | Chambre séparée ; studio peut être 0 |
| `living_rooms_count` | Entier ≥ 0 | Recommandé | Séparer pièce de vie des chambres |
| `bathrooms_count` | Entier > 0 | Oui | Indiquer privatif ou partagé |
| `toilets_count` | Entier > 0 | Recommandé | Permettre sanitaires séparés |
| `beds_count` | Entier ≥ 0 | Pour séjour | Nombre de lits, préciser les types si utile |
| `max_occupants` | Entier > 0 | Pour séjour | Ne pas dépasser la capacité déclarée/vérifiée |
| `surface_m2` | Décimal ≥ 0 | Facultatif | Afficher « déclaré » si non mesuré par professionnel |
| `floor_number` | Texte/null | Facultatif | Ne pas convertir un rez-de-chaussée en étage 0 sans convention |
| `accessibility_notes` | Texte | Recommandé | Escaliers, ascenseur, accès voiture, etc. |
| `shared_spaces` | Liste | Si chambre | Cuisine, douche, salon, cour, etc. |

### 8.3 Équipements et services

Les équipements sont stockés comme des items structurés avec : `equipment_code`, `present`, `functional_at_inspection`, `shared_or_private`, `notes`, `last_checked_at`.

Catalogue P0 : eau courante/approvisionnement, électricité, source de secours si présente, toilettes, douche, chauffe-eau, ventilation/climatisation, cuisine, réfrigérateur, literie, mobilier, Wi-Fi/Internet, parking, sécurité/gardiennage déclaré, accès routier, ascenseur si applicable.

**Règle de vérité :** l'agent note ce qu'il observe au moment du passage. Pour l'eau et l'électricité, il précise si le service a été observé disponible, si une réserve/générateur existe et ce que le partenaire déclare sur les horaires/coupures. NZUBU n'affiche pas « eau 24h/24 » ou « électricité permanente » sans preuve et sans qualifier la source de l'information.

### 8.4 Prix, frais et conditions

| Champ | Format | Obligatoire | Règle |
|---|---|---:|---|
| `currency` | ISO 4217 | Oui | `CDF` au MVP |
| `price_amount` | Entier positif | Oui | Prix de base en CDF |
| `price_unit` | Enum | Oui | `PER_NIGHT` pour séjour ; `PER_MONTH` pour longue durée |
| `cleaning_fee` | Entier ≥ 0/null | Facultatif | Affiché séparément, ne pas l'inclure silencieusement |
| `service_charges` | Liste de montants | Oui, même vide | Eau, électricité, internet, charges communes, etc. ; nature claire |
| `security_deposit_amount` | Entier ≥ 0/null | Selon cas | Caution/garantie remboursable, distincte du prix et de l'avance de réservation ; préciser le bénéficiaire et les conditions de restitution |
| `booking_advance_percent` | Décimal 0–100 | Séjour, si avance activée | Paramètre commercial versionné ; proposition initiale de 20 %, à valider juridiquement et contractuellement ; versé directement à l'hôte |
| `booking_advance_amount` | Entier ≥ 0/null | Calculé pour une réservation | Calcul côté serveur sur l'assiette affichée ; montant figé dans le snapshot d'acceptation |
| `rental_guarantee_months` | Décimal | Pour long terme | Contrôle système ≤ 3 mois pour le bail résidentiel régi par la Loi 15/025, sous réserve d'avis juridique |
| `agency_fee_payer` | Enum | Pour long terme | `TENANT`, `LANDLORD`, `SPLIT`, `UNDECIDED` ; basé sur qui a sollicité le service |
| `min_nights`, `max_nights` | Entier | Pour séjour | `min_nights ≥ 1`, max ≥ min |
| `cancellation_policy_id` | Référence | Pour séjour | Politique acceptée et versionnée |
| `house_rules` | Liste/texte structuré | Pour séjour | Visiteurs, fêtes, animaux, fumée, bruit, pièces interdites |
| `lease_duration` | Durée | Pour long terme | Durée proposée, à confirmer au contrat |
| `lease_start_window` | Date/période | Pour long terme | Date de disponibilité attendue |

### 8.5 Informations de contrôle et de provenance

Chaque annonce doit conserver :

- `verification_id` et `verification_status` ;
- `verified_at`, `verified_until` ;
- identité interne de l'agent et approbateur ;
- liste des contrôles effectués et non effectués ;
- pièces justificatives avec type, date, statut et référence de stockage ;
- médias source et médias publiés ;
- source de chaque donnée importante : `PARTNER_DECLARED`, `FIELD_OBSERVED`, `DOCUMENT_REVIEWED`, `SYSTEM_CALCULATED` ;
- date de la dernière confirmation de disponibilité ;
- historique des changements de prix/conditions.

### 8.6 Visibilité de l'adresse et des contacts

- Avant demande de visite/réservation : commune, quartier, repère large et position approximative.
- Après confirmation du rendez-vous/séjour : adresse détaillée partagée uniquement avec les participants autorisés et pour ce dossier.
- Numéro du partenaire : masqué au public ; accès contrôlé selon le parcours et les règles de données personnelles.
- L'agent terrain voit l'adresse exacte et les coordonnées nécessaires à sa mission.

---

## 9. Procédure de vérification physique du logement

### 9.1 Responsables

- Le partenaire fournit les informations et les pièces.
- Le chargé des opérations vérifie que le dossier est assez complet pour planifier.
- Le dispatcher crée et affecte la mission.
- L'agent terrain exécute la checklist et dépose les preuves.
- Le responsable de marché examine le rapport et prend la décision de publication.
- Le service client peut signaler une divergence, mais ne délivre pas le badge.

### 9.2 Checklist obligatoire

**A. Identité et droit de proposer**

- nom de la personne rencontrée ;
- correspondance avec le proposant/mandataire ;
- pièce/mandat examiné ;
- personne qui ouvre le logement et qualité déclarée ;
- éventuelle contradiction ou absence de consentement ;
- preuve que l'accès au logement a été autorisé.

**B. Localisation et existence**

- commune, quartier, avenue ou repère ;
- position GPS et précision estimée ;
- photo de l'accès extérieur sans exposer des tiers inutilement ;
- accès réel à l'unité ;
- type d'unité : maison, appartement, studio ou chambre.

**C. Description intérieure**

- pièces et nombre de chambres ;
- sanitaires privés/partagés ;
- cuisine et espaces communs ;
- état visible du sol, murs, portes, fenêtres ;
- ventilation/éclairage ;
- mobilier et équipements annoncés ;
- anomalies visibles, humidité, fuite, odeur, traces de dommages ;
- capacité annoncée et couchages.

**D. Services et équipements**

- test observable de l'eau, électricité, prises, sanitaires et équipements essentiels ;
- réserve d'eau, groupe électrogène/onduleur ou autre secours déclaré ;
- Internet si annoncé : réseau observé et résultat ponctuel, sans promettre sa continuité ;
- accès, escalier, ascenseur si applicable ;
- parking et accès véhicule.

**E. Conditions commerciales**

- prix de base et unité de calcul ;
- charges, caution, frais et taxes s'ils existent ;
- restrictions importantes ;
- dates de disponibilité ;
- modalités d'arrivée/visite ;
- nom du bénéficiaire du paiement et correspondance avec le partenaire habilité.

**F. Contenu et autorisations**

- vidéo filmée sans personnes reconnaissables non autorisées ;
- pas de document privé, écran, numéro de compte ou objet sensible visible ;
- accord d'utilisation du contenu signé ;
- médias représentatifs de l'unité réelle, pas de photos d'un logement témoin.

**G. Sécurité observable**

- issue et accès visibles ;
- garde-corps, serrure, éclairage d'accès, dispositif d'urgence si annoncé ;
- risques immédiatement apparents reportés ;
- si un risque sérieux est constaté, mission marquée `SAFETY_CONCERN` et annonce non publiable en attendant avis.

Un agent immobilier n'est pas un ingénieur en bâtiment. Les contrôles visuels ci-dessus ne constituent ni une expertise structurelle, ni un audit électrique certifié, ni une certification de sécurité incendie.

### 9.3 Décision d'inspection

| Résultat | Signification | Action |
|---|---|---|
| `PASS` | Contrôles P0 réussis, aucune incohérence bloquante | Soumettre au responsable de marché |
| `PASS_WITH_DISCLOSURES` | Logement publiable avec réserves visibles | Exiger une description claire des limites |
| `NEEDS_CORRECTION` | Informations manquantes ou divergence corrigeable | Retour partenaire/agent ; pas de publication |
| `FAIL_RIGHTS` | Droit de proposer insuffisant ou incohérent | Rejet/suspension ; escalade juridique si suspicion de fraude |
| `FAIL_PROPERTY` | Logement inaccessible, différent ou non conforme à des exigences minimales | Rejet ou nouvelle mission |
| `SAFETY_CONCERN` | Risque sérieux constaté | Blocage publication et escalade direction/conseil |
| `CANCELLED_NO_ACCESS` | Accès impossible ou rendez-vous manqué | Replanifier ou clôturer selon nombre d'échecs |

### 9.4 Validité de la vérification

**Règle de conception proposée :** badge valide 90 jours après inspection, sous réserve d'absence d'événement déclencheur.

Nouvelle vérification obligatoire si :

- 90 jours écoulés ;
- changement de propriétaire, mandataire ou gestionnaire ;
- travaux ou transformation de l'unité ;
- modification importante de capacité, équipement ou usage ;
- plainte fondée concernant la conformité ;
- annulations répétées liées à l'indisponibilité ;
- nouvelle vidéo ne représentant pas l'unité vérifiée ;
- incident sérieux ;
- changement d'adresse ou de position.

La disponibilité n'est **jamais** garantie par la durée du badge. Elle fait l'objet d'une confirmation distincte.

---

## 10. Missions terrain et planification

### 10.1 Création d'une mission

Une mission peut être déclenchée par :

- dossier de nouveau logement complet ;
- demande de nouvelle vidéo ;
- re-vérification à échéance ;
- plainte nécessitant une inspection ;
- changement matériel signalé ;
- contrôle ponctuel décidé par le responsable de marché.

La mission contient : `mission_id`, type, unité, adresse privée, coordonnées, partenaire, contact autorisé, agent affecté, date/heure prévue, durée estimée, checklist applicable, priorité, consignes et historique.

### 10.2 Affectation

Le dispatcher sélectionne l'agent selon :

- zone et connaissance de la commune/quartier ;
- charge de travail et disponibilité ;
- compétences nécessaires ;
- temps de déplacement ;
- conflit d'intérêt éventuel ;
- matériel disponible.

Un agent ne peut pas approuver son propre rapport. L'agent confirme ou refuse l'affectation avec motif ; un refus revient dans la file du dispatcher.

### 10.3 États de mission

```text
CREATED → SCHEDULED → ASSIGNED → ACCEPTED → IN_PROGRESS
                                      │           ├── BLOCKED_ACCESS
                                      │           ├── RESCHEDULE_REQUIRED
                                      │           └── REPORT_SUBMITTED
                                      └── REJECTED_BY_AGENT
REPORT_SUBMITTED → UNDER_REVIEW → APPROVED / NEEDS_CORRECTION / REJECTED
SCHEDULED/ASSIGNED → CANCELLED (motif obligatoire)
```

### 10.4 Délais opérationnels proposés

- dossier complet reçu : qualification par opérations sous 1 jour ouvrable ;
- premier créneau proposé : sous 2 jours ouvrables lorsque l'agent et le partenaire sont disponibles ;
- rapport terrain : le jour de la visite, sauf problème de synchronisation ;
- revue marché : sous 1 jour ouvrable après rapport complet ;
- correction demandée : relance après 2 jours ouvrables.

Ce sont des SLA internes cibles, pas une garantie publique avant validation des effectifs et des horaires de travail.

### 10.5 Cas d'échec

- **Partenaire absent** : mission `BLOCKED_ACCESS`, preuve de présence et tentative de contact ; replanification.
- **Accès refusé** : aucune photo/vidéo clandestine ; mission suspendue ; alerte opérations.
- **Adresse introuvable** : conserver repère et tentative de localisation ; demander précision au partenaire.
- **Agent absent** : dispatcher réaffecte et journalise le remplacement.
- **Connexion faible** : le rapport reste en brouillon local ; les médias en file de téléversement reprenable.
- **Incident de sécurité** : l'agent quitte la situation dangereuse, alerte l'opération, ne confronte pas le partenaire.
- **Dossier frauduleux suspecté** : gel de la publication et escalade responsable marché/direction.

---

## 11. Cycle de vie d'une annonce

### 11.1 États

```text
DRAFT
  → SUBMITTED
  → DOCUMENT_REVIEW
      ├── NEEDS_INFORMATION → SUBMITTED
      ├── REJECTED
      └── READY_FOR_MISSION
              → MISSION_SCHEDULED
              → FIELD_REVIEW
                   ├── NEEDS_CORRECTION
                   ├── REJECTED
                   └── MARKET_REVIEW
                        ├── NEEDS_INFORMATION
                        ├── REJECTED
                        └── APPROVED
                              → PUBLISHED
                                   ├── PAUSED
                                   ├── UNDER_REVERIFICATION
                                   ├── UNAVAILABLE
                                   ├── EXPIRED
                                   └── ARCHIVED
```

### 11.2 Conditions de publication

Une annonce ne passe à `PUBLISHED` que si :

- partenaire actif ;
- droit de proposer accepté et non expiré ;
- contrat et autorisation médias présents ;
- unité identifiée sans doublon non résolu ;
- rapport de terrain approuvé et non expiré ;
- tous les champs P0 renseignés ;
- prix/charges et conditions validés ;
- politique d'annulation présente pour la courte durée ;
- disponibilité initiale confirmée ;
- média principal traité et modéré ;
- responsable marché ayant approuvé.

### 11.3 Modifications après publication

**Nouvelle validation obligatoire** si le changement concerne : prix, capacité, nombre de pièces, type d'unité, meublé/non-meublé, durée, adresse, partenaire, droit de proposer, politique d'annulation, équipements essentiels ou médias qui changent la représentation du bien.

Les modifications mineures de texte peuvent être validées par un modérateur. Les modifications de prix ou de conditions n'affectent jamais rétroactivement une réservation déjà acceptée.

### 11.4 Suspension et retrait

Une annonce est suspendue en cas de : plainte sérieuse, droit de proposer expiré, indisponibilité non expliquée, divergence matérielle, suspicion de fraude, media non autorisé, ou danger apparent.

Une suspension retire l'annonce du feed et de la recherche, mais ne supprime pas les réservations/dossiers existants. Chaque dossier actif reçoit une tâche de traitement.

---

## 12. Médias et pipeline vidéo

### 12.1 Règles de capture

- Vidéo verticale recommandée 9:16 pour le feed ; images complémentaires paysage ou portrait.
- Résolution source recommandée 1080p si le téléphone le permet ; la plateforme ne doit pas rejeter automatiquement une vidéo 720p exploitable.
- Durée cible 20 à 90 secondes pour la vidéo principale ; clips complémentaires courts.
- L'agent filme l'unité réellement proposée, avec des séquences stables et représentatives.
- Les visages, plaques, documents, écrans, objets personnels et informations privées sont évités, masqués ou publiés sur base d'une autorisation valide.
- La musique commerciale non licenciée ne doit pas être ajoutée aux vidéos marketing.

### 12.2 États média

`LOCAL_DRAFT` → `UPLOAD_QUEUED` → `UPLOADING` → `UPLOADED` → `PROCESSING` → `READY_FOR_REVIEW` → `APPROVED` → `PUBLISHED`.

États d'erreur : `UPLOAD_FAILED`, `PROCESSING_FAILED`, `REJECTED_CONTENT`, `RIGHTS_REVOKED`, `ARCHIVED`.

### 12.3 Traitement technique

- téléversement reprenable par blocs ;
- checksum pour détecter un fichier incomplet ou dupliqué ;
- suppression des métadonnées EXIF inutiles, notamment coordonnées GPS intégrées aux photos diffusées ;
- génération de miniatures ;
- transcodage en plusieurs résolutions ;
- diffusion HTTP adaptative (HLS/DASH selon compatibilité retenue) ;
- CDN uniquement après validation du transfert de données si des données personnelles sont traitées hors RDC ;
- conservation de l'original dans un stockage privé ;
- médias optimisés servis publiquement par URL temporaire ou contrôlée selon sensibilité ;
- job asynchrone, reprise et file d'échec ;
- suppression ou retrait propagé aux caches/CDN selon procédure.

### 12.4 Versionnement

Chaque remplacement crée une nouvelle version média et garde une référence à l'ancienne, son auteur, date, raison et preuve de droits. Le media utilisé lors d'une réservation reste identifiable dans le snapshot de l'annonce.

---

## 13. Feed, découverte et recherche

### 13.1 Éligibilité au feed

Une annonce apparaît uniquement si : `PUBLISHED`, partenaire non suspendu, badge valide, conditions complètes, date de disponibilité non expirée et absence de blocage de modération.

### 13.2 Classement MVP

**Décision : pas de classement IA ni de personnalisation complexe au MVP.**

Ordre initial :

1. annonces publiées et éligibles ;
2. correspondance stricte aux filtres ;
3. tri par date de publication décroissante ;
4. rotation pour éviter l'affichage répétitif de plusieurs offres d'une même unité/immeuble à la suite ;
5. un éventuel contenu « mis en avant » est exclu du pilote, sauf si un produit sponsorisé est créé et identifié clairement.

Le système ne doit pas manipuler silencieusement le classement pour vendre une priorité.

### 13.3 Filtres P0

- commune ;
- quartier ;
- type de logement ;
- meublé / non-meublé / partiellement meublé ;
- courte durée / longue durée ;
- prix minimum et maximum en CDF ;
- nombre de chambres ;
- capacité d'occupation pour séjour ;
- disponibilité sur dates pour séjour ;
- équipements essentiels (eau, électricité, parking, Wi-Fi, climatisation, etc.).

### 13.4 Comportement en absence de résultats

- afficher « aucun logement correspondant aux filtres » ;
- proposer d'élargir commune/quartier ou prix ;
- conserver les filtres en mémoire de session ;
- ne pas montrer de logement qui ne respecte pas les critères sans le signaler.

### 13.5 Mesure vidéo

Événements analytiques P0 : `feed_impression`, `video_play`, `video_3s_view`, `video_25/50/75/100`, `listing_open`, `favorite_add/remove`, `contact_request`, `viewing_request`, `booking_request`, `share_click`, `report_listing`.

Une « vue qualifiée » recommandée est déclenchée après au moins 3 secondes de lecture active. Une impression est comptée lorsque le média est visible au moins 50 % pendant une seconde. Les lectures automatiques en arrière-plan ne doivent pas être comptées. Cette règle est un standard analytique interne, pas une mesure officielle d'audience.

### 13.6 Lecture vidéo et faible connectivité

- lecture automatique silencieuse par défaut ; contrôle son ;
- préchargement limité à la vidéo suivante (jamais tout le feed) ;
- choix de qualité automatique ; option économie de données ;
- poster/thumbnail avant lecture ;
- reprise si réseau interrompu ;
- aucune vidéo en lecture si l'app est en arrière-plan ;
- signaler un état de connexion lente sans bloquer la navigation vers la fiche texte.

Les statistiques nationales d'abonnements mobiles publiées pour le T2 2026 par l'ACP à partir de l'ARPTC ne doivent pas être interprétées comme autant de personnes uniques ou comme une garantie de débit à une adresse précise. Le rapport confirme toutefois l'importance de tester le produit sur plusieurs opérateurs, appareils et conditions de réseau à Kinshasa [S12].

---

## 14. Parcours des visites

### 14.1 Qui peut demander ?

Un client connecté peut demander une visite pour une annonce `PUBLISHED`, `LONG_TERM`, disponible ou avec disponibilité à reconfirmer, sans blocage. Le système peut aussi créer une demande assistée au téléphone par le service client ; l'agent saisit alors la demande avec la source et l'accord du client.

### 14.2 Informations obligatoires

- annonce/unité ;
- client ;
- nombre de visiteurs ;
- deux ou trois créneaux préférés ;
- motif/notes facultatives ;
- canal de contact préféré ;
- confirmation que le client a lu le prix et les charges.

La collecte de documents d'identité du candidat avant visite est exclue par défaut, sauf nécessité juridique démontrée et information claire.

### 14.3 Workflow

`REQUESTED` → `UNDER_SCHEDULING` → `PROPOSED_SLOT` → `AWAITING_CLIENT_CONFIRMATION` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`.

Sorties alternatives : `REJECTED`, `CANCELLED_BY_CLIENT`, `CANCELLED_BY_PARTNER`, `NO_SHOW_CLIENT`, `NO_SHOW_PARTNER`, `RESCHEDULE_REQUIRED`.

### 14.4 Règles

- La demande du client n'est pas une visite confirmée.
- Opérations vérifie le créneau avec le partenaire et l'agent accompagnateur.
- Le système bloque un agent sur deux rendez-vous simultanés incompatibles.
- Le client et le partenaire reçoivent la date, l'heure, le point de rencontre et les règles d'accès.
- L'adresse complète est partagée après confirmation, seulement avec les personnes nécessaires.
- Les visites sont gratuites au pilote ; aucun agent ne perçoit de frais sur place.
- Toute annulation impose un motif et une notification.
- Après visite, l'agent/service client saisit un résultat : intéressé, non intéressé, logement non conforme, partenaire absent, nouvelle visite demandée.

### 14.5 Retards et absences

Le client ou partenaire signale un retard. Le système enregistre l'heure. Après un délai opérationnel configurable (proposition : 15 minutes), l'agent peut marquer `NO_SHOW`, avec une tentative de contact et une preuve légère (journal d'appel/heure), sans exposer des enregistrements d'appels.

Une absence répétée du partenaire augmente son score de fiabilité et peut déclencher une suspension temporaire des créneaux.

---

## 15. Parcours de réservation de courte durée

### 15.1 Modèle de réservation

**Décision : réservation sur demande, jamais instantanée au MVP.** L'hôte doit confirmer la disponibilité, le prix et les conditions. Le client doit accepter ces conditions avant que la demande devienne confirmée.

### 15.2 Informations obligatoires

- unité/offre ;
- date et heure d'arrivée ;
- date et heure de départ ;
- nombre d'adultes et d'enfants si la politique l'exige ;
- nombre total d'occupants ;
- nom du titulaire de la réservation ;
- téléphone/canal de contact (après autorisation de traitement) ;
- prix total calculé à la date de la demande ;
- frais et caution distincts ;
- règles de séjour et d'annulation acceptées ;
- modalités de paiement direct au partenaire.

### 15.3 Calcul du prix

```text
prix_hébergement = somme(prix_par_nuit × nombre_de_nuits)
                  + suppléments d'occupants explicitement publiés

prix_total_affiché = prix_hébergement
                    + frais_de_ménage
                    + charges/frais obligatoires explicitement affichés

caution_remboursable = montant distinct, non inclus dans le prix_total
commission_NZUBU = taux_convenu_hôte × prix_hébergement réalisé
```

Toutes les lignes sont visibles avant l'envoi de la demande. Le calcul est effectué côté serveur. Le prix accepté est figé dans un snapshot à la confirmation.

### 15.4 Workflow et blocage de disponibilité

```text
DRAFT
  → REQUESTED (le client soumet ; aucune date n'est bloquée)
  → HOST_REVIEW
       ├── REJECTED_BY_HOST
       ├── EXPIRED_NO_RESPONSE
       └── HOST_ACCEPTED_TERMS
              → CUSTOMER_REVIEW
                   ├── DECLINED_BY_CUSTOMER
                   └── CUSTOMER_ACCEPTED
                          ├── PAYMENT_PENDING_EXTERNAL
                          │      ├── PAYMENT_DECLARED
                          │      │      ├── CONFIRMED (confirmation de l'hôte)
                          │      │      └── PAYMENT_DISPUTED
                          │      └── EXPIRED_PAYMENT
                          └── CONFIRMED_PAY_AT_PROPERTY
                                 (uniquement si l'hôte l'a activé)

CONFIRMED / CONFIRMED_PAY_AT_PROPERTY
  → CHECKED_IN
  → COMPLETED
  → (incident éventuel : DISPUTE_OPEN → RESOLVED)

États terminaux alternatifs : CANCELLED_BY_CUSTOMER, CANCELLED_BY_HOST,
EXPIRED, REJECTED_BY_HOST.
```

**Règle d'inventaire :** lors de `HOST_ACCEPTED_TERMS`, le serveur crée un blocage temporaire de 30 minutes pour les mêmes dates afin que le client puisse examiner et accepter les conditions. Si le client n'accepte pas dans le délai, le blocage expire et la demande passe en `EXPIRED`. Après acceptation du client, si une avance est exigée, les dates restent bloquées au maximum 2 heures pendant la vérification du paiement direct par l'hôte ; la demande passe par `PAYMENT_PENDING_EXTERNAL`, puis `PAYMENT_DECLARED` lorsque le client déclare le règlement. Seule la confirmation de l'hôte ou un retour vérifié du prestataire permet d'atteindre `CONFIRMED`. À défaut de confirmation dans le délai, le blocage expire et la demande devient `EXPIRED_PAYMENT` ; un paiement tardif ouvre un dossier manuel et ne réactive pas automatiquement les dates. Si l'hôte a activé la modalité « paiement à l'arrivée », la réservation peut passer en `CONFIRMED_PAY_AT_PROPERTY`, distinct d'un paiement reçu. Le client voit clairement cette distinction. Les confirmations et verrous se font dans une transaction atomique côté serveur.

**Séparation obligatoire :** état de réservation, état du paiement externe et état de la facture de commission NZUBU sont trois objets distincts. `CONFIRMED` ne signifie pas « encaissé par NZUBU » et la commission NZUBU n'est pas prélevée sur l'avance de l'hôte.

### 15.5 Règles de durée

- Les séjours doivent avoir au moins une nuit.
- La durée minimale/maximale est déclarée et acceptée pour chaque offre.
- Les heures d'arrivée et de départ sont stockées avec le fuseau `Africa/Kinshasa`.
- La date de départ ne compte pas comme nuit supplémentaire.
- Toute extension est une nouvelle demande ; elle n'est confirmée qu'après disponibilité et prix acceptés.
- Un dépassement de capacité déclenche un rejet automatique ou une nouvelle proposition, jamais une acceptation silencieuse.

### 15.6 Double réservation et concurrence

- Un seul verrou exclusif peut exister sur la même unité et la même période.
- Une réservation confirmée sur une offre bloque les autres offres partageant la même unité.
- Deux clients simultanés sont traités par transaction base de données/contrainte d'exclusion ; le plus tardif reçoit un message « dates devenues indisponibles ».
- Un paiement signalé après expiration ne réactive pas automatiquement la réservation : une action humaine et la confirmation du partenaire sont requises.
- Les requêtes de confirmation utilisent une clé d'idempotence pour éviter les doublons de clic, de réseau ou de webhook.

### 15.7 Check-in et check-out

- L'hôte confirme le check-in avec horodatage.
- Le client peut signaler une non-conformité dans les 2 heures suivant l'accès, avec photos/vidéo et description. Ce délai est une règle opérationnelle proposée à valider, pas une renonciation aux droits légaux.
- L'hôte confirme le check-out ; le client peut déposer une note et un signalement.
- Le dossier conserve les états, preuves et échanges.
- La commission de NZUBU est calculée uniquement après `COMPLETED`, sauf clause distincte validée pour une annulation avec frais conservés.

### 15.8 Annulation et non-conformité

- Chaque annonce courte durée référence une politique versionnée.
- Les annulations sont possibles selon la politique acceptée.
- Toute annulation partenaire déclenche une tâche urgente de relogement ou de remboursement direct.
- Toute plainte de divergence importante ouvre un ticket lié à la réservation et à l'instantané de la fiche.
- Le support ne promet pas un remboursement qu'il n'a pas autorité à exécuter.
- Si le prix est payé directement à l'hôte, la preuve de remboursement provient de l'hôte et est marquée comme telle.

---

## 16. Parcours de location longue durée

### 16.1 Périmètre au MVP

Le MVP couvre la recherche, la demande d'information, la visite, le dossier d'intérêt, la décision du bailleur, la préparation du bail, la signature en présence de l'agence compétente, le suivi des formalités et la remise des clés.

**Le MVP ne gère pas** les paiements mensuels de loyer, relances, renouvellements, maintenance, états de compte locataire, contentieux d'expulsion ou gestion intégrale du bien après l'entrée.

### 16.2 Informations d'un dossier locatif

Au départ : identité et contact du client, annonce, budget déclaré, date d'entrée souhaitée, composition du foyer ou nombre d'occupants si pertinent, créneaux de visite et observations. Les documents financiers/personnels supplémentaires ne sont demandés qu'au stade où le bailleur les justifie, et après définition d'une base légale et d'une durée de conservation.

### 16.3 Workflow

```text
INQUIRY_RECEIVED
  → VIEWING_REQUESTED
  → VIEWING_COMPLETED
  → INTEREST_CONFIRMED_BY_CANDIDATE
  → APPLICATION_SUBMITTED (si le bailleur le demande)
  → LANDLORD_DECISION
       ├── DECLINED
       ├── MORE_INFORMATION_REQUIRED
       └── ACCEPTED_IN_PRINCIPLE
              → COMMERCIAL_TERMS_RECORDED
              → LEASE_DRAFT_PREPARED
              → LEGAL_REVIEW_IF_REQUIRED
              → SIGNING_SCHEDULED
              → SIGNED_BY_LANDLORD_AND_TENANT
              → REGISTRATION_SUBMITTED
              → REGISTERED / REGISTRATION_EXCEPTION
              → HANDOVER_SCHEDULED
              → HANDOVER_COMPLETED
              → CLOSED
```

### 16.4 Conditions contractuelles et juridiques

La Loi n°15/025 prévoit que le bail est écrit, signé par les parties, contient les informations essentielles (parties, description, locaux/équipements, loyer, durée, résiliation, préavis, garantie), et doit être présenté à l'enregistrement dans les 30 jours en trois exemplaires [S1]. L'arrêté relatif au contrat type prévoit un modèle unique et la signature du bailleur et du preneur en présence d'une agence immobilière compétente enregistrée et agréée ; les modalités de légalisation et le service compétent doivent être confirmés localement [S3].

Conséquences produit :

- Le bailleur et le preneur sont les parties au bail.
- NZUBU enregistre sa qualité d'agence/intermédiaire et sa présence lorsque les conditions réglementaires sont réunies.
- Le système ne présente pas le bail numérique généré comme substitut automatique au livret/modèle officiel ou à l'enregistrement.
- La version scannée du document signé peut être jointe comme preuve de dossier ; l'original et les exemplaires officiels sont gérés selon le processus validé par l'Habitat.
- Un champ `registration_deadline = signed_at + 30 days` crée une tâche de suivi ; l'enregistrement final est marqué par preuve.
- L'état des lieux contradictoire de début et de fin est prévu par l'article 17 de la Loi 15/025 [S1]. Le MVP peut enregistrer le procès-verbal de début et sa preuve, mais le suivi de sortie est hors périmètre si NZUBU n'est pas mandaté pour la gestion.

### 16.5 Frais, garantie et prix

- Le loyer est affiché en CDF et périodicité explicite.
- La garantie résidentielle est plafonnée à trois mois de loyer selon l'article 18 de la Loi 15/025 ; le back-office rejette toute valeur supérieure.
- Le système enregistre le payeur de l'honoraire d'agence à partir de la preuve de la demande de service ; le montant de référence est un mois de loyer selon l'article 10.
- Le système n'offre pas de champ « avance obligatoire de 6/12 mois » pour le bail résidentiel en raison de l'article 22 ; une clause particulière doit être examinée par le juriste, sans être transformée en règle automatique.
- Loyer, garantie et honoraires d'agence sont trois lignes distinctes. Le montant à payer au bailleur n'est jamais confondu avec le revenu de NZUBU.

### 16.6 Réservation temporaire d'un bien en négociation

Une longue location n'est pas considérée comme conclue parce qu'un candidat a cliqué « intéressé ». Le statut public passe à `UNDER_NEGOTIATION` seulement après acceptation de principe écrite du bailleur et confirmation de l'intérêt par le candidat.

**Blocage provisoire proposé : 72 heures**, renouvelable une seule fois par le responsable marché avec justification. Si aucun contrat n'est signé dans le délai, le bien revient à `AVAILABLE` après confirmation du bailleur. Le statut et le délai sont visibles dans le back-office ; le feed ne présente plus l'annonce comme immédiatement disponible.

### 16.7 Sortie du périmètre

À `HANDOVER_COMPLETED`, NZUBU clôt le dossier de transaction. Toute demande ultérieure de quittance, encaissement de loyer, renouvellement, réparation, état des lieux de sortie ou gestion de contentieux est renvoyée au bailleur/locataire, sauf nouveau mandat et nouveau module de gestion immobilière.

---

## 17. Disponibilités, prix et conflits

### 17.1 Source de vérité

- Le partenaire est responsable de déclarer ses disponibilités et changements.
- Le responsable marché/NZUBU contrôle et peut demander confirmation.
- Le système fait foi pour les réservations qu'il a confirmées et les blocages qu'il a posés.
- Un calendrier externe n'est pas source de vérité au MVP.

### 17.2 Fraîcheur de disponibilité

- Courte durée : calendrier mis à jour en continu ; l'hôte confirme les dates à chaque demande avant acceptation.
- Longue durée : disponibilité reconfirmée au plus tard tous les 7 jours ou au moment d'une demande de visite.
- Si aucune confirmation dans le délai, le statut devient `NEEDS_RECONFIRMATION` et l'annonce ne doit pas afficher « disponible aujourd'hui ».

### 17.3 Prix modifié pendant une demande

Le prix accepté par le client est un snapshot horodaté. Toute nouvelle modification s'applique uniquement aux demandes futures. Pour une demande non confirmée, le partenaire peut proposer un nouveau prix, mais le client doit l'accepter explicitement.

### 17.4 Vente ou location hors plateforme

Le partenaire doit déclarer qu'une unité est devenue indisponible, même si la transaction s'est conclue hors NZUBU. Le système conserve la source de l'information et ferme les demandes ouvertes. Une non-déclaration répétée déclenche avertissement et suspension.

### 17.5 Conflits simultanés

Tous les blocages et confirmations de périodes sont réalisés sur le serveur dans une transaction atomique. Le client ne peut pas contourner la règle avec une version d'application ancienne ou en rejouant une requête.

---

## 18. Service client, signalements et litiges

### 18.1 Catégories de tickets

- compte / connexion ;
- annonce inexacte ;
- problème de vérification ;
- demande de visite ;
- réservation / disponibilité ;
- paiement direct au partenaire ;
- annulation / remboursement ;
- non-conformité à l'arrivée ;
- comportement abusif / sécurité ;
- suppression des données ;
- partenaire / facture de commission.

### 18.2 Informations d'un ticket

`ticket_id`, demandeur, réservation/annonce liée, catégorie, priorité, description, pièces, canal, responsable, date d'ouverture, SLA, historique, décision et date de clôture.

### 18.3 Priorités

| Priorité | Exemple | Traitement proposé |
|---|---|---|
| P0 — Urgence sécurité | Menace, entrée impossible dans un logement payé, risque corporel | Accusé immédiat pendant les heures de support ; escalade au responsable opérations/direction |
| P1 — Transaction critique | Double réservation, partenaire absent le jour d'arrivée, paiement contesté | Traitement prioritaire dans l'heure ouvrable cible |
| P2 — Service | Annulation ordinaire, disponibilité, équipement non conforme | Première réponse sous 1 jour ouvrable |
| P3 — Information | Question sur une annonce, compte ou fonctionnement | Réponse sous 2 jours ouvrables |

Ces SLA sont des objectifs internes proposés et doivent correspondre aux horaires, effectifs et canaux réellement ouverts.

### 18.4 Procédure d'incident

1. réception et classification ;
2. protection immédiate des personnes et blocage de l'annonce si nécessaire ;
3. collecte des éléments contradictoires ;
4. consultation du snapshot de l'annonce et des conditions acceptées ;
5. demande de réponse au partenaire ;
6. décision par personne habilitée ;
7. notification aux parties ;
8. fermeture et cause racine ;
9. action préventive : re-vérification, avertissement, suspension ou formation.

Le service client ne doit pas divulguer l'identité, le numéro ou les justificatifs d'une partie à l'autre en dehors des besoins du dossier.

---

---

## 19. Notifications, communications et avis

### 19.1 Matrice de notifications

| Événement | Destinataire | Canal MVP | Message/action |
|---|---|---|---|
| Inscription/connexion | Utilisateur | SMS OTP après autorisation | Code à usage unique ; aucune donnée sensible dans le message |
| Demande de visite reçue | Client | Push + centre de notifications | Demande reçue, pas encore confirmée |
| Visite confirmée/modifiée | Client, partenaire, agent | Push + SMS si nécessaire | Date, heure, point de rendez-vous et action attendue |
| Visite annulée | Parties concernées | Push + SMS si nécessaire | Motif et lien de replanification |
| Demande de réservation reçue | Hôte et client | Push + tableau partenaire | Délai de réponse ; pas encore une réservation confirmée |
| Conditions proposées par hôte | Client | Push | Prix/conditions à accepter avant expiration du blocage |
| Réservation confirmée | Client et hôte | Push + e-mail facultatif | Numéro de réservation, dates, paiement et consignes |
| Paiement déclaré/confirmé | Client, hôte, finance selon cas | Push | Préciser le niveau de preuve : déclaré, confirmé par hôte ou confirmé par prestataire |
| Check-in/check-out | Client et hôte | Push | Confirmation et lien de signalement |
| Dossier partenaire incomplet | Partenaire | E-mail/push | Liste des pièces manquantes |
| Mission assignée | Agent, opérations | Push | Mission, date et consignes |
| Rapport terrain soumis | Opérations, responsable marché | Notification interne | Rapport prêt à examiner |
| Annonce publiée/suspendue | Partenaire | Push/e-mail | Motif et action possible |
| Ticket mis à jour | Client/partenaire concerné | Push/e-mail | Statut et réponse |
| Facture de commission | Partenaire/finance | E-mail + portail | Montant CDF, échéance, détail du calcul |

Chaque notification est reliée à un événement et possède un identifiant unique. Le système conserve : destinataire, canal, template/version, date, statut d'envoi, réponse du prestataire et nombre de tentatives.

### 19.2 Langues et contenu

- Langue de référence du MVP : français.
- Les messages destinés au grand public doivent employer des termes simples, éviter les termes juridiques non expliqués et distinguer clairement « demande reçue », « acceptée par l'hôte » et « réservation confirmée ».
- Lingala peut être ajouté pour certaines notifications ou le service client après validation éditoriale ; il ne doit pas devenir une traduction approximative de clauses contractuelles.
- Les montants sont formatés en CDF avec séparateurs cohérents.

### 19.3 Avis et réputation

Les avis sont autorisés uniquement après une visite réalisée ou un séjour terminé, selon le type d'expérience.

Règles P0 :

- un seul avis par dossier et par compte client ;
- note et commentaire optionnel ;
- pas d'avis anonyme ;
- modération des injures, menaces, données personnelles et contenus non pertinents ;
- le partenaire peut répondre une fois ;
- l'équipe peut masquer provisoirement, mais doit enregistrer le motif ;
- un avis négatif ne peut pas être supprimé uniquement parce que le partenaire le conteste ;
- les avis ne constituent pas une preuve juridique de fraude sans examen complémentaire.

---

## 20. Interfaces à produire et états d'écran

### 20.1 Application Android client

1. Splash / onboarding / consentements ;
2. navigation principale : Feed, Recherche, Favoris, Demandes, Profil ;
3. feed vertical ;
4. filtres ;
5. résultats liste/carte ;
6. détail logement ;
7. galerie/médias ;
8. badge « vérifié » et détail des contrôles ;
9. demande de visite ;
10. demande de réservation ;
11. récapitulatif prix/conditions ;
12. acceptation des conditions ;
13. état de paiement direct ;
14. historique des visites/réservations ;
15. détail d'un dossier ;
16. notifications ;
17. signalement/ticket ;
18. profil et paramètres ;
19. suppression de compte ;
20. centre d'aide.

### 20.2 Back-office Web

1. connexion interne avec MFA ;
2. tableau de bord par rôle ;
3. file des nouveaux partenaires ;
4. détail partenaire et justificatifs ;
5. file des logements ;
6. fiche logement interne ;
7. détection de doublons ;
8. planification calendrier et carte des missions ;
9. écran d'affectation agent ;
10. rapport de mission et preuves ;
11. revue/validation marché ;
12. gestion des médias ;
13. calendrier de disponibilité ;
14. visites ;
15. demandes de réservation ;
16. dossiers longue durée ;
17. finance/factures/rapprochement ;
18. support/tickets ;
19. modération/avis ;
20. utilisateurs, rôles et permissions ;
21. référentiel territorial ;
22. journal d'audit ;
23. paramètres de politiques, tarifs et commissions ;
24. reporting.

### 20.3 Espace partenaire

- tableau de bord ;
- profil et mandat ;
- logements et offres ;
- justificatifs ;
- prix/charges ;
- disponibilités ;
- demandes de visite ;
- demandes de réservation ;
- conditions acceptées ;
- déclarations de paiement ;
- factures NZUBU ;
- réclamations ;
- utilisateurs et rôles de l'entreprise partenaire.

### 20.4 PWA agents terrain

- connexion et sécurité ;
- missions assignées ;
- fiche d'accès ;
- carte/repère ;
- checklist adaptée au type de logement ;
- capture photo ;
- chargement vidéo reprenable ;
- notes/observations ;
- signature/confirmation de présence du partenaire si utile ;
- brouillons hors connexion ;
- file de synchronisation ;
- rapport final et historique.

### 20.5 États universels à designer

Chaque écran de lecture/écriture doit avoir :

- chargement ;
- état vide ;
- succès ;
- erreur réseau ;
- erreur validation ;
- accès refusé ;
- contenu indisponible ;
- session expirée ;
- conflit de modification ;
- synchronisation en attente ;
- action en cours ;
- confirmation avant action irréversible.

Le design ne peut pas présenter une action « enregistrée » si la requête serveur n'a pas confirmé son succès. Un brouillon local doit porter l'état « non synchronisé ».

---

# PARTIE II — DONNÉES, ARCHITECTURE ET SPÉCIFICATIONS TECHNIQUES

## 21. Modèle de données conceptuel

Le modèle exact sera finalisé par l'architecte et le DBA pendant le sprint d'architecture. Les entités suivantes sont obligatoires pour soutenir les règles produit.

### 21.1 Entités principales

| Domaine | Entités |
|---|---|
| Identité | `User`, `UserProfile`, `UserRole`, `StaffAccount`, `Session`, `OtpChallenge`, `ConsentRecord` |
| Partenaires | `Partner`, `PartnerMember`, `PartnerMandate`, `PartnerDocument`, `PartnerAgreement`, `PayoutProfile` (profil de paiement du partenaire, pas un wallet) |
| Immobilier | `Property`, `Building`, `Unit`, `Room`, `SharedSpace`, `Equipment`, `TerritorialArea` |
| Offre | `Listing`, `ListingVersion`, `PriceRule`, `Fee`, `HouseRule`, `CancellationPolicy`, `AvailabilityCalendar`, `AvailabilityBlock` |
| Vérification | `VerificationCase`, `VerificationChecklistItem`, `VerificationEvidence`, `InspectionReport`, `VerificationDecision` |
| Terrain | `FieldMission`, `AgentAssignment`, `MissionEvent`, `FieldReport`, `UploadTask` |
| Média | `MediaAsset`, `MediaVersion`, `MediaProcessingJob`, `MediaRightsConsent`, `MediaModeration` |
| Découverte | `Favorite`, `SearchEvent`, `FeedEvent`, `ListingImpression`, `VideoPlaybackEvent` |
| Visites | `ViewingRequest`, `ViewingSlot`, `Viewing`, `ViewingOutcome` |
| Courte durée | `BookingRequest`, `Booking`, `BookingGuest`, `BookingSnapshot`, `StayEvent`, `ExternalPaymentEvidence` |
| Longue durée | `RentalCase`, `CandidateApplication`, `LandlordDecision`, `LeaseDocument`, `LeaseEvent`, `HandoverReport` |
| Finance | `CommissionAgreement`, `CommissionAccrual`, `Invoice`, `InvoiceLine`, `PaymentRecord`, `Reconciliation`, `RefundCase` |
| Support | `SupportTicket`, `TicketMessage`, `TicketAttachment`, `Complaint`, `ModerationAction` |
| Sécurité | `AuditLog`, `AccessGrant`, `AccessReview`, `SecurityIncident` |

### 21.2 Relations essentielles

- Un `Partner` possède plusieurs `PartnerMember` et plusieurs mandats.
- Un `PartnerMandate` lie un proposant à un propriétaire/une unité pour un ensemble de pouvoirs et une durée.
- Une `Property` peut contenir plusieurs `Building` ; un `Building` plusieurs `Unit`.
- Une `Unit` possède plusieurs `Listing` historiques, mais seulement les offres actives autorisées et compatibles.
- Une `Listing` possède plusieurs `ListingVersion`, `MediaAsset`, `AvailabilityBlock` et `VerificationCase`.
- Une `FieldMission` concerne une seule unité et peut avoir plusieurs événements, mais un agent principal responsable.
- Une `Booking` référence une version précise de l'annonce, des prix et conditions acceptés.
- Une `RentalCase` référence le candidat, le bailleur, l'unité et le document de bail final.
- Une `CommissionAccrual` est produite à partir d'un événement commercial et d'un accord partenaire daté.
- Un `PaymentRecord` est un enregistrement de règlement ou de preuve ; il ne crée pas de solde client à conserver.

### 21.3 Contraintes de base de données

- identifiants UUID ;
- montants en entier CDF, jamais en float ;
- horodatages UTC en base et affichage `Africa/Kinshasa` ;
- unicité d'une réservation confirmée par unité et période incompatible ;
- transactions atomiques pour verrou de dates et confirmation ;
- clés d'idempotence pour endpoints de création/confirmation ;
- historique de versions pour prix, conditions, mandat et annonce ;
- clés étrangères et contraintes de suppression ;
- journal d'audit append-only ;
- documents sensibles dans stockage privé, jamais dans un répertoire public ;
- coordonnées exactes et données de partenaire accessibles uniquement aux rôles autorisés.

---

## 22. API et contrats d'intégration

### 22.1 Style API

**Décision technique proposée : REST/JSON versionné `/api/v1`, documenté OpenAPI.** GraphQL et microservices ne sont pas nécessaires au premier lancement.

Chaque endpoint doit préciser : authentification, rôles autorisés, validations, codes d'erreur, idempotence, effet de bord et événement généré.

### 22.2 Principaux groupes d'API

| Domaine | Exemples d'opérations |
|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/logout` |
| Utilisateurs | `GET /me`, `PATCH /me`, `POST /me/delete-request` |
| Recherche | `GET /listings`, `GET /listings/{id}`, `GET /areas` |
| Favoris | `GET /favorites`, `POST /favorites`, `DELETE /favorites/{id}` |
| Partenaires | `POST /partners`, `POST /partners/{id}/documents`, `GET /partners/{id}/status` |
| Logements | `POST /units`, `PATCH /units/{id}`, `POST /units/{id}/submit` |
| Vérification | `POST /verifications`, `POST /verifications/{id}/decision` |
| Missions | `POST /missions`, `POST /missions/{id}/assign`, `POST /missions/{id}/report` |
| Média | `POST /media/upload-session`, `POST /media/{id}/complete`, `GET /media/{id}/status` |
| Annonces | `POST /listings`, `POST /listings/{id}/publish`, `POST /listings/{id}/suspend` |
| Visites | `POST /viewings`, `POST /viewings/{id}/propose-slot`, `POST /viewings/{id}/confirm` |
| Réservations | `POST /booking-requests`, `POST /booking-requests/{id}/accept`, `POST /bookings/{id}/confirm` |
| Longue durée | `POST /rental-cases`, `POST /rental-cases/{id}/decision`, `POST /rental-cases/{id}/lease` |
| Finance | `GET /invoices`, `POST /payments/evidence`, `POST /reconciliations` |
| Support | `POST /tickets`, `POST /tickets/{id}/messages`, `POST /tickets/{id}/close` |
| Analytics | endpoints internes agrégés, sans exposition d'identifiants directs |

### 22.3 Codes d'erreur métier

- `VALIDATION_ERROR` : champ manquant ou format invalide ;
- `FORBIDDEN` : rôle ou périmètre insuffisant ;
- `NOT_FOUND` : objet non visible/non existant ;
- `LISTING_NOT_PUBLISHABLE` : condition de publication non satisfaite ;
- `VERIFICATION_EXPIRED` : badge ou contrôle expiré ;
- `AVAILABILITY_CONFLICT` : période indisponible ;
- `PRICE_CHANGED` : nouvelle proposition nécessaire ;
- `BOOKING_EXPIRED` : demande ou blocage expiré ;
- `PAYMENT_UNVERIFIED` : preuve déclarative, pas encore confirmée ;
- `MANDATE_EXPIRED` : mandat arrivé à terme ;
- `DATA_RIGHTS_PENDING` : formalité de données non terminée ;
- `PROVIDER_UNAVAILABLE` : service externe indisponible.

### 22.4 Webhooks et prestataires

Chaque webhook doit :

- vérifier la signature du prestataire ;
- être idempotent ;
- conserver l'identifiant externe ;
- être horodaté ;
- être rejouable de manière sûre ;
- ne jamais considérer un simple retour navigateur comme preuve de paiement ;
- rapprocher la transaction avec montant, devise, référence, bénéficiaire et statut ;
- traiter les statuts inconnus en `PENDING_REVIEW`, pas en succès.

---

## 23. Architecture technique recommandée

### 23.1 Architecture applicative

**Décision de conception proposée : monolithe modulaire + service média asynchrone.** Éviter les microservices au lancement.

```text
ANDROID CLIENT (Flutter)
        │
        ├──────────────┐
        │              │
BACK-OFFICE WEB     PARTNER / AGENT PWA
(Next.js)           (Next.js responsive)
        │              │
        └────── API REST /v1 ──────┘
                        │
             BACKEND MODULAIRE (NestJS)
                        │
  ┌─────────────────────┼─────────────────────┐
  │                     │                     │
PostgreSQL/PostGIS   Redis/Queue          Object Storage
  │                     │                     │
  │             Worker média / FFmpeg      CDN* / HLS
  │                     │
  └──── Notifications / Paiements / SMS / E-mail

* CDN externe seulement après validation des transferts de données concernés.
```

### 23.2 Stack proposée

| Couche | Proposition | Motif |
|---|---|---|
| Mobile | Flutter | Base Android et possibilité de réutilisation iOS ; performant pour le feed si le lecteur est correctement implémenté |
| Back-office et PWA | Next.js / React / TypeScript | Interface Web commune, responsive, composants réutilisables |
| Backend | NestJS / TypeScript | Architecture modulaire, validation stricte, API REST et intégrations |
| Base relationnelle | PostgreSQL | Transactions, cohérence et contraintes relationnelles |
| Géospatial | PostGIS | Recherche par commune, proximité et coordonnées |
| Cache/queue | Redis + worker/queue | Cache, tâches média et jobs asynchrones |
| Média | Stockage objet S3-compatible + FFmpeg | Upload reprenable, stockage privé et transcodage |
| Vidéo | HLS + CDN | Lecture adaptative ; CDN après analyse des transferts internationaux |
| Conteneurs | Docker | Environnements reproductibles |
| CI/CD | GitHub Actions ou GitLab CI/CD | Tests, builds, déploiements contrôlés |
| Monitoring | OpenTelemetry + outil compatible Prometheus/Grafana ou service managé | Traces, métriques, alertes |

Le choix final est validé après preuve de faisabilité des services d'hébergement conformes aux exigences de localisation des données. La stack est une recommandation d'agence ; elle peut être modifiée par le Tech Lead si le coût total de possession, les compétences disponibles ou les exigences locales l'imposent.

### 23.3 Hébergement et localisation des données

Le Code du numérique prévoit le stockage/hébergement des données personnelles en RDC et encadre le transfert vers un État tiers, notamment par une appréciation du niveau de protection et une autorisation préalable [S4].

Avant de choisir le cloud, l'équipe doit dresser une cartographie exacte : base primaire, sauvegardes, réplication, stockage objet, CDN, logs, analytics, support fournisseur, SMS/OTP, e-mail, notifications push et outils de crash reporting.

**Règle de déploiement :** aucun service ne doit être activé en production avec des données personnelles si sa localisation et son rôle de sous-traitant ne sont pas documentés et validés. Une région cloud située hors RDC n'est pas présumée licite simplement parce que le fournisseur est connu.

### 23.4 Environnements

- `local` : développement, données fictives ;
- `dev` : intégration continue, jeux de test ;
- `staging` : recette avec données synthétiques ;
- `production` : données réelles, accès limités, sauvegardes et alertes.

Aucun dump de production n'est copié dans `dev` ou `staging` sans anonymisation et base légale claire.

### 23.5 Stockage média

- originaux en privé ;
- versions publiées dans un espace de diffusion séparé ;
- URLs signées ou accès limité pour les justificatifs ;
- vidéos publiques dépourvues de métadonnées sensibles ;
- séparation entre médias de logements et documents personnels ;
- politique de conservation par catégorie.

### 23.6 Exploitation et continuité

- sauvegarde quotidienne complète et sauvegardes incrémentales adaptées ;
- test de restauration au moins trimestriel avant montée en charge ;
- procédure de retour arrière applicatif ;
- journaux centralisés sans secrets ni OTP ;
- alertes sur taux d'erreur, queue bloquée, stockage saturé, échec vidéo, paiement incohérent et indisponibilité API ;
- personne d'astreinte nommée, même si elle n'est pas 24/7 au pilote ;
- procédure de communication utilisateur en cas de panne.

---

## 24. Exigences non fonctionnelles

Les exigences suivantes sont des cibles de recette à confirmer avec le budget et l'hébergement retenus.

| Domaine | Exigence MVP | Méthode de vérification |
|---|---|---|
| Compatibilité Android | Supporter une matrice de terminaux Android convenue, dont téléphones d'entrée/milieu de gamme utilisés au pilote | Tests sur appareils réels ; liste versionnée |
| Réseau | Navigation texte utilisable sur connexion faible/intermittente ; upload vidéo reprenable | Tests 2G/3G simulés lorsque possible, perte réseau et reprise |
| Feed | Afficher immédiatement une miniature puis démarrer une lecture de qualité adaptée | Mesure TTFB et démarrage vidéo sur réseau de référence |
| Recherche | P95 < 1,5 s sur le jeu de charge pilote, hors services externes | Test de charge API |
| API lecture | P95 < 800 ms pour endpoints simples du backend, sous charge cible | APM et test de performance |
| Vidéo | Traitement standard d'une vidéo source dans un délai cible de 2 à 5 minutes selon longueur et infrastructure | Mesure pipeline ; alerte en dépassement |
| Disponibilité | Objectif initial de 99,5 % mensuel hors maintenance planifiée | Monitoring externe et registre incidents |
| Sécurité | Aucun défaut critique/haut non corrigé avant pilote | Rapport de scan/pentest et preuve de correction |
| Données | Sauvegarde quotidienne ; RPO/RTO cibles définis avant contrat d'hébergement | Test de restauration |
| Accessibilité | Taille lisible, contraste, libellés, navigation simple et alternatives au média | Checklist UX/accessibilité |
| Audit | Toute action financière ou de permission conserve une trace | Tests d'audit |
| Scalabilité | Capacité à augmenter les ressources et le nombre d'instances sans refonte du modèle métier | Test de montée en charge |

**RPO proposé :** 24 heures maximum au pilote pour les données applicatives non financières ; toute transaction externe doit être journalisée de manière durable dès réception. **RTO proposé :** 8 heures maximum au pilote. Ces objectifs doivent être confirmés par le plan de continuité, le fournisseur d'hébergement et les capacités réelles de l'équipe.

---

---

# PARTIE III — CONFORMITÉ, EXPLOITATION ET RECETTE

## 25. Contraintes juridiques et réglementaires à intégrer au produit

Cette section constitue un cadrage opérationnel fondé sur les textes consultés au 4 novembre 2026. Elle ne remplace pas un avis écrit d'un avocat congolais ni les instructions de l'administration compétente.

### 25.1 Activité d'intermédiation immobilière

La Loi n°15/025 définit l'agence immobilière comme une entreprise mettant en rapport bailleur et preneur pour permettre la location ou la vente. L'arrêté ministériel n° CAB/MIN.UH/015/2017 organise les fonctions d'agence, d'agent et de courtier immobilier et prévoit qu'on ne peut agir comme intermédiaire immobilier sans agrément du ministère compétent [S1, S2].

**Action pré-lancement :** obtenir un avis écrit sur la qualification exacte de NZUBU, l'agrément de la société, les conditions applicables aux agents et au responsable/courtier, ainsi que les pièces et frais à jour. La société doit vérifier les exigences de statuts, RCCM, identification nationale, siège, capital et liste déclarative du personnel mentionnées dans l'arrêté [S2].

**Règle système :** le compte entreprise possède un champ `real_estate_approval_status`. Tant que ce statut n'est pas `VALIDATED`, le logiciel peut fonctionner en test, mais les parcours de transaction d'intermédiation ne sont pas ouverts en production.

### 25.2 Bail résidentiel de longue durée

La Loi n°15/025 du 31 décembre 2015 prévoit notamment :

- contrat écrit, sous seing privé ou notarié ;
- données essentielles du bail : identification des parties, description, destination, équipements, loyer, termes de paiement, durée, résiliation, préavis et garantie ;
- présentation pour enregistrement dans les 30 jours, en trois exemplaires ;
- honoraires d'agence correspondant à un mois de loyer à la charge de la personne qui a sollicité les services ; partage par moitié lorsque les deux parties ont simultanément saisi la même agence ;
- garantie locative résidentielle plafonnée à trois mois ;
- paiement du loyer en monnaie ayant cours légal en RDC ;
- interdiction au bailleur d'exiger le paiement anticipatif du loyer ;
- état des lieux contradictoire au début et à la fin du bail [S1].

L'arrêté ministériel relatif au contrat de bail type rend le contrat modèle et le livret de bail obligatoires dans les cas couverts, prévoit la signature du bailleur et du preneur en présence de l'agence compétente enregistrée et agréée, et décrit les formalités liées à l'Habitat [S3]. Les services compétents, les modèles et la pratique d'enregistrement doivent être confirmés à Kinshasa avant la mise en production.

**Décisions logiciel :** bailleur et preneur sont parties au bail ; NZUBU enregistre son rôle d'agence/intermédiaire et ne devient pas automatiquement troisième partie ; le système génère un dossier et une checklist, mais le document officiel et son enregistrement demeurent les références juridiques.

### 25.3 Hébergement touristique et courte durée

La Loi n°18/018 du 9 juillet 2018 relative aux principes fondamentaux du tourisme mentionne parmi les activités touristiques l'exploitation d'établissements d'hébergement ; son article 19 inclut notamment les hôtels, gîtes, hébergement chez l'habitant, flats, motels et guest-houses. Les articles 27 à 34 encadrent les autorisations, actes d'exploitation, classifications et contrôles selon la nature de l'activité [S6].

**Point de prudence :** il n'est pas exact de conclure, à partir de cette seule loi, que chaque propriétaire qui loue occasionnellement un appartement meublé est automatiquement soumis au même régime de licence hôtelière. La qualification dépend notamment de la nature réelle de l'activité et de la catégorie d'hébergement. Le catalogue des services publics décrit certaines licences hôtelières pour des catégories précises, mais cela ne répond pas à lui seul au statut de tous les appartements meublés [S7].

**Action pré-lancement :** demander au ministère du Tourisme / service provincial une détermination écrite pour : (a) l'hôte individuel qui met un appartement à disposition pour quelques nuits ; (b) l'exploitant qui gère plusieurs appartements ; (c) la plateforme qui commercialise et organise des réservations ; (d) les documents et classifications requis pour chacun.

**Règle système :** ajouter au partenaire et à l'offre un champ `tourism_compliance_status` (`NOT_APPLICABLE_PENDING_REVIEW`, `PENDING`, `DOCUMENTED`, `REJECTED`). Les annonces courtes durées ne sont publiées que si le statut applicable est validé par le responsable conformité.

### 25.4 Données personnelles — Code du numérique

L'Ordonnance-loi n°23/010 du 13 mars 2023 portant Code du numérique s'applique aux activités et services numériques et contient un livre sur la protection des données personnelles [S4].

Points essentiels pour NZUBU :

- Article 186 : principe de formalité préalable/déclaration des traitements auprès de l'autorité compétente.
- Article 187 : autorisation préalable pour certaines catégories, dont les numéros de téléphone cités comme identifiants de même nature, les données biométriques, certaines données sensibles et les transferts vers un pays tiers.
- Article 188 : informations à fournir dans le dossier, dont identité du responsable, finalités, catégories de données, accès, destinataires, sécurité, sous-traitants et transferts.
- Article 192 : traitement licite dans les conditions prévues, notamment consentement ou nécessité légale/contractuelle.
- Articles 193–194 : limitation des finalités, durée, sécurité, exactitude et proportionnalité des données.
- Article 201 : principe de stockage/hébergement en RDC ; les transferts vers un État tiers sont encadrés et nécessitent l'autorisation prévue par le texte [S4].

Une analyse spécialisée publiée en 2026 rapporte qu'une décision de procédure prise en 2025 a été publiée au Journal officiel en avril 2026 et que l'ARPTC exerce provisoirement certaines missions de protection des données dans l'attente de l'installation de l'autorité prévue par le Code [S5]. Le point de contact et la procédure de dépôt doivent être confirmés directement auprès de l'autorité et d'un conseil local avant tout traitement réel.

**Blocage technique explicite :** ne pas activer en production l'inscription par téléphone, OTP réel, collecte de coordonnées des partenaires ou SMS marketing avant d'avoir obtenu confirmation écrite des formalités et autorisations applicables. De même, ne pas transférer des données personnelles à l'étranger via cloud, SMS, e-mail, analytics, support, crash reports, CDN ou sauvegardes sans analyse et autorisation requises.

### 25.5 Données minimales et registre des traitements

Le responsable conformité/données doit tenir un registre couvrant au minimum :

| Traitement | Données | Finalité | Accès | Rétention proposée (à valider) |
|---|---|---|---|---|
| Compte client | Nom, téléphone, e-mail optionnel, identifiant interne | Compte et suivi des demandes | Client, support limité | Compte actif + délais légaux justifiés |
| Partenaire | Identité, contact, statut, mandat | Vérifier le droit de proposer et gérer le contrat | Opérations, marché, conformité | Contrat + délai de prescription applicable |
| Justificatifs | ID, certificat, mandat, RCCM le cas échéant | Vérification documentaire | Accès très restreint | Durée minimale à définir par avis juridique |
| Mission | Adresse, GPS, preuves terrain, agent | Inspection et affectation | Opérations, agent assigné, marché | Durée opérationnelle et preuve des contrôles |
| Réservation | Dates, occupants, prix, conditions, contacts | Exécution du séjour | Client, hôte concerné, support autorisé | Durée légale et litiges |
| Bail | Parties, contrat, montant, dates, enregistrement | Suivi du dossier de location | Marché, juridique, parties concernées | Obligations légales/contractuelles |
| Paiement | Référence, montant, statut, bénéficiaire | Rapprochement et preuve | Finance, parties habilitées | Obligations comptables et litiges |
| Analytics | Événements pseudonymisés | Mesure de l'usage | Data/Produit | Durée courte documentée |

Ne pas conserver un document d'identité « au cas où ». Les pièces sont supprimées ou archivées de façon restreinte au terme de la finalité et des obligations applicables.

### 25.6 Localisation, sous-traitants et transferts

La liste des sous-traitants doit inclure l'hébergeur, stockage objet, CDN, fournisseur OTP/SMS, e-mail, push, analytics, crash reporting, outil support et sauvegarde. Pour chacun : raison sociale, pays de stockage, pays d'accès support, données traitées, sous-traitance ultérieure, contrat, mesures de sécurité et mécanisme de transfert.

**Choix d'architecture imposé par la conformité :** hébergement primaire en RDC ou, si le fournisseur envisagé est hors RDC, aucune donnée personnelle n'y est transférée avant autorisation et validation prévues par le Code. L'équipe n'utilise pas un fournisseur international « par défaut » sans étude.

### 25.7 Paiements et monnaie électronique

La BCC présente les systèmes de paiement, les moyens de paiement et les prestataires de services de paiement comme un domaine soumis à sa surveillance [S8]. Les APIs marchandes M-Pesa et Airtel nécessitent onboarding et compte/accès de production [S9, S10].

**Position du MVP :** NZUBU achète des services marchands auprès d'un prestataire autorisé pour percevoir ses propres factures ; il ne crée pas un wallet, ne conserve pas le prix des séjours et ne réalise pas de reversement pour compte de tiers. Toute extension vers encaissement centralisé/split/escrow doit faire l'objet d'une étude réglementaire BCC, d'un contrat de prestataire et d'une validation juridique avant développement.

### 25.8 Monnaie et affichage des prix

La Loi 15/025 impose la monnaie ayant cours légal pour le paiement du loyer résidentiel. Une communication de la BCC rapportée en janvier 2026 rappelle également le principe de fixation, affichage et paiement des biens et services de consommation en CDF, sauf dérogation expresse [S1, S11].

**Règle de publication :** tous les montants des fiches, contrats et factures NZUBU sont en CDF au MVP. Le système n'accepte pas les libellés ambigus du type « 100 » sans devise ni période. Le format monétaire est uniforme dans tout le produit.

### 25.9 Propriété intellectuelle et contenus

- Le contrat partenaire contient une licence de diffusion du contenu et une déclaration de droit de proposer le logement.
- Les vidéos créées par un agent dans le cadre de son travail sont régies par le contrat de travail/prestation et la politique interne de propriété intellectuelle.
- Les musiques, images, marques et personnes représentées doivent avoir les droits nécessaires.
- Les données personnelles visibles dans une vidéo sont floutées ou supprimées.
- Le client ne peut pas télécharger/republier des médias s'il n'a pas reçu les droits correspondants.

---

## 26. Particularités pratiques du marché de Kinshasa à prendre en compte

Cette section transforme des contraintes à valider sur le terrain en décisions UX/techniques. Elle ne prétend pas décrire uniformément tous les ménages ou quartiers.

### 26.1 Recherche géographique

La recherche doit fonctionner avec des repères familiers et non uniquement une adresse postale stricte : commune, quartier, avenue si connue, référence de parcelle, point de repère et position GPS. Le référentiel est administré par NZUBU et les variantes de noms sont normalisées sans effacer le libellé communiqué localement.

### 26.2 Qualité de réseau et coût de données

L'ARPTC et l'ACP publient des données d'abonnements mobiles et de pénétration ; pour le T2 2026, l'ACP rapporte 77 millions d'abonnements actifs et une pénétration de 68,6 % à l'échelle nationale. Il s'agit d'abonnements, pas de personnes uniques, et ces chiffres ne garantissent pas le débit ou la disponibilité dans un quartier précis [S12].

Conséquences :

- application Android légère ;
- images et miniatures compressées ;
- qualité vidéo adaptative ;
- lecture texte disponible même si la vidéo ne démarre pas ;
- téléversement vidéo reprenable ;
- saisie terrain hors connexion ;
- signal clair des éléments non synchronisés ;
- tests avec plusieurs opérateurs mobiles et téléphones d'entrée/milieu de gamme avant pilote.

### 26.3 Mobile Money et espèces

Le produit doit prévoir que les clients et partenaires peuvent utiliser des canaux de paiement différents, mais ne doit pas prétendre qu'une transaction Mobile Money est confirmée sur la seule base d'une capture d'écran.

- L'hôte publie les moyens qu'il accepte.
- Le client voit le bénéficiaire et le montant avant paiement.
- La référence externe est enregistrée.
- Le partenaire confirme ou l'API officielle retourne un statut.
- Le cash, s'il est autorisé par les conditions de l'hôte, est marqué comme paiement au partenaire à l'arrivée ; NZUBU ne le détient pas.
- Les collaborateurs NZUBU ne prennent pas les paiements dans la rue ni à domicile.

### 26.4 Appui humain et confiance

Le numérique ne doit pas exclure les utilisateurs qui ont besoin d'aide. Au pilote :

- le service client peut créer une demande assistée avec accord du client ;
- un partenaire peut être accompagné au bureau pour l'enregistrement ;
- un agent peut appeler le partenaire pour confirmer le rendez-vous ;
- chaque action assistée porte la mention `created_by_staff` et conserve l'identité du collaborateur ;
- le service client lit au client les conditions essentielles et note son accord, mais ne peut pas accepter à sa place une clause qu'il n'a pas comprise.

---

# PARTIE IV — TESTS, INDICATEURS ET MISE EN PRODUCTION

## 27. Plan de recette et scénarios d'acceptation

Le QA doit tester les comportements nominaux et les exceptions. Les scénarios suivants sont obligatoires pour considérer le MVP prêt.

| ID | Scénario | Résultat attendu |
|---|---|---|
| AT-001 | Une annonce sans mandat valide est soumise | Elle reste en `DOCUMENT_REVIEW` ou `REJECTED`; elle n'apparaît jamais dans le feed |
| AT-002 | Un partenaire soumet une vidéo d'un autre appartement | Le rapport de visite détecte la divergence ; publication bloquée |
| AT-003 | L'agent termine une inspection sans réseau | Rapport et médias restent en brouillon local, indiqués non synchronisés ; reprise sans doublon après retour réseau |
| AT-004 | Le responsable marché tente de publier sans consentement média | Le backend refuse avec `LISTING_NOT_PUBLISHABLE` |
| AT-005 | Un client consulte le feed sans compte | Il peut voir le contenu public et les informations publiques ; les actions privées demandent une connexion |
| AT-006 | Deux clients demandent les mêmes dates de séjour | Les demandes peuvent être reçues, mais une seule peut obtenir un blocage exclusif et une réservation confirmée |
| AT-007 | Deux confirmations arrivent au même instant | Une seule transaction atomique réussit ; l'autre reçoit `AVAILABILITY_CONFLICT` |
| AT-008 | Le client clique deux fois sur « confirmer » | Une seule réservation est créée grâce à l'idempotence |
| AT-009 | Le paiement direct est déclaré par le client mais non confirmé par l'hôte | Statut `DECLARED_BY_CUSTOMER`, pas `PAID_VERIFIED` |
| AT-010 | Un hôte annule une réservation confirmée | Ticket/incident prioritaire, blocage de l'offre, notification client, tâche de relogement/remboursement |
| AT-011 | Le prix change après acceptation du client | La réservation conserve le prix snapshot accepté ; aucune modification rétroactive |
| AT-012 | Un dépôt résidentiel de 4 mois est saisi | Le système bloque la validation et affiche la limite configurée à 3 mois, sous réserve du cadre légal |
| AT-013 | Une demande de bail est envoyée | Elle ne devient pas un bail signé ; les signatures, pièces et statut d'enregistrement restent nécessaires |
| AT-014 | Un agent consulte les documents d'un partenaire hors mission | Accès refusé et tentative journalisée |
| AT-015 | Le service client demande un remboursement dépassant sa délégation | Le système impose une approbation par Finance/Direction |
| AT-016 | Une annonce expire ou est suspendue | Elle disparaît du feed ; dossiers et transactions historiques restent consultables par rôles autorisés |
| AT-017 | Un téléphone est soumis au parcours OTP réel avant autorisation réglementaire | En environnement production, le parcours est désactivé ; test uniquement avec données synthétiques |
| AT-018 | Un prestataire cloud transfère les données vers un pays tiers non approuvé | Déploiement bloqué par la revue de conformité |
| AT-019 | Une restauration de sauvegarde est exécutée | Utilisateurs, logements, réservations, prix snapshots et audit sont restaurés dans le RPO cible |
| AT-020 | Une réservation est annulée | Conditions appliquées sont celles qui ont été acceptées ; le remboursement direct est attribué au partenaire et suivi |
| AT-021 | Une annonce est dupliquée avec même média et coordonnées proches | Système signale un doublon candidat et crée une tâche de revue humaine |
| AT-022 | Un partenaire change de mandataire | Les droits anciens sont révoqués ; nouvelle preuve exigée ; offres suspendues si besoin |
| AT-023 | L'utilisateur supprime son compte avec litige ouvert | Compte désactivé ; éléments nécessaires au litige conservés à accès restreint ; information communiquée |
| AT-024 | Une vidéo de personne non consentante est signalée | Média masqué le temps de la revue ; preuve et décision conservées |

### 27.1 Tests de sécurité obligatoires

- contrôle d'accès horizontal/vertical ;
- IDOR sur les identifiants de logement, documents et réservations ;
- limites OTP ;
- brute force et credential stuffing ;
- injection, XSS et CSRF sur back-office ;
- upload de fichiers malveillants ;
- analyse des dépendances et conteneurs ;
- test de signature webhook ;
- tests de fuite de secrets dans logs ;
- contrôle de téléchargement des documents privés ;
- pentest indépendant avant ouverture publique.

### 27.2 Jeux de données de recette

Le QA prépare des cas représentatifs :

- 3 communes, quartiers avec variantes de nom ;
- appartement, maison, studio, chambre ;
- meublé, non-meublé, partiellement meublé ;
- courte et longue durée ;
- partenaire propriétaire, mandataire, gestionnaire ;
- dossier complet, incomplet, expiré, frauduleux simulé ;
- logement accessible, inaccessible, non conforme ;
- paiement Mobile Money confirmé, déclaré, en échec, dupliqué ;
- réservation chevauchante ;
- vidéo correcte, lente, corrompue, trop volumineuse, contenant une information personnelle.

Aucune vraie pièce d'identité ni vrai numéro personnel n'est utilisé en environnement de test.

---

## 28. Indicateurs et tableaux de bord

### 28.1 Produit

- utilisateurs actifs journaliers/mensuels ;
- utilisateurs qui consultent le feed ;
- vues qualifiées par vidéo ;
- taux d'ouverture de fiche ;
- favoris ;
- demandes de visites et réservations ;
- conversion par commune, type de bien et mode de location.

### 28.2 Opérations

- demandes partenaires reçues ;
- dossiers complets/incomplets ;
- délai entre demande et mission ;
- missions par agent ;
- missions réussies/échouées ;
- temps de validation marché ;
- taux de reinspection ;
- annonces suspendues et causes ;
- disponibilité invalidée après confirmation.

### 28.3 Commercial et finance

- volume de réservations confirmées et terminées ;
- montant d'hébergement déclaré par période ;
- commissions courtes durées dues/encaissées ;
- baux conclus ;
- honoraires d'agence dus/encaissés ;
- factures impayées ;
- annulations et remboursements déclarés ;
- coûts d'acquisition par source, si la mesure est correctement consentie.

### 28.4 Qualité et support

- tickets par type ;
- première réponse ;
- durée de résolution ;
- plaintes fondées par 100 réservations ;
- écart annonce/logement ;
- avis clients ;
- double réservations ;
- échecs vidéo et upload ;
- incidents de sécurité.

### 28.5 Protection des données

Les dashboards utilisent des données agrégées ou pseudonymisées. Les managers ne voient pas le téléphone complet, les pièces d'identité ou les preuves de paiement s'ils n'en ont pas besoin.

---

## 29. Capacité opérationnelle du pilote

### 29.1 Équipe opérationnelle minimale

| Fonction | Effectif indicatif | Mission |
|---|---:|---|
| Responsable opérations / dispatcher | 1 | Qualifier, planifier, affecter et suivre les missions |
| Responsable marché meublés | 1 | Vérifier les offres de séjour, prix et contenu |
| Responsable marché non-meublés | 1 | Vérifier les offres de bail résidentiel |
| Agents terrain | 2 à 4 | Inspection, photos/vidéos et rapports |
| Service client / accueil | 1 à 2 | Réception, assistance, ticketing et suivi |
| Social media/content | 1 | Diffusion marketing après validation des médias |
| Finance/administration | partagée | Factures, rapprochements, reçus et reporting |

Le nombre réel d'agents doit être déterminé par une mesure terrain : durée moyenne d'une inspection, temps de déplacement, nombre de visites et quantité de vidéos à traiter. Ne pas fixer une capacité uniquement en nombre de communes.

### 29.2 Capacité de départ proposée

- couverture active : Gombe, Lingwala, Ngaliema, si confirmée ;
- portefeuille public initial limité à 30–50 unités vérifiées ;
- extension par lot après mesure du taux de disponibilité, du délai de mise en ligne et de la charge du support ;
- pas de publication massive d'annonces simplement déposées en ligne sans visite et contrôle ;
- quotas d'inspection par agent déterminés après deux semaines d'observation.

### 29.3 Horaires et SLA

Les horaires d'ouverture ne sont pas encore fournis. Proposition de base à faire valider : lundi–samedi, 08:00–18:00 heure de Kinshasa (`Africa/Kinshasa`). Les règles de réponse des partenaires et du support doivent être définies selon cette plage. Les demandes reçues hors horaires sont horodatées et traitées à la prochaine ouverture, sauf incident de sécurité lié à une réservation en cours.

---

## 30. Planning de conception et de réalisation

**Estimation indicative : 16–20 semaines**, hors délais administratifs et décisions externes. Les tâches juridiques/réglementaires démarrent immédiatement et peuvent devenir le chemin critique.

| Période | Activités | Métiers principaux | Livrables / sortie |
|---|---|---|---|
| Semaines 1–2 | Discovery, entretiens, décisions produit, process métier, validation du modèle financier | Product, BA, Direction, juridique | PRD v1, décision log, personas, workflow confirmé |
| Semaines 3–4 | UX/UI, prototypes, dictionnaire de données, architecture et choix hébergeur | Design, Architecte, Backend, DevOps, conformité | Maquettes, modèle conceptuel, ADR, étude d'hébergement |
| Semaines 5–6 | Fondations techniques, CI/CD, authentification de test, référentiel territorial, partenaires/logements | Tech Lead, Backend, Frontend, Mobile, DevOps | Environnements, API initiales, tests automatiques |
| Semaines 7–10 | Annonces, médias, vérification, missions terrain, feed et recherche | Mobile, Backend, Web, Media, QA | Parcours de mise en ligne et découverte complet |
| Semaines 11–13 | Visites, réservations courte durée, dossiers longue durée, disponibilité, finance interne | Backend, Fullstack, Mobile, BA, QA | Parcours transactionnels et états cohérents |
| Semaines 14–15 | Intégration, sécurité, performance, tests terrain, formation staff | QA, Security, DevOps, Product, Opérations | Rapport recette, formation, correction des blocants |
| Semaines 16–17 | Pilote fermé sur stock limité, support renforcé | Toute l'équipe | Rapport pilote, KPI, backlog de corrections |
| Semaines 18–20 | Stabilisation et décision d'ouverture élargie | Direction, Product, Tech Lead, QA | GO public, plan d'extension ou plan de correction |

Les 16–20 semaines ne prennent pas en compte un délai inconnu d'obtention d'agrément immobilier, d'autorisation de traitement de données, de validation tourisme ou de contrat de paiement. Une ouverture publique doit être décalée si une de ces conditions reste bloquante.

---

## 31. Registre des risques

| Risque | Impact | Prévention / réponse | Responsable |
|---|---|---|---|
| Activité d'agence sans agrément requis | Blocage réglementaire, responsabilité et réputation | Avis juridique et obtention des agréments avant intermédiation réelle | Direction / juridique |
| Traitement des numéros de téléphone sans formalité requise | Non-conformité données, sanction et suspension | Confirmer la procédure actuelle ; autorisation avant OTP réel | DPO/conformité |
| Données hébergées/transférées hors RDC sans autorisation | Non-conformité ; architecture à refaire | Cartographie sous-traitants et validation du pays de traitement | Architecte / DPO |
| Statut de location touristique non clarifié | Offre courte durée non conforme | Question écrite au ministère du Tourisme ; statut partenaire | Juridique / opérations |
| Encaissement centralisé sans qualification paiement | Risque réglementaire et financier | Pas de custody au MVP ; avis BCC/PSP avant toute extension | Direction / Finance |
| Faux propriétaire ou faux mandat | Litige, expulsion, fraude | Contrôle pièces, confirmation mandant et audit | Responsable marché |
| Fausse vidéo / logement différent | Perte de confiance | Inspection obligatoire, vidéo datée, signalement et suspension | Responsable marché |
| Disponibilité obsolète | Visite inutile ou double réservation | Reconfirmation, calendrier, blocage serveur | Partenaire / opérations |
| Paiement direct contesté | Perte client et litige | Bénéficiaire vérifié, références, confirmations distinctes | Finance / support |
| Contournement de NZUBU | Commission non payée | Contrat d'apport/intermédiation, règles transparentes, preuve de mise en relation | Direction / juridique |
| Débit/lecture vidéo trop coûteux | Adoption faible et marge réduite | Compression, CDN validé, quotas, monitoring | Media / DevOps |
| Connexion instable terrain | Rapport perdu | Brouillons offline, upload reprenable | Mobile/Web / DevOps |
| Agent exposé à un risque terrain | Sécurité du personnel | Missions planifiées, check-in/out, protocole d'escalade, pas de visite isolée à risque | Opérations |
| Dépendance à un prestataire | Panne ou coût non maîtrisé | Adapter les abstractions, export, SLA et procédure de sortie | Tech Lead |
| Accès administratif abusif | Fuite ou fraude interne | MFA, moindre privilège, séparation des tâches, logs | Security / Admin |
| Budget/calendrier irréalistes | MVP incomplet | Périmètre fermé, chiffrage sur backlog et sprint zéro | PM / Direction |

---

## 32. Décisions et informations restant à valider

Le dossier propose des choix afin que les développeurs puissent avancer, mais certaines décisions doivent être signées par le propriétaire du produit ou un professionnel compétent.

| ID | Décision à valider | Proposition de l'agence | Qui valide ? | Échéance critique |
|---|---|---|---|---|
| D-001 | Marque officielle : NZUBU ou PIOL | NZUBU dans ce dossier ; externaliser le nom via configuration | Fondateur / Direction | Avant maquettes finales et stores |
| D-002 | Société porteuse, siège, RCCM, ID Nat, NIF | Les renseigner depuis documents officiels, ne rien inventer | Direction / comptable | Avant contrats et prestataires |
| D-003 | Agrément d'agence et conditions d'exercice | Traiter NZUBU comme intermédiaire actif ; obtenir agrément/avis écrit avant transactions | Direction / avocat / Habitat | Blocage avant production |
| D-004 | Communes du pilote | Gombe, Lingwala, Ngaliema | Direction / Opérations | Avant recrutement terrain |
| D-005 | Couverture meublé + non-meublé | Les deux inclus avec flux séparés | Direction / Product | Avant backlog final |
| D-006 | Commission courte durée | 10 % du prix d'hébergement réalisé, facturée à l'hôte, modifiable par contrat | Direction / Finance / juridique | Avant contrat partenaire |
| D-007 | Politique d'annulation courte durée | Barème proposé 72 h / 24–72 h / moins de 24 h ; à valider | Direction / juridique / hôtes pilotes | Avant réservation publique |
| D-008 | Conditions de paiement du séjour | Avance standard proposée de 20 % payée directement à l'hôte, solde à l'arrivée ; option paiement à l'arrivée uniquement si l'hôte l'active ; aucune détention de fonds par NZUBU | Direction / juridique / Finance | Avant parcours de confirmation |
| D-009 | Canaux de paiement de l'hôte | Mobile Money professionnel vérifié et/ou espèces à l'arrivée si accepté | Partenaire / Finance | Avant onboarding hôte |
| D-010 | Frais de visite | Gratuit au pilote | Direction | Avant publication des tarifs |
| D-011 | Conditions de bail et honoraires | Règle légale un mois de loyer, payeur selon demande de service | Direction / avocat | Avant flux longue durée |
| D-012 | Qualification tourisme courte durée | Détermination officielle par catégorie d'hôte/activité | Direction / ministère / avocat | Blocage avant offres de séjour publiques |
| D-013 | Traitement des numéros de téléphone | Formalité/autorisation préalable selon art. 187 | DPO / autorité compétente | Blocage avant OTP réel |
| D-014 | Localisation des données personnelles | Hébergement RDC par défaut ; transfert externe seulement après autorisation | Direction / DPO / CTO | Blocage choix cloud |
| D-015 | Fournisseur cloud et stockage vidéo | Choisir après analyse de résidence, coûts, CDN et sauvegarde | CTO / DPO | Avant développement infrastructure |
| D-016 | Prestataire paiement propre à NZUBU | M-Pesa/Airtel à comparer et contractualiser | Finance / Direction | Avant intégration réelle |
| D-017 | Horaires de service | Proposition lundi–samedi 08:00–18:00 | Direction / RH / Opérations | Avant SLA |
| D-018 | Effectifs terrain | 2 à 4 agents, puis ajustement sur volume observé | Direction / Opérations | Avant pilote |
| D-019 | Budget plafond | Non fourni ; à établir par lots et coûts mensuels | Direction | Avant engagement fournisseur |
| D-020 | Date de mise en production | Fourchette de planification 16–20 semaines ; dépend de formalités | Direction / PM | Avant contrat de réalisation |
| D-021 | Périmètre post-location | Pas de gestion locative après remise des clés au MVP | Direction / Product | Avant modèle de données définitif |
| D-022 | Conditions du logement meublé touristique | Exiger les documents applicables après qualification du ministère | Juridique / opérations | Avant publication des offres concernées |

### 32.1 Hypothèses non validées à ne pas présenter comme des faits

- 10 % de commission courte durée : proposition commerciale ; pas un tarif réglementaire.
- 30 minutes de blocage temporaire : paramètre de fonctionnement proposé.
- 90 jours de validité du badge : règle opérationnelle proposée.
- 30–50 unités initiales : capacité pilote proposée, à mesurer.
- Gombe, Lingwala et Ngaliema : couverture suggérée, pas résultat d'une étude de marché.
- Annulation 72 h / 24 h : exemple de politique, à contractualiser et vérifier juridiquement.
- 16–20 semaines : estimation, non engagement contractuel.

---

## 33. Critères de GO pour le développement

### 33.1 GO — Discovery et conception

Le travail de conception peut démarrer si :

- mission, publics, limites de responsabilité et zones pilotes sont validés ;
- les deux parcours (courte/longue durée) sont acceptés comme deux workflows distincts ;
- le modèle de revenus proposé est accepté comme hypothèse ou modifié ;
- le vocabulaire `property/building/unit/listing` est approuvé ;
- les rôles et responsabilités internes sont confirmés.

### 33.2 GO — Développement des fondations

Le développement sur données fictives peut démarrer si :

- le modèle de données et les règles de permission sont revus ;
- les workflows et états sont validés ;
- les maquettes couvrent les états normaux et les erreurs ;
- la stack, les environnements, le dépôt Git et la CI/CD sont approuvés ;
- la stratégie d'hébergement est documentée ;
- les exigences de données personnelles sont traduites en plan d'action ;
- les contrats API et les critères d'acceptation sont définis.

### 33.3 GO — Pilote fermé avec données réelles

Le pilote avec de vrais partenaires et de vrais utilisateurs attend :

- validation juridique de l'activité d'intermédiaire et agrément requis ;
- procédure de données personnelles confirmée, notamment pour les numéros de téléphone ;
- hébergement et transferts de données autorisés ;
- qualification des activités de courte durée auprès du ministère compétent ;
- contrat partenaire et autorisation média prêts ;
- politiques prix/commission/annulation signées ;
- contrat et compte marchand avec prestataire de paiement pour les factures de NZUBU, si encaissement en ligne ;
- procédures support et terrain testées ;
- formation de l'équipe pilote.

### 33.4 GO — Ouverture publique

- tous les tests d'acceptation P0 réussis ;
- aucune vulnérabilité critique ou haute non corrigée ;
- test de restauration réussi ;
- monitoring et alertes actifs ;
- comptes de publication et domaines contrôlés par la société ;
- annonces initiales vérifiées et disponibles ;
- partenaires sous contrat ;
- conditions de réservation visibles et acceptées ;
- support opérationnel et gestion des incidents prêt ;
- décision formelle de lancement signée par Direction, Product Owner, Tech Lead et QA.

---

## 34. Livrables obligatoires à la fin de la conception

| Livrable | Responsable principal | État requis pour GO développement |
|---|---|---|
| Product Requirements Document (PRD) | Product Manager | Validé |
| Cartographie BPMN des processus | Business Analyst | Validée |
| Dictionnaire de données | BA + Architecte + DBA | Versionnée |
| Matrice des permissions | BA + Security + Direction | Validée |
| Maquettes et prototype | Product Designer | Testés avec utilisateurs |
| Design system | Product Designer | Versionné |
| Modèle de données/ERD | Architecte + DBA | Revu |
| Architecture et ADR | Architecte/Tech Lead | Approuvés |
| OpenAPI | Backend Lead | Version initiale complète |
| Matrice conformité données | DPO/juridique | Formalités identifiées |
| Modèle économique & contrats partenaires | Direction/Finance/Juridique | Signé ou validé |
| Scénarios QA | QA + Product Owner | P0 définis |
| Plan de déploiement | DevOps | Staging reproductible |
| Plan de restauration et sécurité | DevOps/Security | Testé avant pilote |
| Guide opérations terrain | Responsable opérations | Utilisable |
| Guide service client | Responsable support | Utilisable |
| Manuel partenaire | Product/Operations | Utilisable |

---

## 35. Points de vigilance issus du document juridique NZUBU initial

Le document initial « Mention Légal NZUBU » constitue une base de rédaction, mais plusieurs clauses doivent être corrigées ou transformées en règles métier avant publication.

| Élément initial | Problème identifié | Décision pour le MVP |
|---|---|---|
| Paiement de 20 % divisé en 10 % plateforme et 10 % avance hôte | Confusion entre commission, avance, détention de fonds et paiement du séjour ; circuit non défini | Non retenu. Modèle proposé : avance de 20 % payée directement à l'hôte et entièrement due à l'hôte ; solde de 80 % à l'arrivée ; commission NZUBU de 10 % facturée séparément à l'hôte après séjour réalisé. Avance, annulation et commission à valider juridiquement et commercialement avant activation |
| Frais de visite de 5 000 FCFA | Le FCFA n'est pas la monnaie de référence de la RDC ; aucune validation du montant local | Visites gratuites au pilote ; tous les prix affichés en CDF |
| Commission longue durée d'un mois de loyer | Doit indiquer qui supporte les honoraires selon la personne qui a sollicité l'agence | Appliquer la règle de l'article 10 de la Loi 15/025 et conserver la preuve de demande |
| NZUBU comme troisième partie au bail | Risque de confusion entre bailleur/preneur et agence/intermédiaire | Le bail est conclu entre bailleur et preneur ; NZUBU intervient comme agence si agréée |
| Interdiction absolue de tout contact direct | Peut être trop large et difficile à faire appliquer ; doit respecter le mandat et les droits des parties | Encadrer les communications apportées par NZUBU jusqu'à la conclusion ; prévoir des exceptions pratiques/sécurité dans le contrat partenaire |
| Remboursement obligatoire et décision unilatérale de NZUBU | Inapplicable pour des fonds versés directement à l'hôte sans mécanisme d'encaissement/mandat | NZUBU instruit, documente et médie ; l'hôte exécute le remboursement selon conditions acceptées et droit applicable |
| Suspension des paiements par NZUBU | Impossible si NZUBU ne détient pas les fonds | Suspension d'annonce/partenaire et médiation ; blocage des fonds uniquement si futur dispositif légalement validé |
| Garantie de conformité absolue du logement | Le contrôle terrain est daté et limité ; n'est pas une certification juridique ou structurelle | Badge avec périmètre, date et limites explicites |
| Suppression de compte uniquement par e-mail | Ne couvre pas les parcours in-app ni les obligations de conservation | Demande dans l'application + canal support alternatif ; suppression/anonymisation avec exceptions légales |

---

## 36. Conclusion opérationnelle de l'agence

Le MVP recommandé est une **plateforme immobilière opérée à Kinshasa**, avec deux offres indépendantes (courte et longue durée), une inspection terrain obligatoire avant publication, un feed vidéo simple et chronologique, un espace Web commun aux opérations/agents/partenaires, des visites planifiées par l'équipe et des réservations de courte durée confirmées manuellement par l'hôte.

Le choix le plus important pour limiter le risque est de ne pas faire transiter au lancement le prix du séjour, le loyer ou la caution par NZUBU. NZUBU trace la demande et les preuves, facture ses propres honoraires/commissions et ne crée pas de wallet. Toute évolution vers un paiement centralisé doit être traitée comme un projet réglementaire et financier distinct.

Les règles légales de longue durée sont intégrées à la conception ; les obligations tourisme de courte durée, l'agrément immobilier et les formalités de données personnelles sont des conditions préalables à la production. Les développeurs peuvent construire les parcours avec données fictives en parallèle, mais ne doivent pas activer les traitements ou transactions réels avant validation.

**Avis de l'agence : GO pour la conception détaillée et le développement sur données synthétiques ; NO-GO pour l'ouverture publique avec données réelles tant que les blocages réglementaires, le budget, le fournisseur d'hébergement et les validations commerciales du registre D-001 à D-022 ne sont pas clôturés.**

---

# ANNEXE A — Références consultées

Les références ci-dessous ont été consultées le 4 novembre 2026. Les sources officielles/principales sont privilégiées ; lorsqu'une source secondaire est utilisée pour suivre une procédure administrative récente, cela est signalé.

**[S1] Loi n°15/025 du 31 décembre 2015 relative aux baux à loyer non professionnels.** Texte complet consultable via Leganet et copie PDF via Droit Congolais. Articles particulièrement pertinents : 2 à 5 (définitions, forme et contenu), 10 (honoraires d'agence), 17 (état des lieux), 18 (garantie), 21–22 (monnaie et paiement anticipatif), 36–37 (conciliation préalable).

- https://mail.leganet.cd/Legislation/Droit%20obligations-contrats/Bail/Loi.15.025.31.12.html
- https://www.droitcongolais.info/files/223.12.15-Loi-du-31-decembre-2015_Bail-a-loyer-non-professionels.pdf

**[S2] Arrêté ministériel n° CAB/MIN.UH/015/2017 du 10 août 2017** portant organisation des fonctions des agences immobilières, agents et courtiers immobiliers, syndicats et intermédiaires immobiliers. Voir notamment les articles 1 à 7 sur la définition des agences/intermédiaires, l'agrément et le dossier de demande.

- https://www.droitcongolais.info/EN/files/713.08.16.2-Arrete-du-10-aout-2017-_agentimmobilier--2-.pdf

**[S3] Arrêté ministériel n°052/CAB/MIN-UH/2018 du 11 décembre 2018** portant instauration d'un contrat de bail type en RDC ; texte et détails du modèle unique.

- https://www.droitcongolais.info/files/223.12.18-Arrete-du-11-decembre-2018_contrat-de-bail-type.pdf
- https://mail.leganet.cd/Legislation/Droit%20civil/Dobligations/AM.11.12.2018.html

**[S4] Ordonnance-loi n°23/010 du 13 mars 2023 portant Code du numérique.** Copie officielle diffusée par l'ARE ; voir notamment articles 186–188 (formalités préalables), 192–194 (licéité, durée, exactitude et sécurité des données) et 201–202 (hébergement/transferts).

- https://are.gouv.cd/wp-content/uploads/2023/05/04042023-ORDONNANCE-LOI-23-010-DU-13-MARS-PORTANT-CODE-DU-NUMERIQUE_compressed.pdf
- https://www.journalofficiel.cd/textes-phares/codes-en-vigueur

**[S5] Africa Data Protection — publication relative aux formalités préalables de protection des données en RDC, août 2026.** Source secondaire spécialisée qui rapporte la publication au Journal officiel du 23 avril 2026 d'une décision prise en 2025 et le régime transitoire de l'ARPTC. À confirmer directement auprès de l'autorité compétente et d'un conseil congolais.

- https://www.africadataprotection.org/rdc-publication-au-journal-officiel-de-la-decision-fixant-la-procedure-des-formalites-prealables.html

**[S6] Loi n°18/018 du 9 juillet 2018 portant principes fondamentaux relatifs au tourisme.** Voir articles 17–19 sur les activités et types d'hébergement, 27–34 sur autorisation, exploitation et classification.

- https://faolex.fao.org/docs/pdf/Cng189365.pdf

**[S7] Catalogue des services publics de la RDC — Licence d'exploitation pour hôtels et similaires.** Source utile pour comprendre une catégorie précise de licences hôtelières, mais elle ne détermine pas à elle seule le statut de chaque appartement meublé ou de chaque hôte individuel.

- https://servicepublic.gouv.cd/service/3119

**[S8] Banque Centrale du Congo — réglementation et surveillance des systèmes de paiement.** Présente le périmètre de surveillance BCC et les textes applicables aux établissements de monnaie électronique et systèmes de paiement.

- https://www.bcc.cd/intermediaires-financiers/reglementation/par-nature/systemes-de-paiement
- https://www.bcc.cd/intermediaires-financiers/reglementation/textes-reglementaires/monnaie-electronique
- https://www.bcc.cd/intermediaires-financiers/systemes-de-paiement/surveillance

**[S9] Vodacom RDC — APIs M-Pesa.** Présente notamment les API B2B, B2C, C2B et vérification du statut de transaction, avec accès via portail marchand et compte business.

- https://www.vodacom.cd/particulier/m-pesa/service-financier/les-apis-mpesa

**[S10] Airtel RDC — Developer Portal.** Présente l'inscription, les tests d'API et l'accès production après onboarding et conformité légale.

- https://developers.airtel.cd/home

**[S11] ACP — rappel de la BCC sur les transactions en monnaie nationale, 16 janvier 2026.** Source de presse rapportant la position de la Banque Centrale : le franc congolais est la monnaie ayant cours légal et les biens/services de consommation sont en principe affichés et payés en monnaie nationale, sauf dérogation expresse.

- https://acp.cd/economie/dollarisation-des-transactions-mise-en-garde-de-la-banque-centrale-aux-etablissements-financiers/

**[S12] ACP — données du marché télécom, T2 2026, publiées le 3 novembre 2026 à partir de l'Observatoire ARPTC.** Les chiffres cités portent sur des abonnements actifs, pas sur des individus uniques ; ils ne remplacent pas les tests de débit sur les lieux réels du pilote.

- https://acp.cd/economie/rdc-telecoms-77-millions-dabonnements-actifs-recenses-au-2eme-trimestre-2026-arptc/
- Rapport ARPTC T2 2025 (données internet/mobile money) : https://arptc.gouv.cd/app/uploads/2025/11/T2-25_Rapport_ARPTC_29-OCT-2025.pdf

---

# ANNEXE B — Glossaire technique

| Terme | Définition |
|---|---|
| MVP | Première version utile et exploitable, limitée à un périmètre précis |
| PRD | Product Requirements Document : document des exigences produit |
| BPMN | Notation de modélisation des processus métier |
| RBAC | Contrôle d'accès basé sur les rôles |
| ABAC | Contrôle d'accès basé sur les attributs (territoire, dossier, mission, etc.) |
| OTP | Code à usage unique pour vérifier un accès ou une action |
| PWA | Application Web progressive installable et adaptée au mobile |
| API | Interface contractuelle permettant à des logiciels de communiquer |
| Webhook | Notification serveur-à-serveur envoyée par un prestataire ou un service |
| Idempotence | Propriété d'une opération qui ne se répète pas en doublon si elle est rejouée |
| HLS | Format de diffusion vidéo adaptatif par segments |
| CDN | Réseau de diffusion de contenu |
| RPO | Perte maximale de données acceptable en cas d'incident |
| RTO | Durée maximale visée avant restauration du service |
| P95 | Valeur sous laquelle se situent 95 % des mesures |
| Snapshot | Copie figée des informations et conditions acceptées à un instant donné |
| Commission accrual | Montant de commission acquis selon un événement contractuel |
| Rapprochement | Contrôle entre opération enregistrée, preuve et relevé du prestataire |

---

**Fin du dossier — NZUBU v1.0**
