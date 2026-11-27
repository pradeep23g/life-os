package com.lifeos.companion.data.supabase

import android.content.Context
import com.lifeos.companion.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

object SupabaseClientProvider {
    private const val AUTH_CACHE_PREFS = "life_os_auth_cache"
    private const val KEY_LAST_USER_ID = "last_user_id"

    @Volatile
    private var instance: SupabaseClient? = null

    @Volatile
    private var appContext: Context? = null

    fun init(context: Context) {
        appContext = context.applicationContext
        if (instance != null) return
        synchronized(this) {
            if (instance != null) return
            require(BuildConfig.SUPABASE_URL.isNotBlank() && BuildConfig.SUPABASE_ANON_KEY.isNotBlank()) {
                "SUPABASE_URL and SUPABASE_ANON_KEY must be set in root .env"
            }
            instance = createSupabaseClient(
                supabaseUrl = BuildConfig.SUPABASE_URL,
                supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
            ) {
                install(Auth)
                install(Postgrest)
                install(Realtime)
            }
        }
    }

    val client: SupabaseClient
        get() = checkNotNull(instance) { "SupabaseClientProvider.init() must be called first" }

    val auth get() = client.auth

    suspend fun awaitAuthenticatedUserId(context: Context): String? {
        init(context)
        runCatching { auth.awaitInitialization() }
        val liveUserId = auth.currentUserOrNull()?.id
        if (liveUserId != null) {
            cacheUserId(context, liveUserId)
            return liveUserId
        }
        return null
    }

    fun cacheUserId(context: Context, userId: String?) {
        val prefs = context.applicationContext.getSharedPreferences(AUTH_CACHE_PREFS, Context.MODE_PRIVATE)
        if (userId != null) {
            prefs.edit().putString(KEY_LAST_USER_ID, userId).apply()
        } else {
            prefs.edit().remove(KEY_LAST_USER_ID).apply()
        }
    }

    fun cachedUserIdOrNull(context: Context): String? {
        val live = runCatching { auth.currentUserOrNull()?.id }.getOrNull()
        if (live != null) return live
        return context.applicationContext
            .getSharedPreferences(AUTH_CACHE_PREFS, Context.MODE_PRIVATE)
            .getString(KEY_LAST_USER_ID, null)
    }

    suspend fun signOutAndClear(context: Context) {
        cacheUserId(context, null)
        auth.signOut()
    }
}
