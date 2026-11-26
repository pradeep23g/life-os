package com.lifeos.companion

import android.app.Application
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.notifications.EveningReminderScheduler

class LifeOsApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SupabaseClientProvider.init(this)
        OutboxManager.init(this)
        OutboxManager.scheduleSyncNow()
        EveningReminderScheduler.scheduleAll(this)
    }
}
