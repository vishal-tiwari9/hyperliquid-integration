CREATE TYPE "public"."order_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'open', 'filled', 'partially_filled', 'cancelled', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('market', 'limit');--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"razorpay_payment_id" varchar(100),
	"amount_inr" numeric(15, 2) NOT NULL,
	"amount_usdc" numeric(20, 6),
	"exchange_rate" numeric(10, 4),
	"status" varchar(20) DEFAULT 'pending',
	"tx_hash" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deposits_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hl_order_id" bigint,
	"coin" varchar(20) NOT NULL,
	"side" "order_side" NOT NULL,
	"order_type" "order_type" NOT NULL,
	"size" numeric(20, 8) NOT NULL,
	"price" numeric(20, 8),
	"leverage" integer DEFAULT 1,
	"reduce_only" boolean DEFAULT false,
	"tp_price" numeric(20, 8),
	"sl_price" numeric(20, 8),
	"status" "order_status" DEFAULT 'pending',
	"fill_price" numeric(20, 8),
	"fill_size" numeric(20, 8),
	"explorer_url" text,
	"network" varchar(20) DEFAULT 'testnet',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "chain" SET DEFAULT 'arbitrum';--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "preferred_network" varchar(20) DEFAULT 'testnet';--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;