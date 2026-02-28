UPDATE deployments 
SET config = jsonb_set(
  config::jsonb,
  '{title_generation_context}',
  jsonb_build_object(
    'topic', config::jsonb->>'topic',
    'source_urls', config::jsonb->>'source_urls',
    'writing_focus', COALESCE(config::jsonb->>'writing_focus', ''),
    'target_audience', COALESCE(config::jsonb->>'target_audience', ''),
    'tone', COALESCE(config::jsonb->>'tone', '')
  )
)
WHERE id = '3ffe392d-9abc-4b6a-a7f3-e0ddf841250a'