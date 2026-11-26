package com.lifeos.companion.telemetry

import android.util.Log
import com.lifeos.companion.data.model.EventInsertDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.util.IstClock
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import java.time.Instant

object LifeOsDomains {
    const val MIND_OS = "mind-os"
    const val PRODUCTIVITY_HUB = "productivity-hub"
    const val LEARNING_OS = "learning-os"
    const val MISSION_CONTROL = "mission-control"
    const val FITNESS_OS = "fitness-os"
    const val FINANCE_OS = "finance-os"
    const val TIME_OS = "time-os"
}

object TelemetryLogger {
    private const val TAG = "LifeOsTelemetry"

    suspend fun logEventSafe(
        domain: String,
        entityType: String,
        entityId: String?,
        eventType: String,
        payload: JsonObject = buildJsonObject { },
        createdAt: Instant = Instant.now(),
    ) {
        try {
            val userId = SupabaseClientProvider.auth.currentUserOrNull()?.id ?: return
            val row = EventInsertDto(
                userId = userId,
                domain = domain,
                entityType = entityType,
                entityId = entityId,
                eventType = eventType,
                eventDateIst = IstClock.toIstDateString(createdAt),
                payload = payload,
                createdAt = createdAt.toString(),
            )
            SupabaseClientProvider.client.postgrest["events"].insert(row)
        } catch (e: Exception) {
            Log.w(TAG, "logEventSafe failed for $eventType: ${e.message}")
        }
    }
}
