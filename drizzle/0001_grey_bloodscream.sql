CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`construction_id` integer NOT NULL,
	`worker_id` integer NOT NULL,
	`date` text NOT NULL,
	`units` real NOT NULL,
	`wage_snapshot` real NOT NULL,
	`notes` text,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worker_id`) REFERENCES `workers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attendance_worker_id` ON `attendance` (`worker_id`);--> statement-breakpoint
CREATE INDEX `idx_attendance_date` ON `attendance` (`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_attendance_worker_date` ON `attendance` (`worker_id`,`date`);--> statement-breakpoint
CREATE TABLE `workers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`construction_id` integer NOT NULL,
	`contractor_id` integer NOT NULL,
	`name` text NOT NULL,
	`daily_wage` real NOT NULL,
	`phone` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`construction_id`) REFERENCES `constructions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workers_construction_id` ON `workers` (`construction_id`);--> statement-breakpoint
CREATE INDEX `idx_workers_contractor_id` ON `workers` (`contractor_id`);