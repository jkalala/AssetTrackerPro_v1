-- Function to manually create profiles for existing users
CREATE OR REPLACE FUNCTION public.create_profiles_for_existing_users()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    created_count INTEGER := 0;
    error_count INTEGER := 0;
    result_text TEXT;
BEGIN
    -- Loop through all users in auth.users who don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            -- Insert profile for this user
            INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(
                    user_record.raw_user_meta_data->>'full_name',
                    user_record.raw_user_meta_data->>'name',
                    split_part(user_record.email, '@', 1)
                ),
                COALESCE(
                    user_record.raw_user_meta_data->>'avatar_url',
                    user_record.raw_user_meta_data->>'picture'
                ),
                'user',
                user_record.created_at
            );
            
            created_count := created_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error creating profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    result_text := format('Profile creation complete. Created: %s, Errors: %s', created_count, error_count);
    RAISE NOTICE '%', result_text;
    RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create missing profiles
SELECT public.create_profiles_for_existing_users();

-- Verify the results
SELECT 
    'Total auth users' as type, 
    count(*) as count 
FROM auth.users
UNION ALL
SELECT 
    'Total profiles' as type, 
    count(*) as count 
FROM public.profiles
UNION ALL
SELECT 
    'Missing profiles' as type, 
    count(*) as count 
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
