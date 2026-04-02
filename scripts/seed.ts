import { createClassRoom, createStudent, upsertUserFromOAuth } from "../src/lib/db";

async function main() {
  await createClassRoom("X RPL 1");
  await createClassRoom("X RPL 2");
  await createClassRoom("XI RPL 1");
  await upsertUserFromOAuth({ email: "guru1@sekolah.id", name: "Guru Utama", image: null });
  await createStudent({ name: "Andi Saputra", nisn: "1234567890" });
  await createStudent({ name: "Budi Santoso", nisn: "1234567891" });
  console.log("Seed selesai");
}
main().catch((err) => { console.error(err); process.exit(1); });
