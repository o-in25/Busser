import { LogLevel, type Log } from "$lib/types";
import moment from "moment";

import { DbProvider } from "./db";

export class Logger {
  private static db = new DbProvider('user_t')

  static async info(message: string): Promise<void> {
    try {
      await Logger.db.table<Log>('log').insert({
        logLevelId: 1,
        logMessage: message,
        logDate: moment().format('YYYY-MM-DD HH:MM:SS'),
        logStackTrace: null
      });
    } catch(error: any) {
      console.error(error);
    }

  }

  static async error(message: string): Promise<void> {

    try {
      await Logger.db.table<Log>('log').insert({
        logLevelId: 2,
        logMessage: message,
        logDate: moment().format('YYYY-MM-DD HH:MM:SS'),
        logStackTrace: null
      });
    } catch(error: any) {
      console.error(error);
    }


  }

  static now() {
    return moment().format('YYYY-MM-DD HH:MM:SS')
  }
}
