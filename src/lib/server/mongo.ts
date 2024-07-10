import { MongoClient } from 'mongodb';

export class MongoProvider {
  private static readonly uri: string = '';
  private static client: MongoClient | null = null;
  
  public static async connectTo(database: string) {
    if(!MongoProvider.client) {
      MongoProvider.client = await MongoClient.connect(MongoProvider.uri, {
        maxPoolSize: 10
      });
    }

    return MongoProvider.client.db(database);
  }
}