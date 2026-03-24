UPDATE `users` u
JOIN (
    -- For each user, extract first letter of every word in name
    WITH RECURSIVE word_positions AS (
        SELECT
            u2.`id`                  AS user_id,
            1                        AS pos,
            TRIM(u2.`name`)          AS full_name
        FROM `users` u2
        WHERE u2.`company_initials` IS NULL
          AND u2.`name`              IS NOT NULL
          AND TRIM(u2.`name`)        != ''

        UNION ALL

        SELECT
            user_id,
            pos + 1,
            full_name
        FROM word_positions
        WHERE pos < CHAR_LENGTH(full_name)
    )
    SELECT
        user_id,
        GROUP_CONCAT(
            UPPER(SUBSTRING(full_name, pos, 1))
            ORDER BY pos
            SEPARATOR ''
        ) AS initials
    FROM word_positions
    WHERE pos = 1
       OR SUBSTRING(full_name, pos - 1, 1) = ' '
    GROUP BY user_id
) AS derived ON derived.`user_id` = u.`id`
SET u.`company_initials` = derived.`initials`
WHERE u.`company_initials` IS NULL;

