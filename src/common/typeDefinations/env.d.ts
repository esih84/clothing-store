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
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    //*S3
    S3_SECRET_KEY: string;
    S3_ACCESS_KEY: string;
    S3_BUCKET_NAME: string;
    s3_ENDPOINT: string;
  }
}
