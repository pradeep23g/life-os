package com.lifeos.companion.ui.habits

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.companion.data.model.HabitStreakBreakDto
import com.lifeos.companion.data.repository.HabitWithTodayStatus
import com.lifeos.companion.data.repository.HabitsHealSummary
import com.lifeos.companion.data.repository.HabitsRepository
import com.lifeos.companion.data.sync.OutboxManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HabitsUiState(
    val habits: List<HabitWithTodayStatus> = emptyList(),
    val healSummary: HabitsHealSummary = HabitsHealSummary(),
    val pendingOutboxCount: Int = 0,
    val isRefreshing: Boolean = false,
    val isHealing: Boolean = false,
    val error: String? = null,
)

class HabitsViewModel : ViewModel() {
    private val repo = HabitsRepository()
    private val healSummaryFlow = MutableStateFlow(HabitsHealSummary())
    private val statusFlow = MutableStateFlow<Triple<Boolean, Boolean, String?>>(Triple(false, false, null))

    val uiState: StateFlow<HabitsUiState> = combine(
        repo.observeHabitsToday(),
        healSummaryFlow,
        OutboxManager.database().dao().observePendingCount(),
        statusFlow,
    ) { habits, heals, outboxCount, (refreshing, healing, err) ->
        HabitsUiState(
            habits = habits,
            healSummary = heals,
            pendingOutboxCount = outboxCount,
            isRefreshing = refreshing,
            isHealing = healing,
            error = err,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HabitsUiState(),
    )

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            statusFlow.update { Triple(true, it.second, null) }
            val refreshRes = runCatching { repo.refreshFromRemote() }
            val healRes = runCatching { repo.fetchHealSummary() }
            healRes.onSuccess { healSummaryFlow.value = it }
            val err = refreshRes.exceptionOrNull()?.message ?: healRes.exceptionOrNull()?.message
            statusFlow.update { Triple(false, it.second, err) }
        }
    }

    fun toggleBinary(item: HabitWithTodayStatus) {
        viewModelScope.launch {
            val next = if (item.isDone) 0 else item.habit.targetValue.coerceAtLeast(1)
            runCatching { repo.setTodayValue(item, next) }
                .onFailure { err -> statusFlow.update { Triple(it.first, it.second, err.message) } }
        }
    }

    fun adjustTarget(item: HabitWithTodayStatus, delta: Int) {
        viewModelScope.launch {
            val next = (item.todayValue + delta).coerceAtLeast(0)
            runCatching { repo.setTodayValue(item, next) }
                .onFailure { err -> statusFlow.update { Triple(it.first, it.second, err.message) } }
        }
    }

    fun createHabit(title: String, habitType: String, targetValue: Int, unit: String?) {
        if (title.isBlank()) return
        viewModelScope.launch {
            runCatching { repo.createHabit(title, habitType, targetValue, unit) }
                .onFailure { err -> statusFlow.update { Triple(it.first, it.second, err.message) } }
        }
    }

    fun deleteHabit(habitId: String) {
        viewModelScope.launch {
            runCatching { repo.deleteHabit(habitId) }
                .onFailure { err -> statusFlow.update { Triple(it.first, it.second, err.message) } }
        }
    }

    fun healBreak(breakItem: HabitStreakBreakDto, reason: String?) {
        viewModelScope.launch {
            statusFlow.update { Triple(it.first, true, null) }
            runCatching { repo.healStreakBreak(breakItem, reason) }
                .onSuccess {
                    statusFlow.update { Triple(it.first, false, null) }
                    refresh()
                }
                .onFailure { err ->
                    statusFlow.update { Triple(it.first, false, err.message ?: "Could not heal break") }
                }
        }
    }
}
