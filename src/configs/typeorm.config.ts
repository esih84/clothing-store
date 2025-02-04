import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function TypeormConfig(): TypeOrmModuleOptions {
  const { DB_PORT, DB_NAME, DB_HOST, DB_USERNAME, DB_PASSWORD } = process.env;
  return {
    type: "postgres",
    port: +DB_PORT,
    database: DB_NAME,
    host: DB_HOST,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    synchronize: true,
    autoLoadEntities: false,
    entities: [
      "dist/**/**/**/*.entity{.ts,.js}",
      "dist/**/**/*.entity{.ts,.js}",
    ],
  };
}
