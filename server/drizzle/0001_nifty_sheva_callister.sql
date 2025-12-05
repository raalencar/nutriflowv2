CREATE TYPE "public"."recipe_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"gross_qty" numeric NOT NULL,
	"net_qty" numeric NOT NULL,
	"correction_factor" numeric NOT NULL,
	"unit" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"yield" numeric NOT NULL,
	"yield_unit" text NOT NULL,
	"prep_time" numeric NOT NULL,
	"instructions" text,
	"status" "recipe_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;