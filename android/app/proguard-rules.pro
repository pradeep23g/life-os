# Keep Supabase / Kotlinx Serialization models
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keep,includedescriptorclasses class com.lifeos.companion.**$$serializer { *; }
-keepclassmembers class com.lifeos.companion.** {
    *** Companion;
}
