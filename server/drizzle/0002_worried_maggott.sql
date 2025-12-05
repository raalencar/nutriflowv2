CREATE TYPE "public"."production_plan_status" AS ENUM('planned', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'received');--> statement-breakpoint
CREATE TYPE "public"."stock_transaction_type" AS ENUM('IN', 'OUT', 'ADJUST');--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"type" "stock_transaction_type" NOT NULL,
	"quantity" numeric NOT NULL,
	"cost" numeric DEFAULT '0',
	"reference_id" text,
	"reason" text,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "production_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"date" text NOT NULL,
	"quantity" numeric NOT NULL,
	"status" "production_plan_status" DEFAULT 'planned' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric NOT NULL,
	"cost" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"supplier" text NOT NULL,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"total_value" numeric DEFAULT '0',
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"min_stock" numeric DEFAULT '0',
	"avg_cost" numeric DEFAULT '0',
	CONSTRAINT "stocks_product_id_unit_id_unique" UNIQUE("product_id","unit_id")
);
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_order_id_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;