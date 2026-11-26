package com.lifeos.companion.ui.journal

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.data.repository.JournalRepository
import com.lifeos.companion.data.sync.OutboxManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class JournalUiState(
    val entries: List<JournalEntryDto> = emptyList(),
    val pendingOutboxCount: Int = 0,
    val isRefreshing: Boolean = false,
    val error: String? = null,
)

class JournalViewModel : ViewModel() {
    private val repo = JournalRepository()
    private val statusFlow = MutableStateFlow<Pair<Boolean, String?>>(false to null)

    val uiState: StateFlow<JournalUiState> = combine(
        repo.observeEntries(),
        OutboxManager.database().dao().observePendingCount(),
        statusFlow,
    ) { entries, outboxCount, (refreshing, err) ->
        JournalUiState(
            entries = entries,
            pendingOutboxCount = outboxCount,
            isRefreshing = refreshing,
            error = err,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = JournalUiState(),
    )

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            statusFlow.value = true to null
            runCatching { repo.refreshFromRemote() }
                .onSuccess { statusFlow.value = false to null }
                .onFailure { err -> statusFlow.value = false to err.message }
        }
    }

    fun saveEntry(
        mood: Int,
        whatWentGood: String,
        whatYouLearned: String,
        briefAboutDay: String,
    ) {
        viewModelScope.launch {
            runCatching { repo.createEntry(mood, whatWentGood, whatYouLearned, briefAboutDay) }
                .onFailure { err -> statusFlow.update { it.first to err.message } }
        }
    }

    fun deleteEntry(id: String) {
        viewModelScope.launch {
            runCatching { repo.deleteEntry(id) }
                .onFailure { err -> statusFlow.update { it.first to err.message } }
        }
    }
}
