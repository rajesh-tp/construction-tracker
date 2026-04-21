CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`construction_id` integer NOT NULL,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`contractor_id` integer,
	`initial_balance` real DEFAULT 0 NOT NULL,
	`current_balance` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_contractor_id` ON `accounts` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `idx_accounts_construction_id` ON `accounts` (`construction_id`);--> statement-breakpoint
CREATE TABLE `constructions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `contractors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`construction_id` integer NOT NULL,
	`name` text NOT NULL,
	`contractor_type` text NOT NULL,
	`contact_phone` text,
	`contact_email` text,
	`initial_balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_contractors_construction_id` ON `contractors` (`construction_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`construction_id` integer NOT NULL,
	`account_id` integer NOT NULL,
	`contractor_id` integer,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`notes` text,
	`receipt_path` text,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_construction_id` ON `transactions` (`construction_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_account_id` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_contractor_id` ON `transactions` (`contractor_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_date` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_transactions_date_type` ON `transactions` (`date`,`type`);--> statement-breakpoint
CREATE TABLE `user_constructions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`construction_id` integer NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_uc_user_id` ON `user_constructions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_uc_construction_id` ON `user_constructions` (`construction_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'contractor' NOT NULL,
	`contractor_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);