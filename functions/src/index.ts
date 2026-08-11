import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  executeQuery,
} from "./snowflake.js";

export {report} from "./report.js";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const querySnowflake = onRequest({
  secrets: []
}, async (request, response) => {
  try {
    const rows = await executeQuery("SELECT CURRENT_VERSION()");
    response.json({success: true, rows});
  } catch (error: any) {
    logger.error("Snowflake error", error);
    response.status(500).json({success: false, error: error.message});
  }
});
