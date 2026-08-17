alter table public.payment_transactions
  drop constraint if exists payment_transactions_status_check;

alter table public.payment_transactions
  add constraint payment_transactions_status_check
  check (status in ('pending', 'success', 'failed', 'abandoned', 'refunded'));
