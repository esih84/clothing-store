import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function pagination(page: number = 1, limit: number = 10) {
  return applyDecorators(
    ApiQuery({
      name: "page",
      type: "integer",
      example: page,
      required: false,
      description: "Page number (default: 1)",
    }),
    // Swagger documentation for `limit`
    ApiQuery({
      name: "limit",
      type: "integer",
      example: limit,
      required: false,
      description: "Number of items per page (default: 10)",
    })
  );
}
