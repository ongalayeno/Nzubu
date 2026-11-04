# Proposition d'hébergement pour NZUBU

## Décision actuelle

Le projet reste sur l'ordinateur du propriétaire pour les essais. Aucun serveur Namecheap ni autre hébergement externe ne doit être configuré ou déployé à cette étape. Le propriétaire dispose déjà de Namecheap ; son offre exacte (domaine, mutualisé ou VPS) n'est pas encore connue.

Namecheap peut servir à gérer le domaine plus tard, même si l'application et les données sont hébergées ailleurs. Selon [sa liste de centres de données](https://www.namecheap.com/support/knowledgebase/article.aspx/136/22/where-are-your-datacenters-located-how-can-i-request-to-change-the-datacenter/), ses implantations publiées sont aux États-Unis, au Royaume-Uni, en Europe et en Asie : aucune en RDC. Son [hébergement mutualisé](https://www.namecheap.com/support/knowledgebase/article.aspx/129/22/what-version-of-the-software-is-used-on-your-servers/) annonce PostgreSQL 10.23 sur certaines offres, ce qui ne correspond pas à la pile PostgreSQL locale du projet. Un VPS permettrait davantage de contrôle technique, mais [Namecheap indique](https://www.namecheap.com/hosting/what-is-vps-hosting-definition.aspx) que la maintenance et la sécurité du serveur incombent au client. Le choix d'un produit Namecheap ne résout donc pas la question de la localisation des données.

## Orientation

Héberger en priorité la base PostgreSQL, les justificatifs et les photos privées en **RDC**, idéalement dans un centre de données à Kinshasa. L'article 201 du Code du numérique prévoit le stockage des données personnelles en RDC et encadre le transfert vers un pays tiers. Un hébergement à l'étranger ne doit pas être lancé par défaut sans revue et démarches appropriées.

Sources : [Code du numérique, article 201](https://are.gouv.cd/wp-content/uploads/2023/05/04042023-ORDONNANCE-LOI-23-010-DU-13-MARS-PORTANT-CODE-DU-NUMERIQUE_compressed.pdf), [guichet ARPTC](https://cadran.arptc.gouv.cd/).

## Fournisseurs à consulter

| Option | Offre publique constatée | Vérification à demander |
|---|---|---|
| [GBS](https://www.gbs.cd/fr/services/hebergement) | Centres de données à Kinshasa et Lubumbashi, colocation et services de sauvegarde/monitoring | Devis d'hébergement managé, SLA, PostgreSQL, stockage objet, restauration, preuve de localisation |
| [Orange Business RDC](https://business.orange.cd/fr/ict/hbergement-datacenter.html) | Hébergement d'équipements en data center RDC avec connectivité | Disponibilité de VM managées, sécurité du réseau, stockage privé et support PostgreSQL |
| [Raxio RDC](https://www.raxiogroup.com/data-centres/dr-congo/) | Centre de données à Kinshasa avec services cloud annoncés | Partenaire cloud effectif, offre de calcul, sauvegardes et conditions contractuelles |

Ces pages attestent de capacités d'hébergement annoncées, pas encore de l'adéquation technique ou contractuelle à NZUBU. Demander au moins deux devis comparables et un test de restauration avant le choix.

## Brevo

Brevo fournit des [API d'e-mail transactionnel](https://developers.brevo.com/docs/send-a-transactional-email) et de [SMS transactionnel](https://developers.brevo.com/docs/transactional-sms-endpoints). Selon [sa documentation sur le stockage](https://help.brevo.com/hc/fr/articles/360001005510-Lieux-de-stockage-des-donn%C3%A9es), ses bases sont dans l'UE. Le choix est techniquement cohérent pour les notifications et OTP, mais l'envoi d'un numéro congolais et d'un code vers ce prestataire doit faire partie de la revue des transferts. Tester la délivrabilité sur les opérateurs locaux avant d'activer l'OTP SMS.

## Solution de repli technique

AWS [Africa (Cape Town)](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html) dispose de RDS et [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate-Regions.html). Cela peut être une option technique si les conditions de transfert et d'hébergement hors RDC sont validées. La proximité géographique ne prouve pas la latence réelle vers Kinshasa ; mesurer depuis les réseaux locaux.
