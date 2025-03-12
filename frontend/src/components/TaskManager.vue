<template>
  <q-card class="task-form">
    <q-card-section>
      <h5 class="q-my-none">{{ isEditing ? 'Upravit úlohu' : 'Přidat novou úlohu' }}</h5>
      
      <q-form @submit.prevent="saveTask" class="q-mt-md">
        <q-input
          v-model="task.title"
          label="Název úlohy"
          outlined
          :rules="[val => !!val || 'Název je povinný']"
          class="q-mb-md"
        />
        
        <q-input
          v-model="task.description"
          label="Popis úlohy"
          type="textarea"
          outlined
          autogrow
          class="q-mb-md"
        />
        
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="task.language"
              :options="[
                { label: 'Python', value: 'python' },
                { label: 'JavaScript', value: 'javascript' }
              ]"
              label="Programovací jazyk"
              outlined
              emit-value
              map-options
            />
          </div>
        </div>
        
        <q-card bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle2">Výchozí kód</div>
            <q-input
              v-model="task.initialCode"
              type="textarea"
              outlined
              autogrow
              class="q-mt-sm"
              :label="`Kód v jazyce ${task.language}`"
            />
          </q-card-section>
        </q-card>
        
        <q-card bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-subtitle2">Testy</div>
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  icon="add"
                  round
                  size="sm"
                  @click="addTest"
                  :disable="task.tests.length >= 10"
                />
              </div>
            </div>
            
            <div v-if="task.tests.length === 0" class="text-center q-pa-md text-grey">
              Klikněte na tlačítko + pro přidání testu
            </div>
            
            <q-list separator>
              <q-expansion-item
                v-for="(test, index) in task.tests"
                :key="index"
                :label="`Test ${index + 1}: ${test.name || 'Nepojmenovaný test'}`"
                header-class="test-header"
                expand-icon-class="text-primary"
                class="q-mt-sm"
              >
                <q-card>
                  <q-card-section>
                    <div class="row q-col-gutter-sm">
                      <div class="col-12">
                        <q-input
                          v-model="test.name"
                          label="Název testu"
                          outlined
                          dense
                        />
                      </div>
                      <div class="col-12">
                        <q-input
                          v-model="test.code"
                          label="Kód testu"
                          type="textarea"
                          outlined
                          autogrow
                          dense
                          hint="Např. add(2, 3)"
                        />
                      </div>
                      <div class="col-12">
                        <q-input
                          v-model="test.expected"
                          label="Očekávaný výsledek"
                          outlined
                          dense
                          hint="Např. 5"
                        />
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn
                      flat
                      round
                      icon="delete"
                      size="sm"
                      color="negative"
                      @click="removeTest(index)"
                    />
                  </q-card-actions>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>
        
        <div class="row q-mt-lg">
          <q-btn
            type="submit"
            color="primary"
            :label="isEditing ? 'Uložit změny' : 'Přidat úlohu'"
            :loading="saving"
          />
          <q-btn
            flat
            label="Zrušit"
            class="q-ml-sm"
            @click="cancel"
            :disable="saving"
          />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'TaskManager',
  props: {
    editTask: {
      type: Object,
      default: null
    }
  },
  
  emits: ['save', 'cancel'],
  
  setup(props, { emit }) {
    const defaultTask = {
      title: '',
      description: '',
      language: 'python',
      initialCode: '# Vložte svůj kód zde\n',
      tests: []
    }
    
    const task = ref({...defaultTask})
    const saving = ref(false)
    
    // Sledujeme změny v editované úloze
    const isEditing = computed(() => props.editTask !== null)
    
    // Sledujeme změny v props.editTask
    watch(() => props.editTask, (newTask) => {
      if (newTask) {
        task.value = { ...newTask }
      } else {
        task.value = { ...defaultTask }
      }
    }, { immediate: true })
    
    // Přidáme nový test
    const addTest = () => {
      task.value.tests.push({
        name: `Test ${task.value.tests.length + 1}`,
        code: '',
        expected: ''
      })
    }
    
    // Odebereme test
    const removeTest = (index) => {
      task.value.tests.splice(index, 1)
    }
    
    // Uložíme úlohu
    const saveTask = async () => {
      saving.value = true
      try {
        await emit('save', { ...task.value })
        if (!isEditing.value) {
          task.value = { ...defaultTask }
        }
      } finally {
        saving.value = false
      }
    }
    
    // Zrušíme editaci
    const cancel = () => {
      emit('cancel')
    }
    
    return {
      task,
      isEditing,
      saving,
      addTest,
      removeTest,
      saveTask,
      cancel
    }
  }
}
</script>

<style scoped>
.task-form {
  width: 100%;
}

.test-header {
  font-weight: 500;
}

.test-item {
  margin-bottom: 16px;
}
</style>