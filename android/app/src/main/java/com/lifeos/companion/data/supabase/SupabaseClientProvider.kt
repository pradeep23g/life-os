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
    @Volatile
    private var instance: SupabaseClient? = null

    fun init(context: Context) {
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
                install(Auth) {
                    // Android session persistence is handled automatically via SharedPreferences in auth-kt
                }
                install(Postgrest)
                install(Realtime)
            }
        }
    }

    val client: SupabaseClient
        get() = checkNotNull(instance) { "SupabaseClientProvider.init() must be called first" }

    val auth get() = client.auth
}
