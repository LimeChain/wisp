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
    // const uri: string = process.env.MONGODB_URI;
    // if (!uri) {
    //   throw new Error('MongoDB URI is not defined');
    // }

    return {
      uri: '',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectionFactory: (connection: Connection) => {
        connection.plugin(uniqueValidator);
        return connection;
      },
    };
  }
}
