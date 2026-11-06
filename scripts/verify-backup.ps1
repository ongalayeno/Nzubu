$ErrorActionPreference = 'Stop'
$container = 'nzubu-postgres-1'
$backupPath = '/tmp/nzubu-backup-verify.dump'
$restoreDb = 'nzubu_restore_verify'

docker compose exec -T postgres pg_dump -U nzubu -Fc -f $backupPath nzubu
if ($LASTEXITCODE -ne 0) { throw 'Sauvegarde PostgreSQL échouée.' }

docker compose exec -T postgres dropdb -U nzubu --if-exists $restoreDb
if ($LASTEXITCODE -ne 0) { throw 'Nettoyage de la base de vérification échoué.' }
docker compose exec -T postgres createdb -U nzubu $restoreDb
if ($LASTEXITCODE -ne 0) { throw 'Création de la base de vérification échouée.' }

try {
  docker compose exec -T postgres pg_restore -U nzubu --no-owner -d $restoreDb $backupPath
  if ($LASTEXITCODE -ne 0) { throw 'Restauration PostgreSQL échouée.' }
  $countsSql = 'SELECT (SELECT count(*) FROM schema_migrations), (SELECT count(*) FROM users), (SELECT count(*) FROM listings), (SELECT count(*) FROM bookings), (SELECT count(*) FROM audit_log);'
  $sourceCounts = docker compose exec -T postgres psql -U nzubu -d nzubu -Atc $countsSql
  if ($LASTEXITCODE -ne 0) { throw 'Lecture des comptes source échouée.' }
  $restoreCounts = docker compose exec -T postgres psql -U nzubu -d $restoreDb -Atc $countsSql
  if ($LASTEXITCODE -ne 0 -or $restoreCounts -ne $sourceCounts) { throw "Les comptes restaurés divergent : source=$sourceCounts, restauration=$restoreCounts" }
  Write-Output "Sauvegarde et restauration vérifiées : migrations, utilisateurs, logements, réservations et audit ($restoreCounts)."
} finally {
  docker compose exec -T postgres dropdb -U nzubu --if-exists $restoreDb
}
