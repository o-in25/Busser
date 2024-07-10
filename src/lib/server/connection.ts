import { MongoClient, ServerApiVersion, type MongoClientOptions } from 'mongodb';
import { DATABASE } from '$env/static/private';

export class Connection {
  private static readonly database: string = DATABASE;
  // private static readonly uri: string = URI;
  private static readonly config: MongoClientOptions = { maxPoolSize: 10 };
  private static client: MongoClient | null = null;

  public static async getClient() {
    // if(!Connection.client) {
    //   Connection.client = await MongoClient.connect(Connection.uri, Connection.config);
    // }

    // return Connection.client.db(Connection.database);
  }

}