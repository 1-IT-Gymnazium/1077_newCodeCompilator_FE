<template>
  <q-page padding>
    <div class="row q-mb-md items-center">
      <div class="col">
        <h4 class="q-my-none">Seznam úloh</h4>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Nová úloha"
          @click="showTaskManager = true"
        />
      </div>
    </div>
    
    <!-- Tabulka úloh -->
    <q-card flat bordered>
      <q-table
        :rows="tasks"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        :loading="loading"
        binary-state-sort
        flat
        bordered
      >
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th auto-width>Status</q-th>
            <q-th>Title</q-th>
            <q-th auto-width>
              <q-btn flat dense size="sm" icon="code" />
              Solution
            </q-th>
            <q-th auto-width>
              <q-btn flat dense size="sm" icon="check_circle" />
              Acceptance
            </q-th>
            <q-th auto-width>
              <q-btn flat dense size="sm" icon="signal_cellular_alt" />
              Difficulty
            </q-th>
            <q-th auto-width>
              <q-btn flat dense size="sm" icon="trending_up" />
              Frequency
            </q-th>
          </q-tr>
        </template>
        
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td auto-width>
              <q-icon name="event_available" color="green" />
            </q-td>
            <q-td @click="toggleTaskExpand(props.row)" class="cursor-pointer">
              {{ props.row.title }}
            </q-td>
            <q-td auto-width>
              <q-btn flat dense size="sm" round icon="code" color="primary" @click.stop="toggleTaskExpand(props.row)" />
            </q-td>
            <q-td auto-width>
              {{ Math.floor(Math.random() * 100) }}.{{ Math.floor(Math.random() * 10) }}%
            </q-td>
            <q-td auto-width>
              <span :class="`text-${getDifficultyColor(props.row)}`">
                {{ getDifficulty(props.row) }}
              </span>
            </q-td>
            <q-td auto-width class="q-gutter-x-xs">
              <q-btn
                flat
                dense
                size="sm"
                round
                icon="edit"
                color="primary"
                @click.stop="editTask(props.row)"
                class="edit-btn"
              >
                <q-tooltip>Upravit úlohu</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                size="sm"
                round
                icon="delete"
                color="negative"
                @click.stop="confirmDelete(props.row)"
                class="delete-btn"
              >
                <q-tooltip>Smazat úlohu</q-tooltip>
              </q-btn>
              <q-icon name="lock" color="grey" />
            </q-td>
          </q-tr>
          
          <!-- Rozbalený obsah úlohy -->
          <q-tr v-if="expandedTask === props.row.id">
            <q-td colspan="100%">
              <div class="row q-col-gutter-md q-py-md">
                <!-- Popis úlohy -->
                <div class="col-12 col-md-4">
                  <q-card class="task-info">
                    <q-card-section>
                      <h5 class="q-my-none">{{ props.row.title }}</h5>
                      
                      <q-separator class="q-my-md" />
                      
                      <div class="task-description">
                        {{ props.row.description }}
                      </div>
                      
                      <div class="q-mt-sm">
                        <q-badge :color="props.row.language === 'python' ? 'blue' : 'orange'">
                          {{ props.row.language }}
                        </q-badge>
                        <q-badge color="green" class="q-ml-xs" v-if="props.row.tests && props.row.tests.length">
                          {{ props.row.tests.length }} testů
                        </q-badge>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
                
                <!-- Editor kódu -->
                <div class="col-12 col-md-8">
                  <div class="editor-wrapper">
                    <CodeEditor
                      :title="props.row.title"
                      :initial-code="props.row.initialCode"
                      :initial-language="props.row.language"
                      :tests="props.row.tests"
                      @output="updateOutput"
                      @test-results="handleTestResults"
                    />
                  </div>
                  
                  <!-- Konzole -->
                  <div class="q-mt-md">
                    <Console :output="consoleOutput" @clear="clearConsole" />
                  </div>
                </div>
              </div>
              
              <!-- Tlačítka pro akce s úlohou -->
              <div class="row q-col-gutter-sm q-mt-md justify-end">
                <div class="col-auto">
                  <q-btn
                    flat
                    icon="edit"
                    color="primary"
                    label="Upravit"
                    @click.stop="editTask(props.row)"
                  />
                </div>
                <div class="col-auto">
                  <q-btn
                    flat
                    icon="delete"
                    color="negative"
                    label="Smazat"
                    @click.stop="confirmDelete(props.row)"
                  />
                </div>
              </div>
            </q-td>
          </q-tr>
        </template>
        
        <template v-slot:no-data>
          <div class="full-width row flex-center q-py-lg">
            <q-icon name="code" size="2rem" color="grey-5" />
            <div class="q-ml-sm text-grey-5">Žádné úlohy k dispozici</div>
          </div>
        </template>
      </q-table>
    </q-card>
    
    <!-- Dialog pro správu úloh -->
    <q-dialog v-model="showTaskManager" persistent maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ currentEditTask ? 'Upravit úlohu' : 'Přidat novou úlohu' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="cancelEdit" />
        </q-card-section>
        
        <q-card-section class="q-pa-md">
          <TaskManager
            :edit-task="currentEditTask"
            @save="saveTask"
            @cancel="cancelEdit"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
    
    <!-- Dialog pro potvrzení smazání -->
    <q-dialog v-model="deleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Opravdu chcete smazat úlohu "{{ taskToDelete?.title }}"?</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Zrušit" color="primary" @click="deleteDialog = false" />
          <q-btn flat label="Smazat" color="negative" @click="deleteTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import TaskManager from '../components/TaskManager.vue'
import CodeEditor from '../components/CodeEditor.vue'
import Console from '../components/Console.vue'
import { getTasks, createTask, updateTask, deleteTask as apiDeleteTask, getTask } from '../services/api'
import { useQuasar } from 'quasar'

export default {
  name: 'TasksPage',
  components: {
    TaskManager,
    CodeEditor,
    Console
  },
  
  setup() {
    const $q = useQuasar()
    const tasks = ref([])
    const currentEditTask = ref(null)
    const deleteDialog = ref(false)
    const taskToDelete = ref(null)
    const loading = ref(false)
    const showTaskManager = ref(false)
    const expandedTask = ref(null)
    const consoleOutput = ref('// Konzolový výstup se zobrazí zde\n')
    const testResults = ref([])
    
    // Definice sloupců pro tabulku
    const columns = [
      { name: 'status', label: 'Status', field: 'status', align: 'left' },
      { name: 'title', label: 'Title', field: 'title', align: 'left' },
      { name: 'solution', label: 'Solution', field: 'solution', align: 'center' },
      { name: 'acceptance', label: 'Acceptance', field: 'acceptance', align: 'center' },
      { name: 'difficulty', label: 'Difficulty', field: 'difficulty', align: 'center' },
      { name: 'frequency', label: 'Frequency', field: 'frequency', align: 'center' }
    ]
    
    // Načteme seznam úloh
    const loadTasks = async () => {
      loading.value = true
      try {
        tasks.value = await getTasks()
      } catch (error) {
        console.error('Chyba při načítání úloh:', error)
        $q.notify({
          color: 'negative',
          message: 'Nepodařilo se načíst úlohy. Zkontrolujte, zda běží backend.',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Vytvoření nové úlohy
    const createNewTask = () => {
      currentEditTask.value = null
      showTaskManager.value = true
    }
    
    // Editace úlohy
    const editTask = (task) => {
      currentEditTask.value = { ...task }
      showTaskManager.value = true
    }
    
    // Zrušení editace
    const cancelEdit = () => {
      currentEditTask.value = null
      showTaskManager.value = false
    }
    
    // Uložení úlohy (vytvoření nebo aktualizace)
    const saveTask = async (taskData) => {
      try {
        if (taskData.id) {
          // Aktualizace existující úlohy
          await updateTask(taskData.id, taskData)
          $q.notify({
            color: 'positive',
            message: 'Úloha byla úspěšně aktualizována',
            icon: 'check'
          })
        } else {
          // Vytvoření nové úlohy
          await createTask(taskData)
          $q.notify({
            color: 'positive',
            message: 'Nová úloha byla úspěšně vytvořena',
            icon: 'check'
          })
        }
        
        // Znovu načteme seznam úloh
        await loadTasks()
        
        // Zrušíme editaci
        currentEditTask.value = null
        showTaskManager.value = false
      } catch (error) {
        console.error('Chyba při ukládání úlohy:', error)
        $q.notify({
          color: 'negative',
          message: 'Nepodařilo se uložit úlohu',
          icon: 'error'
        })
      }
    }
    
    // Potvrzení smazání
    const confirmDelete = (task) => {
      taskToDelete.value = task
      deleteDialog.value = true
    }
    
    // Smazání úlohy
    const deleteTask = async () => {
      if (!taskToDelete.value) return
      
      try {
        await apiDeleteTask(taskToDelete.value.id)
        $q.notify({
          color: 'positive',
          message: 'Úloha byla úspěšně smazána',
          icon: 'check'
        })
        
        // Znovu načteme seznam úloh
        await loadTasks()
        
        // Pokud byla smazaná úloha rozbalená, zavřeme ji
        if (expandedTask.value === taskToDelete.value.id) {
          expandedTask.value = null
        }
        
        // Zavřeme dialog
        deleteDialog.value = false
      } catch (error) {
        console.error('Chyba při mazání úlohy:', error)
        $q.notify({
          color: 'negative',
          message: 'Nepodařilo se smazat úlohu',
          icon: 'error'
        })
      }
    }
    
    // Rozbalení/sbalení úlohy
    const toggleTaskExpand = async (task) => {
      if (expandedTask.value === task.id) {
        expandedTask.value = null
      } else {
        expandedTask.value = task.id
        clearConsole()
      }
    }
    
    // Aktualizujeme výstup konzole
    const updateOutput = (output) => {
      consoleOutput.value += output + '\n'
    }
    
    // Vyčistíme konzoli
    const clearConsole = () => {
      consoleOutput.value = '// Konzolový výstup se zobrazí zde\n'
    }
    
    // Zpracujeme výsledky testů
    const handleTestResults = (results) => {
      testResults.value = results
      
      // Zobrazíme notifikaci s výsledky
      const passedCount = results.filter(r => r.passed).length
      const totalCount = results.length
      
      $q.notify({
        color: passedCount === totalCount ? 'positive' : 'warning',
        message: `Testy: ${passedCount}/${totalCount} úspěšných`,
        icon: passedCount === totalCount ? 'check_circle' : 'warning',
        position: 'top-right',
        timeout: 2000
      })
    }
    
    // Určení obtížnosti úlohy
    const getDifficulty = (task) => {
      // Zde můžete implementovat vlastní logiku pro určení obtížnosti
      // Pro ukázku použijeme náhodnou obtížnost
      const index = task.id.charCodeAt(0) % 3
      return ['Easy', 'Medium', 'Hard'][index]
    }
    
    // Barva pro obtížnost
    const getDifficultyColor = (task) => {
      const difficulty = getDifficulty(task)
      if (difficulty === 'Easy') return 'green'
      if (difficulty === 'Medium') return 'orange'
      return 'red'
    }
    
    // Načteme úlohy při inicializaci komponenty
    onMounted(() => {
      loadTasks()
    })
    
    return {
      tasks,
      columns,
      currentEditTask,
      deleteDialog,
      taskToDelete,
      loading,
      showTaskManager,
      expandedTask,
      consoleOutput,
      testResults,
      loadTasks,
      createNewTask,
      editTask,
      cancelEdit,
      saveTask,
      confirmDelete,
      deleteTask,
      toggleTaskExpand,
      updateOutput,
      clearConsole,
      handleTestResults,
      getDifficulty,
      getDifficultyColor
    }
  }
}
</script>

<style scoped>
.task-info {
  height: 100%;
}

.task-description {
  white-space: pre-line;
  font-size: 14px;
  line-height: 1.5;
}

.editor-wrapper {
  height: 100%;
  min-height: 400px;
}

.cursor-pointer {
  cursor: pointer;
}

.edit-btn {
  background-color: rgba(25, 118, 210, 0.1);
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background-color: rgba(25, 118, 210, 0.2);
  transform: scale(1.1);
}

.delete-btn {
  background-color: rgba(255, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background-color: rgba(255, 0, 0, 0.2);
  transform: scale(1.1);
}
</style>