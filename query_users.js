import oracledb from 'oracledb';

async function main() {
  const conn = await oracledb.getConnection({
    user: process.env.ORACLE_DB_USER,
    password: process.env.ORACLE_DB_PASSWORD,
    connectString: process.env.ORACLE_DB_CONNECT_STRING
  });
  try {
    const res = await conn.execute("SELECT column_name FROM user_tab_cols WHERE table_name = 'USERS'");
    console.log("USERS columns:", res.rows.map(r => r[0]));
  } finally {
    await conn.close();
  }
}
main().catch(console.error);
