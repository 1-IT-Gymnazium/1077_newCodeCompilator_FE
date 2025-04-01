<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <!-- Seznam úloh -->
      <div class="col-12 col-md-3">
        <q-card class="task-list-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="col">
                <h5 class="q-my-none">Seznam úloh</h5>
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  round
                  icon="refresh"
                  size="sm"
                  color="primary"
                  @click="loadTasks"
                  :loading="loading"
                />
              </div>
            </div>
            
            <q-list separator bordered>
              <q-item
                v-for="task in tasks"
                :key="task.id"
                clickable
                @click="loadTask(task.id)"
                :active="selectedTaskId === task.id"
                active-class="bg-primary text-white"
              >
                <q-item-section>
                  <q-item-label>{{ task.title }}</q-item-label>
                  <q-item-label caption lines="1" :class="selectedTaskId === task.id ? 'text-white' : ''">
                    {{ task.description.substring(0, 30) }}{{ task.description.length > 30 ? '...' : '' }}
                  </q-item-label>
                </q-item-section>
                
                <q-item-section side>
                  <q-badge :color="task.language === 'python' ? 'blue' : 'orange'">
                    {{ task.language }}
                  </q-badge>
                </q-item-section>
              </q-item>
              
              <q-item v-if="tasks.length === 0">
                <q-item-section>
                  <q-item-label class="text-center q-py-md text-grey">
                    Žádné úlohy k dispozici
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            
            <div class="q-mt-md">
              <q-btn
                to="/tasks"
                color="primary"
                label="Správa úloh"
                icon="settings"
                no-caps
                class="full-width"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Obsah úlohy a editor -->
      <template v-if="currentTask">
        <!-- Popis úlohy (vlevo) -->
        <div class="col-12 col-md-3">
          <q-card class="task-info">
            <q-card-section>
              <h5 class="q-my-none">{{ currentTask.title }}</h5>
              
              <q-separator class="q-my-md" />
              
              <div class="task-description">
                {{ currentTask.description }}
              </div>
              
              <div class="q-mt-sm">
                <q-badge :color="currentTask.language === 'python' ? 'blue' : 'orange'">
                  {{ currentTask.language }}
                </q-badge>
                <q-badge color="green" class="q-ml-xs" v-if="currentTask.tests && currentTask.tests.length">
                  {{ currentTask.tests.length }} testů
                </q-badge>
              </div>
            </q-card-section>
          </q-card>
          
          <!-- Výsledky testů -->
          <q-card v-if="testResults.length > 0" class="q-mt-md test-results">
            <q-card-section>
              <h6 class="q-my-none">Výsledky testů</h6>
              
              <q-list separator>
                <q-item v-for="(test, index) in testResults" :key="index">
                  <q-item-section avatar>
                    <q-icon
                      :name="test.passed ? 'check_circle' : 'error'"
                      :color="test.passed ? 'positive' : 'negative'"
                      size="md"
                    />
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label>{{ test.name }}</q-item-label>
                    <q-item-label caption v-if="!test.passed && test.error">
                      Chyba: {{ test.error }}
                    </q-item-label>
                    <q-item-label caption v-else-if="!test.passed">
                      Očekáváno: {{ test.expected }}<br>
                      Obdrženo: {{ test.result }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
        
        <!-- Editor kódu (vpravo) -->
        <div class="col-12 col-md-6">
          <div class="editor-wrapper">
            <CodeEditor
              :title="currentTask.title"
              :initial-code="currentTask.initialCode"
              :initial-language="currentTask.language"
              :tests="currentTask.tests"
              @output="updateOutput"
              @test-results="handleTestResults"
            />
          </div>
          
          <!-- Konzole -->
          <div class="q-mt-md">
            <Console :output="consoleOutput" @clear="clearConsole" />
          </div>
        </div>
      </template>
      
      <!-- Prázdný stav - žádná úloha není vybrána -->
      <div class="col-12 col-md-9" v-if="!currentTask">
        <q-card class="full-height flex flex-center">
          <q-card-section class="text-center">
            <q-icon name="code" size="100px" color="primary" />
            <h5>Vyberte úlohu ze seznamu</h5>
            <p class="text-grey-8">
              Klikněte na úlohu v seznamu vlevo pro zahájení programování
            </p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import CodeEditor from '../components/CodeEditor.vue'
import Console from '../components/Console.vue'
import { getTasks, getTask } from '../services/api'
import { useQuasar } from 'quasar'

export default {
  name: 'EditorPage',
  components: {
    CodeEditor,
    Console
  },
  
  setup() {
    const $q = useQuasar()
    const tasks = ref([])
    const selectedTaskId = ref(null)
    const currentTask = ref(null)
    const consoleOutput = ref('// Konzolový výstup se zobrazí zde\n')
    const testResults = ref([])
    const loading = ref(false)
    
    // Načteme seznam úloh
    const loadTasks = async () => {
      loading.value = true
      try {
        tasks.value = await getTasks()
        
        // Pokud máme úlohy a žádná není vybrána, vybereme první
        if (tasks.value.length > 0 && !selectedTaskId.value) {
          selectedTaskId.value = tasks.value[0].id
          await loadTask(selectedTaskId.value)
        }
      } catch (error) {
        console.error('Chyba při načítání úloh:', error)
        $q.notify({
          color: 'negative',
          message: 'Nepodařilo se načíst úlohy. Zkontrolujte, zda běží backend.',
          icon: 'error',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Načteme konkrétní úlohu
    const loadTask = async (taskId) => {
      if (!taskId) {
        currentTask.value = null
        return
      }
      
      selectedTaskId.value = taskId
      loading.value = true
      
      try {
        currentTask.value = await getTask(taskId)
        clearConsole()
      } catch (error) {
        console.error('Chyba při načítání úlohy:', error)
        $q.notify({
          color: 'negative',
          message: 'Nepodařilo se načíst úlohu.',
          icon: 'error',
          position: 'top'
        })
      } finally {
        loading.value = false
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
    
    // Načteme úlohy při inicializaci komponenty
    onMounted(() => {
      loadTasks()
    })
    
    return {
      tasks,
      selectedTaskId,
      currentTask,
      consoleOutput,
      testResults,
      loading,
      loadTasks,
      loadTask,
      updateOutput,
      clearConsole,
      handleTestResults
    }
  }
}
</script>

<style scoped>
.task-list-card,
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

.test-results {
  max-height: 300px;
  overflow-y: auto;
}

.full-height {
  height: 100%;
  min-height: 400px;
}

.flex {
  display: flex;
}

.flex-center {
  align-items: center;
  justify-content: center;
}
</style>
