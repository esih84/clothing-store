namespace NodeJS {
  interface ProcessEnv {
    //* application
    PORT: number;
    //* Database
    DB_PORT: string;
    DB_NAME: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    JWT_SECRET: string;
  }
}
