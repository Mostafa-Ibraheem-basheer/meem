import { DatabaseError } from "pg";
import {
  DbConnectionError,
  TransactionError,
  ConstraintError,
  RepositoryError,
  AlreadyExistsError,
  NotFoundError,
  NonNegativeValueError,
  PositiveValueError,
  PromoCodeExhaustedError,
} from "./errors.js";

function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

function dbErrorMapper(error: DatabaseError) {
  switch (true) {
    // Connection errors
    case error.code?.startsWith("08"):
      return new DbConnectionError(error);

    // Transaction errors
    case error.code === "40001":
    case error.code === "40P01":
      return new TransactionError(error);

    // Constraint errors
    case error.code?.startsWith("23"):
      return new ConstraintError(error);

    // Data errors and anything else
    default:
      return new RepositoryError(error);
  }
}

function errorTranslator(error: ConstraintError): ConstraintError {
  const cause = error.cause;

  if (!(cause instanceof DatabaseError)) {
    return error;
  }

  switch (cause.constraint) {
    // Unique constraints
    case "users_email_key":
      return new AlreadyExistsError("user", "email", error);

    case "products_slug_key":
      return new AlreadyExistsError("product", "slug", error);

    case "products_sku_key":
      return new AlreadyExistsError("product", "SKU", error);

    case "categories_name_key":
      return new AlreadyExistsError("category", "name", error);

    case "categories_slug_key":
      return new AlreadyExistsError("category", "slug", error);

    case "refresh_tokens_token_hash_key":
      return new AlreadyExistsError("refresh token", "hash", error);

    case "promo_codes_code_key":
      return new AlreadyExistsError("promo code", "code", error);

    case "product_variants_sku_key":
      return new AlreadyExistsError("product variant", "SKU", error);

    // Foreign keys
    case "product_variants_product_id_fkey":
    case "product_categories_product_id_fkey":
      return new NotFoundError("product", error);

    case "product_categories_category_id_fkey":
      return new NotFoundError("category", error);

    case "refresh_tokens_user_id_fkey":
    case "orders_user_id_fkey":
      return new NotFoundError("user", error);

    case "order_items_order_id_fkey":
      return new NotFoundError("order", error);

    case "order_items_variant_id_fkey":
      return new NotFoundError("product variant", error);

    // Check constraints
    case "product_variants_price_check":
    case "product_variants_stock_check":
    case "orders_total_check":
      return new NonNegativeValueError(error);

    case "order_items_quantity_check":
    case "order_items_purchase_price_check":
      return new PositiveValueError(error);

    case "promo_codes_uses_left_check":
      return new PromoCodeExhaustedError(error);

    default:
      return error;
  }
}

export function handleDatabaseError(error: unknown) {
  if (!isDatabaseError(error)) {
    return error;
  }

  const mappedError = dbErrorMapper(error);

  if (!(mappedError instanceof ConstraintError)) {
    return mappedError;
  }

  return errorTranslator(mappedError);
}
