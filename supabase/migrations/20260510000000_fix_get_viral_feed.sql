CREATE OR REPLACE FUNCTION public.get_viral_feed(limit_count integer DEFAULT 50)
RETURNS TABLE (
    id uuid,
    author_id uuid,
    content text,
    media_urls text[],
    created_at timestamp with time zone,
    like_count integer,
    comment_count integer,
    music_url text,
    music_title text,
    music_artist text,
    author_username text,
    author_full_name text,
    author_avatar_url text,
    author_followers_count integer,
    author_is_creator boolean,
    viral_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.content,
    p.media_urls,
    p.created_at,
    COALESCE(p.like_count, 0) as like_count,
    COALESCE(p.comment_count, 0) as comment_count,
    p.music_url,
    p.music_title,
    p.music_artist,
    pr.username as author_username,
    pr.full_name as author_full_name,
    pr.avatar_url as author_avatar_url,
    COALESCE(pr.followers_count, 0) as author_followers_count,
    pr.is_creator as author_is_creator,
    CAST(
      (COALESCE(p.like_count, 0) * 2) + 
      (COALESCE(p.comment_count, 0) * 5) +
      (100 / (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 2))
      AS double precision
    ) as viral_score
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.is_flagged = false OR p.is_flagged IS NULL
  ORDER BY viral_score DESC
  LIMIT limit_count;
END;
$$;
