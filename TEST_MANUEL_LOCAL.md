# Essais manuels des quatre rôles

Ouvrir **http://localhost:3001/** sur le PC. Il s'agit de l'interface connectée à l'API et à PostgreSQL. Sur Android relié par USB, exécuter `adb reverse tcp:3001 tcp:3001`, puis ouvrir la même adresse dans Chrome Android.

Comptes locaux existants :

| Rôle | Adresse |
| --- | --- |
| Administrateur | `admin-pilote@test.local` |
| Partenaire | `partenaire-pilote@test.local` |
| Agent terrain | `agent-pilote@test.local` |
| Client | `client-pilote@test.local` |

Pour activer l'un de ces comptes précréés, ouvrir **Inscription**, saisir son adresse et choisir un mot de passe (10 caractères minimum). Les adresses fictives `@test.local` ne reçoivent pas d'e-mail : leur code de test apparaît dans `C:\Projects\Nzubu\nzubu-otp.log`. Dans PowerShell, `Get-Content C:\Projects\Nzubu\nzubu-otp.log -Tail 10 -Wait` permet de voir les nouveaux codes. Ce fichier est exclu de Git. Les adresses réelles reçoivent leur code exclusivement par e-mail via Brevo. Après vérification, utiliser **Connexion** avec l'e-mail ou le téléphone et le mot de passe. Un nouveau code peut être demandé après une minute.

Un nouveau compte inscrit depuis l'interface publique devient **client**. Pour créer un nouvel agent ou administrateur, activer d'abord un compte administrateur précréé, puis utiliser la rubrique **Comptes**. Le nouveau titulaire active ensuite son compte dans **Inscription** avec son propre e-mail. Le lien **Mot de passe oublié ?** permet de tester la récupération par e-mail.

Tester le parcours dans cet ordre : partenaire (créer une annonce et déposer ses pièces), administrateur (affecter une mission), agent (effectuer la visite et envoyer le rapport), administrateur (valider les preuves et publier), client (consulter l'annonce et demander une visite ou un séjour), partenaire et administrateur (traiter puis clôturer la demande). Utiliser **Déconnexion** avant de changer de rôle. Signaler tout blocage avec le rôle, l'action, le message affiché et l'heure ; les corrections se feront dans l'API et dans l'interface selon la cause.

Les données de ces comptes restent fictives. Les décisions commerciales, réglementaires et d'hébergement mentionnées dans `READINESS.md` restent à prendre avant un pilote avec de vraies personnes.
