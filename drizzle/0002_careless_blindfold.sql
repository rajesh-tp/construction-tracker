ALTER TABLE `attendance` ADD `payment_transaction_id` integer REFERENCES transactions(id);--> statement-breakpoint
CREATE INDEX `idx_attendance_payment_txn` ON `attendance` (`payment_transaction_id`);