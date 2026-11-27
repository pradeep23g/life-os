package com.lifeos.companion.data.sync

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.lifeos.companion.data.local.LifeOsDatabase
import com.lifeos.companion.data.local.OutboxOpTypes
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
        coalesce: Boolean = true,
        debounceMillis: Long = 0L,
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
        val dao = database().dao()
        if (coalesce) {
            dao.coalesceAndEnqueue(mutation)
        } else {
            dao.enqueueMutation(mutation)
        }
        val effectiveDelay = if (debounceMillis > 0L) {
            debounceMillis
        } else if (opType == OutboxOpTypes.HABIT_SET_TODAY || opType == OutboxOpTypes.TASK_TOGGLE) {
            1_200L
        } else {
            0L
        }
        scheduleSyncNow(delayMillis = effectiveDelay)
    }

    fun scheduleSyncNow(delayMillis: Long = 0L) {
        val ctx = appContext ?: return
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val builder = OneTimeWorkRequestBuilder<OutboxSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)

        if (delayMillis > 0L) {
            builder.setInitialDelay(delayMillis, TimeUnit.MILLISECONDS)
        }

        WorkManager.getInstance(ctx).enqueueUniqueWork(
            UNIQUE_SYNC_WORK,
            ExistingWorkPolicy.REPLACE,
            builder.build(),
        )
    }
}
