CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."purchase_type" AS ENUM('central', 'local');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('hub', 'spoke');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"category" text,
	"purchase_type" "purchase_type" NOT NULL,
	"price" numeric NOT NULL,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"manager" text,
	"type" "unit_type" NOT NULL,
	"status" "unit_status" DEFAULT 'active' NOT NULL
);
