<template>
  <q-card class="console-card">
    <q-card-section class="q-pb-none">
      <div class="row items-center q-mb-sm">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">Konzole</div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            round
            dense
            icon="clear_all"
            color="grey-7"
            @click="clearConsole"
            title="Vyčistit konzoli"
          />
        </div>
      </div>
    </q-card-section>
    
    <q-card-section class="q-pa-none">
      <div class="console-output" ref="consoleContainer">
        <pre ref="consoleText" class="console-text">{{ processedOutput }}</pre>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref, watch, nextTick, computed } from 'vue'

export default {
  name: 'Console',
  props: {
    output: {
      type: String,
      default: ''
    }
  },
  
  emits: ['clear'],
  
  setup(props, { emit }) {
    const consoleText = ref(null)
    const consoleContainer = ref(null)
    
    // Zpracování výstupu - odstranění obtížností
    const processedOutput = computed(() => {
      // Odstranění řádků s obtížnostmi (Easy, Medium, Hard)
      return props.output
        .split('\n')
        .filter(line =>
          !line.includes('Easy') &&
          !line.includes('Medium') &&
          !line.includes('Hard') &&
          !line.match(/\d+\.\d+%/)
        )
        .join('\n');
    });
    
    // Automatické scrollování na konec konzole při změně výstupu
    watch(() => processedOutput.value, () => {
      nextTick(() => {
        if (consoleContainer.value) {
          consoleContainer.value.scrollTop = consoleContainer.value.scrollHeight
        }
      })
    })
    
    const clearConsole = () => {
      emit('clear')
    }
    
    return {
      consoleText,
      consoleContainer,
      clearConsole,
      processedOutput
    }
  }
}
</script>

<style scoped>
.console-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.console-output {
  height: 200px;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.console-text {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Stylování různých typů výstupu */
.console-text :deep(.error) {
  color: #ff5252;
}

.console-text :deep(.success) {
  color: #4caf50;
}

.console-text :deep(.warning) {
  color: #fb8c00;
}

.console-text :deep(.info) {
  color: #2196f3;
}
</style>
