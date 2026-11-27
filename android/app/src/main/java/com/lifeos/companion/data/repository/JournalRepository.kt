package com.lifeos.companion.data.repository

import com.lifeos.companion.data.local.CachedJournalEntity
import com.lifeos.companion.data.local.OutboxOpTypes
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.data.supabase.SupabaseClientProvider
import com.lifeos.companion.data.sync.JournalCreatePayload
import com.lifeos.companion.data.sync.JournalDeletePayload
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.util.IstClock
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.util.UUID

class JournalRepository {
    private val dao get() = OutboxManager.database().dao()
    private val db get() = SupabaseClientProvider.client.postgrest
    private val json = Json

    private fun currentUserIdOrNull(): String? =
        OutboxManager.appContextOrNull()?.let { SupabaseClientProvider.cachedUserIdOrNull(it) }
            ?: SupabaseClientProvider.auth.currentUserOrNull()?.id

    fun observeEntries(): Flow<List<JournalEntryDto>> {
        val userId = currentUserIdOrNull() ?: return flowOf(emptyList())
        return dao.observeJournals(userId).map { list ->
            list.map { e ->
                JournalEntryDto(
                    id = e.id,
                    userId = e.userId,
                    mood = e.mood,
                    whatWentGood = e.whatWentGood,
                    whatYouLearned = e.whatYouLearned,
                    briefAboutDay = e.briefAboutDay,
                    createdAt = e.createdAt,
                )
            }
        }
    }

    suspend fun refreshFromRemote() {
        val userId = currentUserIdOrNull() ?: return
        val hasPending = dao.getPendingMutations().any { it.opType.startsWith("JOURNAL") }
        if (hasPending) {
            OutboxManager.scheduleSyncNow()
            return
        }

        val entries = db["journal_entries"]
            .select {
                filter {
                    eq("user_id", userId)
                    exact("deleted_at", null)
                }
                order("created_at", Order.DESCENDING)
                limit(40)
            }
            .decodeList<JournalEntryDto>()

        dao.replaceJournalsForUser(
            userId,
            entries.map { e ->
                CachedJournalEntity(
                    id = e.id,
                    userId = e.userId,
                    mood = e.mood,
                    whatWentGood = e.whatWentGood,
                    whatYouLearned = e.whatYouLearned,
                    briefAboutDay = e.briefAboutDay,
                    createdAt = e.createdAt,
                )
            },
        )
    }

    suspend fun createEntry(
        mood: Int,
        whatWentGood: String?,
        whatYouLearned: String?,
        briefAboutDay: String?,
        entryDateIst: String? = null,
    ) {
        val userId = currentUserIdOrNull() ?: return
        val id = UUID.randomUUID().toString()
        val nowIso = if (entryDateIst != null && entryDateIst != IstClock.todayIstString()) {
            runCatching {
                LocalDate.parse(entryDateIst)
                    .atTime(12, 0)
                    .atZone(IstClock.ZONE_IST)
                    .toInstant()
                    .toString()
            }.getOrElse { IstClock.nowIsoUtc() }
        } else {
            IstClock.nowIsoUtc()
        }
        val cleanGood = whatWentGood?.trim()?.takeIf { it.isNotEmpty() }
        val cleanLearned = whatYouLearned?.trim()?.takeIf { it.isNotEmpty() }
        val cleanBrief = briefAboutDay?.trim()?.takeIf { it.isNotEmpty() }

        dao.upsertJournal(
            CachedJournalEntity(
                id = id,
                userId = userId,
                mood = mood.coerceIn(1, 5),
                whatWentGood = cleanGood,
                whatYouLearned = cleanLearned,
                briefAboutDay = cleanBrief,
                createdAt = nowIso,
            ),
        )

        val payload = JournalCreatePayload(
            id = id,
            userId = userId,
            mood = mood.coerceIn(1, 5),
            whatWentGood = cleanGood,
            whatYouLearned = cleanLearned,
            briefAboutDay = cleanBrief,
            createdAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.JOURNAL_CREATE,
            entityId = id,
            payloadJson = json.encodeToString(payload),
        )
    }

    suspend fun deleteEntry(journalId: String) {
        val userId = currentUserIdOrNull() ?: return
        val nowIso = IstClock.nowIsoUtc()
        dao.deleteJournalById(journalId)

        val payload = JournalDeletePayload(
            userId = userId,
            journalId = journalId,
            deletedAt = nowIso,
        )
        OutboxManager.enqueueAndSync(
            opType = OutboxOpTypes.JOURNAL_DELETE,
            entityId = journalId,
            payloadJson = json.encodeToString(payload),
        )
    }
}
