package com.lifeos.companion.data.sync

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.lifeos.companion.data.local.LifeOsDatabase
import com.lifeos.companion.data.local.PendingMutationEntity
import com.lifeos.companion.util.IstClock
import java.time.Instant
import java.util.UUID
import java.util.concurrent.TimeUnit

object OutboxManager {
    private const val UNIQUE_SYNC_WORK = "life_os_outbox_sync"

    @Volatile
    private var appContext: Context? = null

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    fun appContextOrNull(): Context? = appContext

    fun database(): LifeOsDatabase {
        val ctx = checkNotNull(appContext) { "OutboxManager.init(context) must be called first" }
        return LifeOsDatabase.get(ctx)
    }

    suspend fun enqueueAndSync(
        opType: String,
        entityId: String,
        payloadJson: String,
    ) {
        val now = Instant.now()
        val mutation = PendingMutationEntity(
            id = UUID.randomUUID().toString(),
            opType = opType,
            entityId = entityId,
            payloadJson = payloadJson,
            createdAtIso = now.toString(),
            eventDateIst = IstClock.toIstDateString(now),
        )
        database().dao().enqueueMutation(mutation)
        scheduleSyncNow()
    }

    fun scheduleSyncNow() {
        val ctx = appContext ?: return
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<OutboxSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(ctx).enqueueUniqueWork(
            UNIQUE_SYNC_WORK,
            ExistingWorkPolicy.APPEND_OR_REPLACE,
            request,
        )
    }
}
