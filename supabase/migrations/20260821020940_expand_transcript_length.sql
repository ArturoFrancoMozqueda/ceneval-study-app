alter table public.transcripts
  drop constraint transcripts_original_maximum;

alter table public.transcripts
  add constraint transcripts_original_maximum
  check (char_length(original_text) <= 200000);
