package com.lifeos.companion.ui.focus

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.model.TimeLogDto
import com.lifeos.companion.data.repository.FocusRepository
import com.lifeos.companion.data.repository.StartFocusResult
import com.lifeos.companion.data.repository.TIME_BUCKETS
import com.lifeos.companion.data.repository.TimeBucketColorStore
import com.lifeos.companion.service.FocusTimerService
import com.lifeos.companion.widgets.WidgetStateSync
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant

enum class TimeOsSubPage(val label: String) {
    CHRONOS("TIMER"),
    STRIP("24H STRIP"),
    ANALYTICS("7D / 30D"),
}

data class FocusUiState(
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val activeTimer: TimeLogDto? = null,
    val conflictTimer: TimeLogDto? = null,
    val todayLogs: List<TimeLogDto> = emptyList(),
    val logs7d: List<TimeLogDto> = emptyList(),
    val logs30d: List<TimeLogDto> = emptyList(),
    val openTasks: List<TaskDto> = emptyList(),
    val selectedBucket: String = TIME_BUCKETS[0], // Deep Work
    val selectedTaskId: String? = null,
    val selectedTargetMinutes: Int = 0, // 0 = Open-ended stopwatch
    val description: String = "",
    val activeSubPage: TimeOsSubPage = TimeOsSubPage.CHRONOS,
    val isAodOpen: Boolean = false,
)

class FocusViewModel(application: Application) : AndroidViewModel(application) {
    private val repo = FocusRepository()

    private val _uiState = MutableStateFlow(FocusUiState())
    val uiState: StateFlow<FocusUiState> = _uiState.asStateFlow()

    init {
        TimeBucketColorStore.init(application)
        refresh()
    }

    fun selectSubPage(page: TimeOsSubPage) {
        _uiState.update { it.copy(activeSubPage = page) }
    }

    fun setAodOpen(open: Boolean) {
        _uiState.update { it.copy(isAodOpen = open) }
    }

    fun applyPreselectedTask(taskId: String?) {
        if (taskId != null) {
            _uiState.update { it.copy(selectedTaskId = taskId, activeSubPage = TimeOsSubPage.CHRONOS) }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = it.logs30d.isEmpty() && it.activeTimer == null, error = null) }
            TimeBucketColorStore.refreshFromRemote(getApplication())
            runCatching { repo.fetchFocusSnapshot() }
                .onSuccess { snap ->
                    val mins = snap.todayLogs.sumOf { it.durationMinutes ?: 0 }
                    val todayBucketMins = TIME_BUCKETS.associateWith { b ->
                        snap.todayLogs.filter { it.bucket == b }.sumOf { it.durationMinutes ?: 0 }
                    }
                    WidgetStateSync.saveFocusState(getApplication(), snap.activeTimer, mins, todayBucketMins)
                    if (snap.activeTimer != null) {
                        FocusTimerService.start(
                            getApplication(),
                            snap.activeTimer,
                            _uiState.value.selectedTargetMinutes,
                        )
                    }
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            activeTimer = snap.activeTimer,
                            todayLogs = snap.todayLogs,
                            logs7d = snap.logs7d,
                            logs30d = snap.logs30d,
                            openTasks = snap.openTasks,
                            error = null,
                        )
                    }
                }
                .onFailure { err ->
                    _uiState.update {
                        it.copy(isLoading = false, error = err.message ?: "Could not load Time OS state")
                    }
                }
        }
    }

    fun selectBucket(bucket: String) {
        _uiState.update { it.copy(selectedBucket = bucket) }
    }

    fun selectTask(taskId: String?) {
        _uiState.update { it.copy(selectedTaskId = taskId) }
    }

    fun selectTargetMinutes(minutes: Int) {
        _uiState.update { it.copy(selectedTargetMinutes = minutes) }
    }

    fun updateDescription(text: String) {
        _uiState.update { it.copy(description = text) }
    }

    fun startFocus() {
        val current = _uiState.value
        if (current.isSubmitting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            runCatching {
                repo.startWithConflictCheck(
                    bucket = current.selectedBucket,
                    taskId = current.selectedTaskId,
                    description = current.description,
                )
            }.onSuccess { result ->
                when (result) {
                    is StartFocusResult.Started -> {
                        FocusTimerService.start(
                            getApplication(),
                            result.log,
                            current.selectedTargetMinutes,
                        )
                        WidgetStateSync.saveFocusState(getApplication(), result.log)
                        _uiState.update {
                            it.copy(
                                isSubmitting = false,
                                activeTimer = result.log,
                                description = "",
                            )
                        }
                    }
                    is StartFocusResult.Conflict -> {
                        _uiState.update {
                            it.copy(isSubmitting = false, conflictTimer = result.existing)
                        }
                    }
                }
            }.onFailure { err ->
                _uiState.update {
                    it.copy(isSubmitting = false, error = err.message ?: "Failed to start timer")
                }
            }
        }
    }

    fun takeOverConflict() {
        val current = _uiState.value
        val existing = current.conflictTimer ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, conflictTimer = null, error = null) }
            runCatching {
                repo.takeOverAndStart(
                    existing = existing,
                    bucket = current.selectedBucket,
                    taskId = current.selectedTaskId,
                    description = current.description,
                )
            }.onSuccess { started ->
                FocusTimerService.start(getApplication(), started, current.selectedTargetMinutes)
                WidgetStateSync.saveFocusState(getApplication(), started)
                _uiState.update { it.copy(isSubmitting = false, description = "") }
                refresh()
            }.onFailure { err ->
                _uiState.update { it.copy(isSubmitting = false, error = err.message) }
            }
        }
    }

    fun resumeConflictExisting() {
        val existing = _uiState.value.conflictTimer ?: return
        FocusTimerService.start(getApplication(), existing, _uiState.value.selectedTargetMinutes)
        WidgetStateSync.saveFocusState(getApplication(), existing)
        _uiState.update { it.copy(activeTimer = existing, conflictTimer = null) }
    }

    fun dismissConflict() {
        _uiState.update { it.copy(conflictTimer = null) }
    }

    fun stopActiveFocus() {
        val active = _uiState.value.activeTimer ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            runCatching { repo.stopTimer(active) }
                .onSuccess {
                    FocusTimerService.stop(getApplication())
                    WidgetStateSync.saveFocusState(getApplication(), null)
                    _uiState.update { it.copy(isSubmitting = false, activeTimer = null, isAodOpen = false) }
                    refresh()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isSubmitting = false, error = err.message) }
                }
        }
    }

    fun logManualSession(
        bucket: String,
        startInstant: Instant,
        endInstant: Instant,
        description: String?,
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }
            runCatching { repo.logManualSession(bucket, startInstant, endInstant, description) }
                .onSuccess {
                    _uiState.update { it.copy(isSubmitting = false) }
                    refresh()
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isSubmitting = false, error = err.message ?: "Failed to inject manual log") }
                }
        }
    }

    fun deleteSession(log: TimeLogDto) {
        viewModelScope.launch {
            runCatching { repo.deleteSession(log) }
                .onSuccess { refresh() }
                .onFailure { err -> _uiState.update { it.copy(error = err.message ?: "Failed to delete log") } }
        }
    }
}
