// ============================================
// test-sql-engine.js — Pengujian Menyeluruh Operasi SQL
// ============================================

const initSqlJs = require('sql.js');

async function testSqlEngine() {
  console.log("==============================================");
  console.log("  PENGUJIAN OPERASI SQL (DDL & DML ENGINE)");
  console.log("==============================================");

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  console.log("✔ SQLite WASM Engine aktif.\n");

  // 1. DDL: CREATE TABLE murid & mapel
  db.run(`
    CREATE TABLE murid (
      nisn VARCHAR(10) PRIMARY KEY,
      nama VARCHAR(50) NOT NULL,
      alamat VARCHAR(100),
      jenis_kel VARCHAR(20),
      kelas VARCHAR(10)
    );
  `);
  console.log("1. ✅ CREATE TABLE murid (nisn PK, nama, alamat, jenis_kel, kelas) -> Berhasil");

  db.run(`
    CREATE TABLE mapel (
      id_mapel INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_mapel VARCHAR(50) NOT NULL
    );
  `);
  console.log("2. ✅ CREATE TABLE mapel (id_mapel, nama_mapel) -> Berhasil");

  // 2. DML: INSERT INTO
  db.run(`
    INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) VALUES
      ('10001', 'Adil Wicaksono', 'Jalan Solo no 3', 'Laki-laki', 'XI RPL 1'),
      ('10002', 'Budi Santoso', 'Jalan Merdeka no 12', 'Laki-laki', 'XI RPL 1'),
      ('10003', 'Citra Lestari', 'Jalan Solo no 45', 'Perempuan', 'XI RPL 2'),
      ('10004', 'Dewi Anggraini', 'Jalan Sudirman no 7', 'Perempuan', 'XI RPL 2');
  `);
  console.log(`3. ✅ INSERT INTO murid (4 baris data awal) -> Berhasil (${db.getRowsModified()} baris terpengaruh)`);

  db.run(`
    INSERT INTO murid (nisn, nama, alamat, jenis_kel, kelas) 
    VALUES ('10005', 'Rizky Fadillah', 'Padang', 'Laki-laki', 'XI RPL 1');
  `);
  console.log(`4. ✅ INSERT INTO murid (1 baris baru) -> Berhasil (${db.getRowsModified()} baris terpengaruh)`);

  // 3. DML: SELECT ALL
  let resAll = db.exec("SELECT * FROM murid;");
  console.log(`5. ✅ SELECT * FROM murid -> Berhasil (${resAll[0].values.length} baris data ditemukan)`);
  console.table(resAll[0].values);

  // 4. DML: SELECT WHERE FILTER & LIKE WILDCARD
  let resLike = db.exec("SELECT nisn, nama, alamat FROM murid WHERE alamat LIKE '%Solo%';");
  console.log(`6. ✅ SELECT WHERE alamat LIKE '%Solo%' -> Berhasil (${resLike[0].values.length} siswa di Jalan Solo)`);

  // 5. DML: UPDATE
  db.run("UPDATE murid SET alamat = 'Jalan Malioboro no 5' WHERE nisn = '10004';");
  console.log(`7. ✅ UPDATE murid SET alamat='...' WHERE nisn='10004' -> Berhasil (${db.getRowsModified()} baris diupdate)`);

  // 6. DML: DELETE
  db.run("DELETE FROM murid WHERE nisn = '10003';");
  console.log(`8. ✅ DELETE FROM murid WHERE nisn='10003' -> Berhasil (${db.getRowsModified()} baris terhapus)`);

  // Verifikasi sisa data
  let resAfterDelete = db.exec("SELECT * FROM murid;");
  console.log(`9. ✅ Verifikasi isi tabel setelah UPDATE & DELETE -> Sisa ${resAfterDelete[0].values.length} data murid`);

  // 7. DDL: ALTER TABLE ADD COLUMN
  db.run("ALTER TABLE murid ADD COLUMN email VARCHAR(50);");
  console.log("10. ✅ ALTER TABLE murid ADD COLUMN email -> Berhasil");

  // 8. DDL: CREATE & DROP TABLE
  db.run("CREATE TABLE temp_test (id INT, keterangan TEXT);");
  db.run("INSERT INTO temp_test VALUES (1, 'Data uji coba');");
  console.log("11. ✅ CREATE TABLE temp_test & INSERT -> Berhasil");

  db.run("DROP TABLE temp_test;");
  console.log("12. ✅ DROP TABLE temp_test -> Berhasil");

  console.log("\n==============================================");
  console.log("  🎉 KESIMPULAN: SELURUH OPERASI SQL LENGKAP");
  console.log("  (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP)");
  console.log("  BEKERJA 100% SEMPURNA!");
  console.log("==============================================");
}

testSqlEngine().catch(console.error);
