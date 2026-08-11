import snowflake from "snowflake-sdk";
import {defineSecret} from "firebase-functions/params";

// Configure via Google Cloud Secret Manager:
//   firebase functions:secrets:set SNOWFLAKE_ACCOUNT
//   firebase functions:secrets:set SNOWFLAKE_USERNAME
//   firebase functions:secrets:set SNOWFLAKE_PASSWORD
export const snowflakeAccount = '[SNOWFLAKE-ACCOUNT]'
export const snowflakeUsername = '[SNOWFLAKE-USERNAME]'
export const snowflakePassword = '[SNOWFLAKE-TOKEN]'
export const snowflakeDatabase = 'CIVIL42';
export const snowflakeSchema = 'public';
export const snowflakeWarehouse = 'civil42wh';

export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  const connection = snowflake.createConnection({
    account: snowflakeAccount,
    username: snowflakeUsername,
    password: snowflakePassword,
    database: snowflakeDatabase,
    schema: snowflakeSchema,
    warehouse: snowflakeWarehouse,
  });

  return new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error("Unable to connect: " + err.message);
        reject(err);
        return;
      }

      conn.execute({
        sqlText: sql,
        binds: params,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("Failed to execute statement: " + err.message);
            reject(err);
          } else {
            resolve(rows || []);
          }
          // Close connection
          conn.destroy((err) => {
            if (err) {
              console.error("Unable to disconnect: " + err.message);
            }
          });
        },
      });
    });
  });
}
