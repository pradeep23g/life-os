package com.lifeos.companion.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        CachedHabitEntity::class,
        CachedTaskEntity::class,
        CachedJournalEntity::class,
        PendingMutationEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class LifeOsDatabase : RoomDatabase() {
    abstract fun dao(): LifeOsDao

    companion object {
        @Volatile
        private var instance: LifeOsDatabase? = null

        fun get(context: Context): LifeOsDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    LifeOsDatabase::class.java,
                    "life_os_companion.db",
                ).build().also { instance = it }
            }
        }
    }
}
