# NestJS Boilerplate

A robust and scalable NestJS boilerplate project with **Swagger API documentation** and **TypeORM** for database management.

## Features

- **Swagger Integration**: Automatically generated API documentation.
- **TypeORM Configuration**: Pre-configured for seamless database management.
- **Environment Configuration**: Uses `.env` for environment variables.
- **Modular Structure**: Organized into modules for better scalability.
- **Validation**: Built-in request validation using `class-validator` and `class-transformer`.
- **Error Handling**: Global exception filters for consistent error responses.

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/esih84/nestjs-boilerplate.git
   cd nestjs-boilerplate
   ```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy .env.example to .env:

```bash
cp .env.example .env
```

Update .env with your database credentials and other configurations.

4. Running the Project
   Start the development server:

npm run start:dev
Build and run the production server:

npm run build
npm run start:prod
