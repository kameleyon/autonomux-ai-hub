UPDATE deployments 
SET config = jsonb_set(
  jsonb_set(
    config::jsonb,
    '{topic}',
    '"Choose a different card out of the 52 playing card and talk about the life pattern based on cardology and birth card system"'
  ),
  '{title_generation_context}',
  '{"topic": "Choose a different card out of the 52 playing card and talk about the life pattern based on cardology and birth card system", "source_urls": "", "writing_focus": "", "target_audience": "", "tone": ""}'
)
WHERE id = '3ffe392d-9abc-4b6a-a7f3-e0ddf841250a'