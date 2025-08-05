-- Function to schedule scraping for all active projects
CREATE OR REPLACE FUNCTION schedule_project_scraping()
RETURNS void AS $$
DECLARE
    project_record RECORD;
BEGIN
    -- Loop through all active projects with URLs
    FOR project_record IN 
        SELECT id, website, github, twitter, discord
        FROM projects
        WHERE active = true
        AND (website IS NOT NULL OR github IS NOT NULL OR twitter IS NOT NULL OR discord IS NOT NULL)
    LOOP
        -- Insert into scraping queue if not already queued
        INSERT INTO scraping_queue (project_id, priority, status)
        VALUES (project_record.id, 5, 'pending')
        ON CONFLICT (project_id) 
        WHERE status IN ('pending', 'processing')
        DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get next project to scrape
CREATE OR REPLACE FUNCTION get_next_scraping_job()
RETURNS TABLE(
    queue_id UUID,
    project_id UUID,
    project_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH next_job AS (
        SELECT sq.id, sq.project_id
        FROM scraping_queue sq
        WHERE sq.status = 'pending'
        AND sq.attempts < 3
        ORDER BY sq.priority DESC, sq.scheduled_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE scraping_queue sq
    SET 
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    FROM next_job nj
    WHERE sq.id = nj.id
    RETURNING 
        sq.id as queue_id,
        sq.project_id,
        (
            SELECT jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'urls', jsonb_build_object(
                    'website', p.website,
                    'github', p.github,
                    'twitter', p.twitter,
                    'discord', p.discord
                )
            )
            FROM projects p
            WHERE p.id = sq.project_id
        ) as project_data;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_queue_status ON scraping_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scraping_queue_priority ON scraping_queue(priority DESC, scheduled_at ASC);
