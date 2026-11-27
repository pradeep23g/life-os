import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { TIME_BUCKETS, TIME_BUCKET_COLORS, type TimeBucket } from './useTimeLogs'

export const timeBucketColorsQueryKey = ['time-os', 'bucket-colors'] as const

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim())
}

async function fetchTimeBucketColors(): Promise<Record<TimeBucket, string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ...TIME_BUCKET_COLORS }
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('time_bucket_colors')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data?.time_bucket_colors || typeof data.time_bucket_colors !== 'object') {
    return { ...TIME_BUCKET_COLORS }
  }

  const raw = data.time_bucket_colors as Record<string, unknown>
  const merged: Record<TimeBucket, string> = { ...TIME_BUCKET_COLORS }
  for (const bucket of TIME_BUCKETS) {
    const candidate = raw[bucket]
    if (isValidHex(candidate)) {
      merged[bucket] = candidate.trim()
    }
  }
  return merged
}

export function useTimeBucketColors() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: timeBucketColorsQueryKey,
    queryFn: fetchTimeBucketColors,
    staleTime: 60_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel('user_settings_time_bucket_colors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings' },
        () => {
          void queryClient.invalidateQueries({ queryKey: timeBucketColorsQueryKey })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    bucketColors: query.data ?? TIME_BUCKET_COLORS,
    isLoading: query.isLoading,
  }
}
