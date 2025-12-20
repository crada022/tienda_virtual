import fs from "fs";
import { exec } from "child_process";

export const createDatabaseForStore = async (dbName) => {
  return new Promise((resolve, reject) => {
    console.log(`⚙ Creando base de datos tenant: ${dbName}`);

    const pgUser = "postgres";
    const pgPass = process.env.PGPASSWORD;
    const pgHost = "localhost";
    const pgPort = 5432;

    if (!pgPass) {
      return reject(new Error("❌ ERROR: Falta PGPASSWORD en .env"));
    }

    const tenantUrl = `postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${dbName}`;

    // 1️⃣ Crear DB si no existe
    const createDbCmd = `psql "postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/postgres" -c "CREATE DATABASE ${dbName};"`;
    exec(createDbCmd, (err, stdout, stderr) => {
      if (err && !stderr.includes("already exists")) {
        console.log("❌ Error creando la base:", stderr);
        return reject(err);
      }
      console.log("✔ Base creada (o ya existía)");

      // 2️⃣ Crear schema temporal basado en tenant.prisma
      console.log("📄 Creando schema temporal para tenant...");
      const template = fs.readFileSync("./prisma/tenant.prisma", "utf8");

      const tenantSchema = template.replace(
        /url\s*=.*$/m,
        `url = "${tenantUrl}"`
      );

      const schemaPath = `./prisma/tenant_${dbName}.prisma`;
      fs.writeFileSync(schemaPath, tenantSchema);

      // 3️⃣ Ejecutar migraciones en tenant
      console.log("⚙ Ejecutando migraciones del tenant...");
      const migrateCmd = `npx prisma migrate deploy --schema=${schemaPath}`;
      exec(migrateCmd, (err, stdout, stderr) => {
        fs.unlinkSync(schemaPath); // borrar schema temporal
        if (err) {
          console.log("❌ Error aplicando migraciones:", stderr);
          return reject(err);
        }
        console.log("✔ Migraciones aplicadas correctamente en tenant:", dbName);
        resolve();
      });
    });
  });
};
