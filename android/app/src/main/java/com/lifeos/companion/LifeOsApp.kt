package com.lifeos.companion

import android.app.Application
import com.lifeos.companion.data.repository.TimeBucketColorStore
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.notifications.EveningReminderScheduler
import com.lifeos.companion.widgets.WidgetStateSync
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class LifeOsApp : Application() {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        SupabaseClientProvider.init(this)
        TimeBucketColorStore.init(this)
        OutboxManager.init(this)

        // Defer WorkManager & AlarmManager setup off the main thread for fast cold startup
        appScope.launch {
            OutboxManager.database()
            OutboxManager.scheduleSyncNow()
            EveningReminderScheduler.scheduleAll(this@LifeOsApp)
            TimeBucketColorStore.refreshFromRemote(this@LifeOsApp)
            WidgetStateSync.rebindAllAppWidgets(this@LifeOsApp)
        }
    }
}
