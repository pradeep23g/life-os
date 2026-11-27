# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses, Signature
-dontnote kotlinx.serialization.SerializationKt
-keep,includedescriptorclasses class com.lifeos.companion.**$$serializer { *; }
-keepclassmembers class com.lifeos.companion.** {
    *** Companion;
}
-keepclassmembers class kotlinx.serialization.json.** { *; }

# Keep Jetpack Glance widgets & receivers distinct (prevent R8 horizontal class merging)
-keep class * extends androidx.glance.appwidget.GlanceAppWidget { *; }
-keep class * extends androidx.glance.appwidget.GlanceAppWidgetReceiver { *; }
-keep class * extends androidx.glance.appwidget.action.ActionCallback { *; }

# Ktor + OkHttp + Coroutines
-dontwarn io.ktor.**
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.slf4j.**
-keep class io.ktor.** { *; }
-keep class io.github.jan.supabase.** { *; }

# Room
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**
