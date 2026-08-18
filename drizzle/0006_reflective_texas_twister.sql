ALTER TABLE `lexicon_payment_webhook_events` MODIFY `processing_status` enum('processing','processed','ignored','failed') NOT NULL;
