import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import busboy from "busboy";
import {Readable} from "stream";
import {persist} from "./persist.js";
import {whatIsAtLocation} from "./whatIsAtLocation.js";

/**
 * Interface for extracted file data from multipart/form-data request.
 */
interface ParsedFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

/**
 * Interface for extracted form fields from multipart/form-data request.
 */
interface ReportFields {
  lat?: string;
  lon?: string;

  [key: string]: string | undefined;
}

/**
 * Cloud Function to receive multipart/form-data reports containing voice, image, and GPS data.
 *
 * Expected request body:
 * - voice (file): The voice recording in .webm format.
 * - image (file): The captured image in .jpg format.
 * - lat (field): Latitude as string.
 * - lon (field): Longitude as string.
 */
export const report = onRequest(async (req, res) => {
  // Only POST requests are accepted
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const bb = busboy({headers: req.headers});
  const fields: ReportFields = {};
  const files: Record<string, ParsedFile> = {};
  const filePromises: Promise<void>[] = [];

  // Parse non-file form fields
  bb.on("field", (fieldname: string, val: string) => {
    fields[fieldname] = val;
  });

  // Parse file uploads
  bb.on("file", (fieldname: string, file: Readable, info: busboy.FileInfo) => {
    const {filename, mimeType} = info;
    const chunks: Buffer[] = [];
    const promise = new Promise<void>((resolve, reject) => {
      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });
      file.on("end", () => {
        files[fieldname] = {
          buffer: Buffer.concat(chunks),
          filename,
          mimetype: mimeType,
        };
        resolve();
      });
      file.on("error", (err: unknown) => {
        reject(err);
      });
    });
    filePromises.push(promise);
  });

  // Finalize processing once the stream is closed
  bb.on("close", async () => {
    try {
      // Wait for all file buffers to be fully read
      await Promise.all(filePromises);

      const lat = fields.lat ? Number(fields.lat) : null;
      const lon = fields.lon ? Number(fields.lon) : null;
      const voice = files["voice"];
      const image = files["image"];

      // Validate all required fields and files are present
      const geoDesc = (lat && lon) ? await whatIsAtLocation({lat,lon}) : ''
      logger.info("Report processed successfully", {
        lat,
        lon,
        voiceSize: voice.buffer.length,
        imageSize: image.buffer.length,
      });

      // TODO: Implement storage/database logic here
      // For example:
      // const bucket = getStorage().bucket();
      // await bucket.file(`reports/${Date.now()}_voice.webm`).save(voice.buffer);
      // await bucket.file(`reports/${Date.now()}_image.jpg`).save(image.buffer);

      await persist(
        voice.buffer,
        image.buffer,
        {lat, lon, desc: geoDesc}
      )
      res.status(200).send("Report received successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error finalizing multipart processing", {error: errorMessage});
      if (!res.headersSent) {
        res.status(500).send(errorMessage);
      }
    }
  });

  // Handle busboy parsing errors
  bb.on("error", (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Busboy parsing error", {error: errorMessage});
    if (!res.headersSent) {
      res.status(400).send("Malformed request");
    }
  });

  // Firebase Cloud Functions populate `req.rawBody` for us to use with Busboy
  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (rawBody) {
    bb.end(rawBody);
  } else {
    // If not using Node 20+ features where rawBody might be absent, fallback to pipe
    req.pipe(bb);
  }
});
