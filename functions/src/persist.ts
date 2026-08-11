import {executeQuery} from "./snowflake.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {randomUUID} from "node:crypto";

/**
 DDL for Snowflake setup:

 -- Create the stage for file uploads
 CREATE STAGE IF NOT EXISTS uploads;

 -- Create the table to store report metadata
 CREATE TABLE IF NOT EXISTS reports (
 id STRING DEFAULT UUID_STRING(),
 created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
 lat FLOAT,
 lon FLOAT,
 audio_path STRING,
 image_path STRING,
 PRIMARY KEY (id)
 );
 */

/**
 * Persists report data to Snowflake.
 * 1. Saves buffers to temporary files.
 * 2. Uploads files to Snowflake stage '@uploads'.
 * 3. Inserts metadata into 'reports' table.
 */
export async function persist(audio: Buffer, image: Buffer, loc: {
  lat: number | null;
  lon: number | null,
  desc: string
}) {
  const id = randomUUID();
  const audioFilename = `${id}.webm`;
  const imageFilename = `${id}.png`;

  const audioTmpPath = path.join(os.tmpdir(), audioFilename);
  const imageTmpPath = path.join(os.tmpdir(), imageFilename);

  try {
    // Write buffers to temporary storage in /tmp (only writable dir in Cloud Functions)
    await fs.writeFile(audioTmpPath, audio);
    await fs.writeFile(imageTmpPath, image);

    // Upload files to Snowflake stage
    // Note: Snowflake PUT requires absolute local paths. 
    // We use forward slashes for cross-platform compatibility in the SQL string.
    const audioPutSql = `PUT 'file://${audioTmpPath.replace(/\\/g, "/")}' @uploads_audio AUTO_COMPRESS=FALSE`;
    const imagePutSql = `PUT 'file://${imageTmpPath.replace(/\\/g, "/")}' @uploads AUTO_COMPRESS=FALSE`;

    await executeQuery(audioPutSql);
    await executeQuery(imagePutSql);

    // Insert record into the reports table
    const insertSql = `
        INSERT INTO reports (lat, lon, audio_path, image_path, geo_desc)
        VALUES (?, ?, ?, ?, ?)
    `;

    await executeQuery(insertSql, [
      loc.lat,
      loc.lon,
      `@uploads_audio/${audioFilename}`,
      `@uploads/${imageFilename}`
    ]);

  } finally {
    // Clean up temporary files regardless of success/failure
    await Promise.all([
      fs.unlink(audioTmpPath).catch(() => {
      }),
      fs.unlink(imageTmpPath).catch(() => {
      })
    ]);
  }
}
