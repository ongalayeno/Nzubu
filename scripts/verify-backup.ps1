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
  $result = docker compose exec -T postgres psql -U nzubu -d $restoreDb -Atc 'SELECT count(*) FROM schema_migrations;'
  if ($LASTEXITCODE -ne 0 -or [int]$result -lt 1) { throw 'La base restaurée ne contient pas les migrations attendues.' }
  Write-Output "Sauvegarde et restauration vérifiées : $result migrations présentes."
} finally {
  docker compose exec -T postgres dropdb -U nzubu --if-exists $restoreDb
}
