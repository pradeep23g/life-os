import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

function readEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env')
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split(/\r?\n/)
  const env = {}

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separator = line.indexOf('=')
    if (separator < 0) {
      continue
    }

    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    env[key] = value
  }

  return env
}

function toIndiaDateKey(input = new Date()) {
  const value = input instanceof Date ? input : new Date(input)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function getWeekStartDateISO(date = new Date()) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setDate(value.getDate() + diff)
  value.setHours(0, 0, 0, 0)
  return value.toISOString().slice(0, 10)
}

function assertNoError(error, context) {
  if (error) {
    const code = typeof error.code === 'string' ? error.code : 'unknown'
    const message = typeof error.message === 'string' ? error.message : String(error)
    throw new Error(`${context} failed (${code}): ${message}`)
  }
}

async function main() {
  const env = readEnvFile()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  }

  const supabase = createClient(url, key)
  const providedEmail = process.env.SMOKE_TEST_EMAIL?.trim() || ''
  const providedPassword = process.env.SMOKE_TEST_PASSWORD?.trim() || ''
  const email = providedEmail || `lifeossmoke${Date.now()}@gmail.com`
  const password = providedPassword || `LifeOS!${Math.floor(Math.random() * 1_000_000)}`
  const todayKey = toIndiaDateKey()
  const weekStart = getWeekStartDateISO()

  const results = []
  const expectedEventTypes = []

  const track = (name, status, detail = '') => {
    results.push({ name, status, detail })
  }

  const addExpectedEvent = (eventType) => {
    expectedEventTypes.push(eventType)
  }

  const logEvent = async ({ userId, domain, entityType, entityId = null, eventType, payload = {} }) => {
    const { error } = await supabase.from('events').insert({
      user_id: userId,
      domain,
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      event_date_ist: todayKey,
      payload,
      created_at: new Date().toISOString(),
    })
    assertNoError(error, `event ${eventType}`)
    addExpectedEvent(eventType)
  }

  let session = null

  if (providedEmail && providedPassword) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: providedEmail,
      password: providedPassword,
    })
    assertNoError(signInError, 'auth.signInWithPassword (provided credentials)')
    session = signInData.session
  } else {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    assertNoError(signUpError, 'auth.signUp')

    if (!signUpData.user) {
      throw new Error('Sign-up did not return a user.')
    }

    session = signUpData.session

    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError?.code === 'email_not_confirmed') {
        throw new Error(
          'Smoke auto-user cannot sign in because email confirmation is enabled. Provide SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD for a confirmed account.',
        )
      }
      assertNoError(signInError, 'auth.signInWithPassword')
      session = signInData.session
    }
  }

  if (!session) {
    throw new Error('No auth session available after authentication.')
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  assertNoError(userError, 'auth.getUser')

  const userId = userData.user?.id

  if (!userId) {
    throw new Error('Authenticated user is missing.')
  }

  track('Auth bootstrap (temp user)', 'PASS', email)

  let testFailed = false;
  try {
    const { data: habitData, error: habitError } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        title: 'Smoke Habit Binary',
        habit_type: 'binary',
        target_value: 1,
        unit: null,
      })
      .select('id')
      .single()
    assertNoError(habitError, 'habit create')
    track('Mind OS - create habit', 'PASS')
    await logEvent({
      userId,
      domain: 'mind-os',
      entityType: 'habit',
      entityId: habitData.id,
      eventType: 'mind.habit.created',
      payload: { habitType: 'binary', targetValue: 1 },
    })

    const { error: habitDoneError } = await supabase.from('habit_logs').upsert(
      {
        habit_id: habitData.id,
        user_id: userId,
        value: 1,
        log_date: todayKey,
        logged_at: new Date().toISOString(),
        struggle_note: 'smoke run',
      },
      {
        onConflict: 'habit_id,log_date',
      },
    )
    assertNoError(habitDoneError, 'habit mark done')
    track('Mind OS - mark done', 'PASS')
    await logEvent({
      userId,
      domain: 'mind-os',
      entityType: 'habit_log',
      entityId: habitData.id,
      eventType: 'mind.habit.completed',
      payload: { value: 1, logDate: todayKey },
    })

    const { error: habitNotDoneError } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitData.id)
      .eq('user_id', userId)
      .eq('log_date', todayKey)
    assertNoError(habitNotDoneError, 'habit mark not done')
    track('Mind OS - mark not done', 'PASS')
    await logEvent({
      userId,
      domain: 'mind-os',
      entityType: 'habit_log',
      entityId: habitData.id,
      eventType: 'mind.habit.uncompleted',
      payload: { logDate: todayKey },
    })

    const { data: breakData, error: breakCreateError } = await supabase
      .from('habit_streak_breaks')
      .insert({
        habit_id: habitData.id,
        user_id: userId,
        break_date: todayKey,
        reason: 'smoke reason',
      })
      .select('id')
      .single()
    assertNoError(breakCreateError, 'habit break create')

    const { error: healInsertError } = await supabase.from('habit_streak_heals').insert({
      habit_id: habitData.id,
      user_id: userId,
      break_id: breakData.id,
      reason: 'smoke heal',
    })
    assertNoError(healInsertError, 'habit heal insert')

    const { error: breakHealUpdateError } = await supabase
      .from('habit_streak_breaks')
      .update({ healed_at: new Date().toISOString() })
      .eq('id', breakData.id)
      .eq('user_id', userId)
    assertNoError(breakHealUpdateError, 'habit break heal update')
    track('Mind OS - heal streak break', 'PASS')
    await logEvent({
      userId,
      domain: 'mind-os',
      entityType: 'habit_break',
      entityId: breakData.id,
      eventType: 'mind.habit_break.healed',
      payload: { habitId: habitData.id },
    })

    const { error: journalError } = await supabase.from('journal_entries').insert({
      user_id: userId,
      mood: 4,
      what_went_good: 'smoke good',
      what_you_learned: 'smoke learned',
      brief_about_day: 'smoke brief',
    })
    assertNoError(journalError, 'journal create')
    track('Mind OS - journal create', 'PASS')
    await logEvent({
      userId,
      domain: 'mind-os',
      entityType: 'journal_entry',
      eventType: 'mind.journal_entry.created',
      payload: { mood: 4 },
    })

    const { data: taskData, error: taskCreateError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: 'Smoke Task',
        deadline_type: 'no_deadline',
        is_completed: false,
      })
      .select('id')
      .single()
    assertNoError(taskCreateError, 'task create')
    track('Productivity - task create', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'task',
      entityId: taskData.id,
      eventType: 'productivity.task.created',
      payload: { deadline_type: 'no_deadline', deadline_date: null, is_completed: false },
    })

    const { error: taskStatusError } = await supabase
      .from('tasks')
      .update({ is_completed: true, updated_at: new Date().toISOString() })
      .eq('id', taskData.id)
      .eq('user_id', userId)
    assertNoError(taskStatusError, 'task status update')
    track('Productivity - task status change', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'task',
      entityId: taskData.id,
      eventType: 'productivity.task.status_changed',
      payload: { is_completed: true, status: 'Done' },
    })

    const { data: weeklyPlanData, error: weeklyPlanCreateError } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: userId,
        focus_text: 'Smoke weekly focus',
        week_start_date: weekStart,
      })
      .select('id')
      .single()
    assertNoError(weeklyPlanCreateError, 'weekly plan create')
    track('Productivity - weekly plan create', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'weekly_plan',
      entityId: weeklyPlanData.id,
      eventType: 'productivity.weekly_plan.created',
      payload: { weekStartDate: weekStart },
    })

    const { error: weeklyPlanUpdateError } = await supabase
      .from('weekly_plans')
      .update({ focus_text: 'Smoke weekly focus updated', week_start_date: weekStart })
      .eq('id', weeklyPlanData.id)
      .eq('user_id', userId)
    assertNoError(weeklyPlanUpdateError, 'weekly plan update')
    track('Productivity - weekly plan update', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'weekly_plan',
      entityId: weeklyPlanData.id,
      eventType: 'productivity.weekly_plan.updated',
      payload: { weekStartDate: weekStart },
    })

    const { data: goalData, error: goalCreateError } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        title: 'Smoke Goal',
        domain: 'productivity-hub',
        status: 'active',
        notes: 'smoke goal notes',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    assertNoError(goalCreateError, 'goal create')
    track('Productivity - goal create', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'goal',
      entityId: goalData.id,
      eventType: 'productivity.goal.created',
      payload: { domain: 'productivity-hub' },
    })

    const { data: planItemData, error: planItemCreateError } = await supabase
      .from('weekly_plan_items')
      .insert({
        user_id: userId,
        week_start_date: weekStart,
        title: 'Smoke plan item',
        priority: 'High',
        order_index: 0,
        status: 'Planned',
        goal_id: goalData.id,
        linked_task_id: taskData.id,
        linked_habit_id: habitData.id,
        notes: 'smoke item notes',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    assertNoError(planItemCreateError, 'plan item create')
    track('Productivity - weekly item create/link', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'weekly_plan_item',
      entityId: planItemData.id,
      eventType: 'productivity.weekly_plan_item.created',
      payload: {
        weekStartDate: weekStart,
        linkedToGoal: true,
        linkedToTask: true,
        linkedToHabit: true,
      },
    })

    const { error: planItemUpdateError } = await supabase
      .from('weekly_plan_items')
      .update({ status: 'Doing', updated_at: new Date().toISOString() })
      .eq('id', planItemData.id)
      .eq('user_id', userId)
    assertNoError(planItemUpdateError, 'plan item update')
    track('Productivity - weekly item status update', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'weekly_plan_item',
      entityId: planItemData.id,
      eventType: 'productivity.weekly_plan_item.updated',
      payload: { status: 'Doing', goalId: goalData.id },
    })

    const { data: reviewData, error: reviewUpsertError } = await supabase
      .from('weekly_reviews')
      .upsert(
        {
          user_id: userId,
          week_start_date: weekStart,
          wins: 'smoke wins',
          blockers: 'smoke blockers',
          next_adjustments: 'smoke next',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,week_start_date' },
      )
      .select('id')
      .single()
    assertNoError(reviewUpsertError, 'weekly review upsert')
    track('Productivity - weekly review upsert', 'PASS')
    await logEvent({
      userId,
      domain: 'productivity-hub',
      entityType: 'weekly_review',
      entityId: reviewData.id,
      eventType: 'productivity.weekly_review.upserted',
      payload: { weekStartDate: weekStart },
    })
    // --- Learning OS ---
    const { data: roadmapData, error: roadmapError } = await supabase
      .from('learning_roadmaps')
      .insert({
        user_id: userId,
        title: 'Smoke Roadmap',
        status: 'active'
      })
      .select('id')
      .single()
    assertNoError(roadmapError, 'roadmap create')
    track('Learning - roadmap create', 'PASS')
    await logEvent({
      userId,
      domain: 'learning-os',
      entityType: 'roadmap',
      entityId: roadmapData.id,
      eventType: 'learning.roadmap.created',
      payload: { status: 'active' }
    })

    const { data: stageData, error: stageError } = await supabase
      .from('learning_stages')
      .insert({
        user_id: userId,
        roadmap_id: roadmapData.id,
        order_index: 0,
        title: 'Smoke Stage',
        is_skipped: false
      })
      .select('id')
      .single()
    assertNoError(stageError, 'stage create')

    const { data: sessionData, error: sessionError } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: userId,
        stage_id: stageData.id,
        order_index: 0,
        title: 'Smoke Session',
        is_skipped: false,
        tags: []
      })
      .select('id')
      .single()
    assertNoError(sessionError, 'learning session create')

    const { error: sessionLogError } = await supabase
      .from('learning_session_logs')
      .insert({
        user_id: userId,
        session_id: sessionData.id,
        roadmap_id: roadmapData.id,
        logged_at: new Date().toISOString(),
        duration_minutes: 30,
        metrics: {}
      })
    assertNoError(sessionLogError, 'learning session log')
    track('Learning - session logged', 'PASS')
    await logEvent({
      userId,
      domain: 'learning-os',
      entityType: 'learning_session_log',
      entityId: sessionData.id,
      eventType: 'learning.session.logged',
      payload: { durationMinutes: 30 }
    })

    // --- Fitness OS ---
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        workout_date: todayKey,
        title: 'Smoke Workout'
      })
      .select('id')
      .single()
    assertNoError(workoutError, 'workout create')
    track('Fitness - workout create', 'PASS')
    await logEvent({
      userId,
      domain: 'fitness-os',
      entityType: 'workout',
      entityId: workoutData.id,
      eventType: 'fitness.workout.created'
    })

    // --- Time OS ---
    const { data: timeLogData, error: timeLogError } = await supabase
      .from('time_logs')
      .insert({
        user_id: userId,
        bucket: 'Deep Work',
        duration_minutes: 25,
        start_time: new Date().toISOString()
      })
      .select('id')
      .single()
    assertNoError(timeLogError, 'time log create')
    track('Time - session logged', 'PASS')
    await logEvent({
      userId,
      domain: 'time-os',
      entityType: 'time_log',
      entityId: timeLogData.id,
      eventType: 'time.session.logged',
      payload: { durationMinutes: 25 }
    })

    // --- Finance OS ---
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: 15.5,
        type: 'expense',
        category: 'Smoke',
        timestamp: new Date().toISOString()
      })
      .select('id')
      .single()
    assertNoError(txError, 'transaction create')
    track('Finance - transaction create', 'PASS')
    await logEvent({
      userId,
      domain: 'finance-os',
      entityType: 'transaction',
      entityId: txData.id,
      eventType: 'finance.transaction.created',
      payload: { amount: 15.5, type: 'expense' }
    })


    const { data: eventRows, error: eventQueryError } = await supabase
      .from('events')
      .select('event_type, event_date_ist')
      .eq('user_id', userId)
    assertNoError(eventQueryError, 'events verification query')

    const countByType = new Map()
    let wrongDateCount = 0

    for (const row of eventRows ?? []) {
      countByType.set(row.event_type, (countByType.get(row.event_type) ?? 0) + 1)
      if (row.event_date_ist !== todayKey) {
        wrongDateCount += 1
      }
    }

    let missingEvents = 0
    let duplicateEvents = 0

    for (const eventType of expectedEventTypes) {
      const count = countByType.get(eventType) ?? 0
      if (count < 1) {
        missingEvents += 1
      }
      if (count > 1) {
        duplicateEvents += 1
      }
    }

    track('Events - expected event types present', missingEvents === 0 ? 'PASS' : 'FAIL', `${missingEvents} missing`)
    track('Events - one event per triggered action', duplicateEvents === 0 ? 'PASS' : 'FAIL', `${duplicateEvents} duplicate types`)
    track('Events - IST date bucket', wrongDateCount === 0 ? 'PASS' : 'FAIL', `${wrongDateCount} wrong date rows`)
    // --- SQL View Verification ---
    const { error: view1Error } = await supabase.from('current_day_snapshot').select('*').eq('user_id', userId).limit(1)
    assertNoError(view1Error, 'query current_day_snapshot view')
    
    const { error: view2Error } = await supabase.from('current_day_snapshot_history_14d').select('*').eq('user_id', userId).limit(1)
    assertNoError(view2Error, 'query current_day_snapshot_history_14d view')

    const { error: view3Error } = await supabase.from('data_lab_daily_activity_90d').select('*').eq('user_id', userId).limit(1)
    assertNoError(view3Error, 'query data_lab_daily_activity_90d view')
    
    track('SQL Views - read without errors', 'PASS')

    } catch (err) {
    testFailed = true;
    console.error('Runtime failure during smoke test:\n', err);
    track('Runtime Execution', 'FAIL', err.message);
  } finally {
    // --- Cleanup ---
    // Delete all data created by temp user
    try {
      await supabase.from('transactions').delete().eq('user_id', userId)
      await supabase.from('time_logs').delete().eq('user_id', userId)
      await supabase.from('exercise_logs').delete().eq('user_id', userId)
      await supabase.from('fitness_exercises').delete().eq('user_id', userId)
      await supabase.from('workouts').delete().eq('user_id', userId)
      await supabase.from('learning_session_logs').delete().eq('user_id', userId)
      await supabase.from('learning_sessions').delete().eq('user_id', userId)
      await supabase.from('learning_stages').delete().eq('user_id', userId)
      await supabase.from('learning_roadmaps').delete().eq('user_id', userId)
      
      await supabase.from('weekly_reviews').delete().eq('user_id', userId)
      await supabase.from('weekly_plan_items').delete().eq('user_id', userId)
      await supabase.from('goals').delete().eq('user_id', userId)
      await supabase.from('weekly_plans').delete().eq('user_id', userId)
      await supabase.from('tasks').delete().eq('user_id', userId)
      await supabase.from('journal_entries').delete().eq('user_id', userId)
      await supabase.from('habit_streak_heals').delete().eq('user_id', userId)
      await supabase.from('habit_streak_breaks').delete().eq('user_id', userId)
      await supabase.from('habit_logs').delete().eq('user_id', userId)
      await supabase.from('habits').delete().eq('user_id', userId)
      await supabase.from('events').delete().eq('user_id', userId)
      track('Cleanup - remove test data', 'PASS')
    } catch (err) {
      track('Cleanup - remove test data', 'FAIL', err.message)
    }
  }




  console.log('Smoke Validation Report')
  console.log('='.repeat(80))
  for (const row of results) {
    const suffix = row.detail ? ` | ${row.detail}` : ''
    console.log(`${row.status.padEnd(4)} | ${row.name}${suffix}`)
  }
  console.log('='.repeat(80))
  console.log(`Temp user: ${email}`)
  console.log(`Total checks: ${results.length}`)

  const failed = results.filter((row) => row.status === 'FAIL')
  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Smoke validation failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
