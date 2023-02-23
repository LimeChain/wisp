import { Injectable } from '@nestjs/common';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements MongooseOptionsFactory {
  constructor(private configService: ConfigService) {}
  createMongooseOptions(): MongooseModuleOptions {
    const uri: string = this.configService.get('mongodb.uri');
    if (!uri) {
      throw new Error('MongoDB URI is not defined');
    }

    return {
      uri,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectionFactory: (connection: Connection) => {
        connection.plugin(uniqueValidator);
        return connection;
      },
    };
  }
}
