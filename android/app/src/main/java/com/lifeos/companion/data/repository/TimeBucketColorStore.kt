package com.lifeos.companion.data.repository

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import com.lifeos.companion.data.model.UserSettingsTimeColorsRow
import com.lifeos.companion.data.model.UserSettingsTimeColorsUpsert
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.util.IstClock
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

val TIME_BUCKETS = listOf("Deep Work", "Learning", "Fitness", "Gaming", "Chore")

val DEFAULT_TIME_BUCKET_HEX: Map<String, String> = mapOf(
    "Deep Work" to "#3B82F6",
    "Learning" to "#10B981",
    "Fitness" to "#EF4444",
    "Gaming" to "#EC4899",
    "Chore" to "#94A3B8",
)

object TimeBucketColorStore {
    private const val PREFS = "life_os_time_bucket_colors"

    private val _hexMap = MutableStateFlow(DEFAULT_TIME_BUCKET_HEX)
    val hexMap: StateFlow<Map<String, String>> = _hexMap.asStateFlow()

    fun init(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val loaded = DEFAULT_TIME_BUCKET_HEX.toMutableMap()
        TIME_BUCKETS.forEach { bucket ->
            val saved = prefs.getString(bucket, null)
            if (isValidHex(saved)) {
                loaded[bucket] = saved!!.uppercase()
            }
        }
        _hexMap.value = loaded
    }

    fun colorFor(bucket: String): Color {
        val hex = _hexMap.value[bucket] ?: DEFAULT_TIME_BUCKET_HEX[bucket] ?: "#3B82F6"
        return parseHexColor(hex)
    }

    fun hexFor(bucket: String): String =
        _hexMap.value[bucket] ?: DEFAULT_TIME_BUCKET_HEX[bucket] ?: "#3B82F6"

    fun parseHexColor(hex: String): Color {
        return runCatching {
            Color(android.graphics.Color.parseColor(hex))
        }.getOrElse { Color(0xFF3B82F6) }
    }

    fun isValidHex(value: String?): Boolean {
        if (value == null) return false
        return Regex("^#[0-9A-Fa-f]{6}$").matches(value.trim())
    }

    fun toHexString(color: Color): String {
        val argb = color.toArgb()
        return String.format("#%06X", 0xFFFFFF and argb)
    }

    suspend fun refreshFromRemote(context: Context) {
        init(context)
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context) ?: return
        runCatching {
            val row = SupabaseClientProvider.client.postgrest["user_settings"]
                .select {
                    filter { eq("user_id", userId) }
                    limit(1)
                }
                .decodeSingleOrNull<UserSettingsTimeColorsRow>()

            val remoteMap = row?.timeBucketColors
            if (remoteMap != null) {
                val merged = DEFAULT_TIME_BUCKET_HEX.toMutableMap()
                TIME_BUCKETS.forEach { bucket ->
                    val candidate = runCatching { remoteMap[bucket]?.jsonPrimitive?.content }.getOrNull()
                    if (isValidHex(candidate)) {
                        merged[bucket] = candidate!!.trim().uppercase()
                    }
                }
                persistLocally(context, merged)
            }
        }
    }

    suspend fun saveBucketColor(context: Context, bucket: String, hex: String) {
        val normalized = hex.trim().uppercase()
        require(isValidHex(normalized)) { "Invalid hex color: $hex" }
        val updated = _hexMap.value.toMutableMap()
        updated[bucket] = normalized
        persistLocally(context, updated)
        pushToRemote(context, updated)
    }

    suspend fun resetDefaults(context: Context) {
        val defaults = DEFAULT_TIME_BUCKET_HEX.toMap()
        persistLocally(context, defaults)
        pushToRemote(context, defaults)
    }

    private fun persistLocally(context: Context, map: Map<String, String>) {
        val editor = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        map.forEach { (k, v) -> editor.putString(k, v) }
        editor.apply()
        _hexMap.value = map
    }

    private suspend fun pushToRemote(context: Context, map: Map<String, String>) {
        val userId = SupabaseClientProvider.awaitAuthenticatedUserId(context) ?: return
        val jsonObj: JsonObject = buildJsonObject {
            TIME_BUCKETS.forEach { bucket ->
                put(bucket, map[bucket] ?: DEFAULT_TIME_BUCKET_HEX[bucket] ?: "#3B82F6")
            }
        }
        val db = SupabaseClientProvider.client.postgrest
        val existing = runCatching {
            db["user_settings"]
                .select {
                    filter { eq("user_id", userId) }
                    limit(1)
                }
                .decodeSingleOrNull<UserSettingsTimeColorsRow>()
        }.getOrNull()

        if (existing != null) {
            db["user_settings"].update({
                set("time_bucket_colors", jsonObj)
                set("updated_at", IstClock.nowIsoUtc())
            }) {
                filter { eq("user_id", userId) }
            }
        } else {
            db["user_settings"].insert(
                UserSettingsTimeColorsUpsert(
                    userId = userId,
                    timeBucketColors = jsonObj,
                    updatedAt = IstClock.nowIsoUtc(),
                ),
            )
        }
    }
}
