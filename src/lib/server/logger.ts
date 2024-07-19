import { LogLevel, type Log } from "$lib/types";
import moment from "moment";

import { DbProvider } from "./db";

const db = new DbProvider('user_t');

export async function info(message: string) {
  try {
     await db.table<Log>('log').insert({
      logLevelId: 1,
      logMessage: message,
      logDate: moment().format('YYYY-MM-DD HH:MM:SS'),
      logStackTrace: null
    })
  } catch(error: any) {
    console.error(error);
    return [];
  }
}