package com.lifeos.companion.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface LifeOsDao {
    // Habits
    @Query("SELECT * FROM cached_habits WHERE userId = :userId ORDER BY createdAt ASC")
    fun observeHabits(userId: String): Flow<List<CachedHabitEntity>>

    @Query("SELECT * FROM cached_habits WHERE userId = :userId ORDER BY createdAt ASC")
    suspend fun getHabitsSnapshot(userId: String): List<CachedHabitEntity>

    @Query("DELETE FROM cached_habits WHERE userId = :userId")
    suspend fun clearHabitsForUser(userId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertHabits(items: List<CachedHabitEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertHabit(item: CachedHabitEntity)

    @Query("UPDATE cached_habits SET todayValue = :value, todayLogDate = :logDate WHERE id = :habitId")
    suspend fun updateHabitTodayValue(habitId: String, value: Int, logDate: String)

    @Query("DELETE FROM cached_habits WHERE id = :habitId")
    suspend fun deleteHabitById(habitId: String)

    @Transaction
    suspend fun replaceHabitsForUser(userId: String, items: List<CachedHabitEntity>) {
        clearHabitsForUser(userId)
        upsertHabits(items)
    }

    // Tasks
    @Query("SELECT * FROM cached_tasks WHERE userId = :userId ORDER BY createdAt ASC")
    fun observeTasks(userId: String): Flow<List<CachedTaskEntity>>

    @Query("SELECT * FROM cached_tasks WHERE userId = :userId ORDER BY createdAt ASC")
    suspend fun getTasksSnapshot(userId: String): List<CachedTaskEntity>

    @Query("DELETE FROM cached_tasks WHERE userId = :userId")
    suspend fun clearTasksForUser(userId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTasks(items: List<CachedTaskEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTask(item: CachedTaskEntity)

    @Query("UPDATE cached_tasks SET isCompleted = :isCompleted, updatedAt = :updatedAt WHERE id = :taskId")
    suspend fun updateTaskCompleted(taskId: String, isCompleted: Boolean, updatedAt: String)

    @Query("DELETE FROM cached_tasks WHERE id = :taskId")
    suspend fun deleteTaskById(taskId: String)

    @Transaction
    suspend fun replaceTasksForUser(userId: String, items: List<CachedTaskEntity>) {
        clearTasksForUser(userId)
        upsertTasks(items)
    }

    // Journals
    @Query("SELECT * FROM cached_journals WHERE userId = :userId ORDER BY createdAt DESC")
    fun observeJournals(userId: String): Flow<List<CachedJournalEntity>>

    @Query("SELECT * FROM cached_journals WHERE userId = :userId ORDER BY createdAt DESC")
    suspend fun getJournalsSnapshot(userId: String): List<CachedJournalEntity>

    @Query("DELETE FROM cached_journals WHERE userId = :userId")
    suspend fun clearJournalsForUser(userId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertJournals(items: List<CachedJournalEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertJournal(item: CachedJournalEntity)

    @Query("DELETE FROM cached_journals WHERE id = :journalId")
    suspend fun deleteJournalById(journalId: String)

    @Transaction
    suspend fun replaceJournalsForUser(userId: String, items: List<CachedJournalEntity>) {
        clearJournalsForUser(userId)
        upsertJournals(items)
    }

    // Hybrid Outbox
    @Query("SELECT COUNT(*) FROM pending_mutations")
    fun observePendingCount(): Flow<Int>

    @Query("SELECT * FROM pending_mutations ORDER BY createdAtIso ASC")
    suspend fun getPendingMutations(): List<PendingMutationEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun enqueueMutation(mutation: PendingMutationEntity)

    @Query("DELETE FROM pending_mutations WHERE opType = :opType AND entityId = :entityId")
    suspend fun deletePendingForEntity(opType: String, entityId: String)

    @Transaction
    suspend fun coalesceAndEnqueue(mutation: PendingMutationEntity) {
        deletePendingForEntity(mutation.opType, mutation.entityId)
        enqueueMutation(mutation)
    }

    @Query("DELETE FROM pending_mutations WHERE id = :id")
    suspend fun deleteMutation(id: String)

    @Query("UPDATE pending_mutations SET retryCount = retryCount + 1, lastError = :error WHERE id = :id")
    suspend fun markMutationRetry(id: String, error: String)
}
