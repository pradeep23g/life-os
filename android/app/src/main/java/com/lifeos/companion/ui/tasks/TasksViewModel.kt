package com.lifeos.companion.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifeos.companion.data.model.TaskDto
import com.lifeos.companion.data.repository.TasksRepository
import com.lifeos.companion.data.sync.OutboxManager
import com.lifeos.companion.util.IstClock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class TaskFilter(val label: String) {
    TODAY("TODAY"),
    OVERDUE("OVERDUE"),
    ALL("ALL"),
    DONE("DONE"),
}

data class TasksUiState(
    val filter: TaskFilter = TaskFilter.ALL,
    val tasks: List<TaskDto> = emptyList(),
    val pendingOutboxCount: Int = 0,
    val isRefreshing: Boolean = false,
    val error: String? = null,
)

class TasksViewModel : ViewModel() {
    private val repo = TasksRepository()
    private val filterFlow = MutableStateFlow(TaskFilter.ALL)
    private val statusFlow = MutableStateFlow<Pair<Boolean, String?>>(false to null)

    val uiState: StateFlow<TasksUiState> = combine(
        filterFlow,
        repo.observeTasks(),
        OutboxManager.database().dao().observePendingCount(),
        statusFlow,
    ) { filter, allTasks, outboxCount, (refreshing, err) ->
        val todayIst = IstClock.todayIstString()
        val filtered = allTasks.filter { task ->
            when (filter) {
                TaskFilter.TODAY -> !task.isCompleted && (task.deadlineType == "same_day" || task.deadlineDate == todayIst)
                TaskFilter.OVERDUE -> !task.isCompleted && task.deadlineType == "specific_date" &&
                    task.deadlineDate != null && task.deadlineDate < todayIst
                TaskFilter.ALL -> !task.isCompleted
                TaskFilter.DONE -> task.isCompleted
            }
        }.sortedWith(
            compareBy<TaskDto>(
                { task ->
                    when {
                        task.isCompleted -> 4
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

        TasksUiState(
            filter = filter,
            tasks = filtered,
            pendingOutboxCount = outboxCount,
            isRefreshing = refreshing,
            error = err,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = TasksUiState(),
    )

    init {
        refresh()
    }

    fun setFilter(filter: TaskFilter) {
        filterFlow.value = filter
    }

    fun refresh() {
        viewModelScope.launch {
            statusFlow.value = true to null
            runCatching { repo.refreshFromRemote() }
                .onSuccess { statusFlow.value = false to null }
                .onFailure { err -> statusFlow.value = false to err.message }
        }
    }

    fun createTask(title: String, deadlineType: String, deadlineDate: String?) {
        if (title.isBlank()) return
        viewModelScope.launch {
            runCatching { repo.createTask(title, deadlineType, deadlineDate) }
                .onFailure { err -> statusFlow.update { it.first to err.message } }
        }
    }

    fun toggleTask(task: TaskDto) {
        viewModelScope.launch {
            runCatching { repo.toggleTask(task) }
                .onFailure { err -> statusFlow.update { it.first to err.message } }
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            runCatching { repo.deleteTask(taskId) }
                .onFailure { err -> statusFlow.update { it.first to err.message } }
        }
    }
}
