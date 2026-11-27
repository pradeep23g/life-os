package com.lifeos.companion.ui.home

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.companion.data.model.JournalEntryDto
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.FocusRepository
import com.lifeos.companion.data.repository.HabitWithTodayStatus
import com.lifeos.companion.data.repository.HabitsRepository
import com.lifeos.companion.data.repository.JournalRepository
import com.lifeos.companion.data.repository.StartFocusResult
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.repository.TasksRepository
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.service.FocusTimerService
import com.lifeos.companion.util.IstClock
import com.lifeos.companion.widgets.WidgetStateSync
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant

data class HomeUiState(
    val isLoading: Boolean = true,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val activeTimer: TimeLogDto? = null,
    val conflictTimer: TimeLogDto? = null,
    val todayFocusMinutes: Int = 0,
    val habits: List<HabitWithTodayStatus> = emptyList(),
    val pendingTasks: List<TaskDto> = emptyList(),
    val journalLoggedToday: Boolean = false,
    val pendingOutboxCount: Int = 0,
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    private val habitsRepo = HabitsRepository()
    private val tasksRepo = TasksRepository()
    private val journalRepo = JournalRepository()
    private val focusRepo = FocusRepository()

    private data class RemoteFocusState(
        val isLoading: Boolean = true,
        val isRefreshing: Boolean = false,
        val error: String? = null,
        val activeTimer: TimeLogDto? = null,
        val conflictTimer: TimeLogDto? = null,
        val todayFocusMinutes: Int = 0,
    )

    private val focusState = MutableStateFlow(RemoteFocusState())

    val uiState: StateFlow<HomeUiState> = combine(
        focusState,
        habitsRepo.observeHabitsToday(),
        tasksRepo.observeTasks(),
        journalRepo.observeEntries(),
        OutboxManager.database().dao().observePendingCount(),
    ) { remote, habits, allTasks, journals, outboxCount ->
        val todayIst = IstClock.todayIstString()
        val pendingTasks = allTasks
            .filter { !it.isCompleted }
            .sortedWith(
                compareBy<TaskDto>(
                    { task ->
                        when {
                            task.deadlineType == "specific_date" && task.deadlineDate != null && task.deadlineDate < todayIst -> 0
                            task.deadlineType == "same_day" || task.deadlineDate == todayIst -> 1
                            task.deadlineType == "specific_date" -> 2
                            else -> 3
                        }
                    },
                    { it.deadlineDate ?: "9999-12-31" },
                    { it.createdAt },
                ),
            )

        val journalToday = journals.any { entry ->
            runCatching { IstClock.toIstDateString(Instant.parse(entry.createdAt)) }.getOrNull() == todayIst
        }

        HomeUiState(
            isLoading = remote.isLoading && habits.isEmpty() && allTasks.isEmpty(),
            isRefreshing = remote.isRefreshing,
            error = remote.error,
            activeTimer = remote.activeTimer,
            conflictTimer = remote.conflictTimer,
            todayFocusMinutes = remote.todayFocusMinutes,
            habits = habits,
            pendingTasks = pendingTasks,
            journalLoggedToday = journalToday,
            pendingOutboxCount = outboxCount,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HomeUiState(),
    )

    init {
        refresh(initial = true)
    }

    fun refresh(initial: Boolean = false) {
        viewModelScope.launch {
            focusState.update {
                it.copy(
                    isLoading = initial,
                    isRefreshing = !initial,
                    error = null,
                )
            }
            OutboxManager.scheduleSyncNow()

            val (habitsRes, tasksRes, journalRes, focusRes) = withContext(Dispatchers.IO) {
                coroutineScope {
                    val h = async { runCatching { habitsRepo.refreshFromRemote() } }
                    val t = async { runCatching { tasksRepo.refreshFromRemote() } }
                    val j = async { runCatching { journalRepo.refreshFromRemote() } }
                    val f = async { runCatching { focusRepo.fetchFocusSnapshot() } }
                    listOf(h.await(), t.await(), j.await(), f.await())
                }
            }

            @Suppress("UNCHECKED_CAST")
            val typedFocusRes = focusRes as Result<com.lifeos.companion.data.repository.FocusSnapshot>
            typedFocusRes.onSuccess { snapshot ->
                val minutes = snapshot.todayLogs.sumOf { it.durationMinutes ?: 0 }
                val todayBucketMins = TIME_BUCKETS.associateWith { b ->
                    snapshot.todayLogs.filter { it.bucket == b }.sumOf { it.durationMinutes ?: 0 }
                }
                val active = snapshot.activeTimer
                WidgetStateSync.saveFocusState(getApplication(), active, minutes, todayBucketMins)
                if (active != null) {
                    FocusTimerService.start(getApplication(), active)
                }
                focusState.update {
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        activeTimer = active,
                        todayFocusMinutes = minutes,
                        error = null,
                    )
                }
            }.onFailure { err ->
                val firstErr = err.message
                    ?: habitsRes.exceptionOrNull()?.message
                    ?: tasksRes.exceptionOrNull()?.message
                    ?: journalRes.exceptionOrNull()?.message
                focusState.update {
                    it.copy(
                        isLoading = false,
                        isRefreshing = false,
                        error = firstErr,
                    )
                }
            }
        }
    }

    fun toggleHabit(item: HabitWithTodayStatus) {
        viewModelScope.launch {
            val next = if (item.isDone) 0 else item.habit.targetValue.coerceAtLeast(1)
            runCatching { habitsRepo.setTodayValue(item, next) }
                .onFailure { err -> focusState.update { it.copy(error = err.message) } }
        }
    }

    fun toggleTask(task: TaskDto) {
        viewModelScope.launch {
            runCatching { tasksRepo.toggleTask(task) }
                .onFailure { err -> focusState.update { it.copy(error = err.message) } }
        }
    }

    fun startQuickFocus() {
        viewModelScope.launch {
            runCatching { focusRepo.startWithConflictCheck(bucket = "Deep Work", taskId = null, description = null) }
                .onSuccess { res ->
                    when (res) {
                        is StartFocusResult.Started -> {
                            FocusTimerService.start(getApplication(), res.log)
                            WidgetStateSync.saveFocusState(getApplication(), res.log)
                            focusState.update { it.copy(activeTimer = res.log, error = null) }
                        }
                        is StartFocusResult.Conflict -> {
                            focusState.update { it.copy(conflictTimer = res.existing) }
                        }
                    }
                }
                .onFailure { err ->
                    focusState.update { it.copy(error = err.message ?: "Connect online to start Focus timer") }
                }
        }
    }

    fun resolveConflictTakeOver() {
        val existing = focusState.value.conflictTimer ?: return
        viewModelScope.launch {
            focusState.update { it.copy(conflictTimer = null) }
            runCatching {
                focusRepo.takeOverAndStart(existing, bucket = "Deep Work", taskId = null, description = null)
            }.onSuccess { started ->
                FocusTimerService.start(getApplication(), started)
                refresh()
            }.onFailure { err ->
                focusState.update { it.copy(error = err.message) }
            }
        }
    }

    fun resolveConflictResumeExisting() {
        val existing = focusState.value.conflictTimer ?: return
        FocusTimerService.start(getApplication(), existing)
        focusState.update { it.copy(activeTimer = existing, conflictTimer = null) }
    }

    fun dismissConflict() {
        focusState.update { it.copy(conflictTimer = null) }
    }

    fun stopActiveFocus() {
        val active = focusState.value.activeTimer ?: return
        viewModelScope.launch {
            runCatching { focusRepo.stopTimer(active) }
                .onSuccess {
                    FocusTimerService.stop(getApplication())
                    WidgetStateSync.saveFocusState(getApplication(), null)
                    refresh()
                }
                .onFailure { err -> focusState.update { it.copy(error = err.message) } }
        }
    }

    fun flushOutbox() {
        OutboxManager.scheduleSyncNow()
        refresh()
    }
}
