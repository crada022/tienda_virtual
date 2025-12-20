# ============================
# RESET COMPLETO DE TENANTS
# ============================

# Configuración PostgreSQL
$pgUser = "postgres"
$pgPass = "admin"  # Cambia si tu contraseña es diferente
$pgHost = "localhost"
$pgPort = 5432

Write-Host "==============================="
Write-Host "💥 RESET COMPLETO DE TENANTS 💥"
Write-Host "==============================="

# ----------------------------
# 1️⃣ Eliminar carpetas de migraciones tenant
# ----------------------------
Write-Host "`n1️⃣ Eliminando migraciones tenant..."
$tenantMigrations = Get-ChildItem -Path "prisma\migrations" -Directory | Where-Object { $_.Name -like "tenant_*" }
foreach ($dir in $tenantMigrations) {
    Write-Host "Eliminando $($dir.FullName)"
    Remove-Item -Recurse -Force $dir.FullName
}

# ----------------------------
# 2️⃣ Eliminar cliente Prisma tenant
# ----------------------------
Write-Host "`n2️⃣ Eliminando cliente Prisma tenant..."
$tenantClientPath = "src\prisma\tenant"
if (Test-Path $tenantClientPath) {
    Remove-Item -Recurse -Force $tenantClientPath
    Write-Host "Cliente Prisma tenant eliminado."
} else {
    Write-Host "Cliente Prisma tenant no existía, ok."
}

# ----------------------------
# 3️⃣ Listar y eliminar bases de datos tenant
# ----------------------------
Write-Host "`n3️⃣ Listando y eliminando bases tenant..."
$databases = psql -U $pgUser -h $pgHost -p $pgPort -d postgres -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'store_%';"

foreach ($db in $databases) {
    Write-Host "Eliminando base de datos: $db"
    # Forzar desconexión de usuarios activos y eliminar
    psql -U $pgUser -h $pgHost -p $pgPort -d postgres -c "DROP DATABASE IF EXISTS $db WITH (FORCE);"
}

# ----------------------------
# 4️⃣ Regenerar cliente Prisma tenant
# ----------------------------
Write-Host "`n4️⃣ Regenerando cliente Prisma tenant..."
npx prisma generate --schema=prisma/tenant.prisma

Write-Host "`n✅ RESET COMPLETADO: Migraciones, bases y cliente Prisma tenant limpias."
