import fs from "fs";
import { exec } from "child_process";

export const createDatabaseForStore = async (dbName) => {
  return new Promise((resolve, reject) => {
    console.log(`⚙ Creando base de datos: ${dbName}`);

    const pgUser = "postgres";
    const pgPass = process.env.PGPASSWORD;
    const pgHost = "localhost";
    const pgPort = 5432;

    const tenantUrl = `postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${dbName}`;

    if (!pgPass) {
      console.log("❌ ERROR: Falta PGPASSWORD en .env");
      return reject(new Error("PGPASSWORD no definido"));
    }

    // -----------------------------------
    // 1️⃣ Crear BD usando psql
    // -----------------------------------
    const createDbCmd =
      `psql "postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/postgres"` +
      ` -c "CREATE DATABASE ${dbName};"`;

    exec(createDbCmd, (err, stdout, stderr) => {
      if (err && !stderr.includes("already exists")) {
        console.log("❌ Error creando la base:", stderr);
        return reject(err);
      }

      console.log("✔ Base creada (o ya existía)");

      // -----------------------------------
      // 2️⃣ Crear schema.prisma temporal
      // -----------------------------------
      console.log("📄 Creando schema temporal...");

      const template = fs.readFileSync("./prisma/schema.prisma", "utf8");

      const tenantSchema = template.replace(
        /url\s*=.*$/m,
        `url = "${tenantUrl}"`
      );

      const schemaPath = `./prisma/tenant_${dbName}.prisma`;
      fs.writeFileSync(schemaPath, tenantSchema);

      // -----------------------------------
      // 3️⃣ Ejecutar migraciones en BD tenant
      // -----------------------------------
      console.log("⚙ Ejecutando migraciones del tenant...");

      const migrateCmd = `npx prisma migrate deploy --schema=${schemaPath}`;

      exec(migrateCmd, (err, stdout, stderr) => {
        // Borrar schema temporal pase lo que pase
        fs.unlinkSync(schemaPath);

        if (err) {
          console.log("❌ Error aplicando migraciones:", stderr);
          return reject(err);
        }

        console.log("✔ Migraciones aplicadas correctamente");
        resolve();
      });
    });
  });
};
