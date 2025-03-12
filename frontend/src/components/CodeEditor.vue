<template>
  <div class="code-editor-container">
    <q-card class="editor-card">
      <q-card-section class="q-pb-none">
        <div class="row items-center q-mb-sm">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
          </div>
          <div class="col-auto">
            <q-select
              v-model="language"
              :options="[
                { label: 'Python', value: 'python' },
                { label: 'JavaScript', value: 'javascript' }
              ]"
              label="Jazyk"
              dense
              outlined
              style="width: 150px"
              emit-value
              map-options
              @update:model-value="changeLanguage"
            />
          </div>
        </div>
      </q-card-section>
      
      <q-card-section>
        <div ref="editorContainer" class="editor-container"></div>
      </q-card-section>
      
      <q-card-actions align="right">
        <q-btn
          color="primary"
          icon="play_arrow"
          label="Spustit"
          @click="runCode"
          :loading="running"
        />
        <q-btn
          color="secondary"
          icon="checklist"
          label="Spustit Testy"
          @click="runTests"
          :loading="testing"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { loadPyodide } from '../services/pyodide'

export default {
  name: 'CodeEditor',
  props: {
    title: {
      type: String,
      default: 'Editor kódu'
    },
    initialCode: {
      type: String,
      default: '# Vložte svůj kód zde\n'
    },
    initialLanguage: {
      type: String,
      default: 'python'
    },
    tests: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['output', 'testResults'],
  
  setup(props, { emit }) {
    const editorContainer = ref(null)
    const language = ref(props.initialLanguage)
    const running = ref(false)
    const testing = ref(false)
    let editorView = null
    let pyodideInstance = null
    
    // Inicializace Pyodide
    const initPyodide = async () => {
      if (!pyodideInstance) {
        try {
          emit('output', '> Načítání Pyodide...\n')
          pyodideInstance = await loadPyodide()
          emit('output', '> Pyodide úspěšně načteno\n')
          console.log('Pyodide loaded successfully')
        } catch (error) {
          console.error('Failed to load Pyodide:', error)
          emit('output', 'Chyba při načítání Pyodide: ' + error.message)
        }
      }
      return pyodideInstance
    }
    
    // Spuštění kódu
    const runCode = async () => {
      running.value = true
      const code = editorView.state.doc.toString()
      
      emit('output', '> Spouštění kódu...\n')
      
      try {
        if (language.value === 'python') {
          const pyodide = await initPyodide()
          
          // Resetujeme stdout před každým spuštěním
          pyodide.runPython(`
            import sys
            sys.stdout.truncate(0)
            sys.stdout.seek(0)
          `)
          
          // Spustíme kód
          const result = pyodide.runPython(code)
          
          // Získáme výstup ze stdout
          const stdout = pyodide.runPython('sys.stdout.getvalue()')
          
          // Zobrazíme výstup
          if (stdout) {
            emit('output', stdout)
          }
          
          // Pokud kód vrátil hodnotu, zobrazíme ji také
          if (result !== undefined && result !== null) {
            emit('output', '> Návratová hodnota: ' + result.toString())
          }
        } else if (language.value === 'javascript') {
          // Pro JavaScript použijeme Function constructor místo eval
          // pro lepší bezpečnost
          const result = new Function(`
            let console_output = '';
            const originalConsole = console.log;
            console.log = (...args) => {
              console_output += args.join(' ') + '\\n';
              originalConsole(...args);
            };
            
            try {
              ${code}
              return console_output;
            } catch (error) {
              return 'Chyba: ' + error.message;
            } finally {
              console.log = originalConsole;
            }
          `)()
          
          emit('output', result)
        }
      } catch (error) {
        emit('output', 'Chyba: ' + error.message)
      } finally {
        running.value = false
      }
    }
    
    // Spuštění testů
    const runTests = async () => {
      testing.value = true
      const code = editorView.state.doc.toString()
      
      emit('output', '> Spouštění testů...\n')
      
      if (!props.tests || props.tests.length === 0) {
        emit('output', 'Žádné testy k dispozici.')
        testing.value = false
        return
      }
      
      const testResults = []
      
      try {
        if (language.value === 'python') {
          const pyodide = await initPyodide()
          
          // Resetujeme stdout před každým spuštěním
          pyodide.runPython(`
            import sys
            sys.stdout.truncate(0)
            sys.stdout.seek(0)
          `)
          
          // Vložíme hlavní kód
          pyodide.runPython(code)
          
          // Spustíme každý test
          for (const test of props.tests) {
            try {
              const result = pyodide.runPython(test.code)
              testResults.push({
                name: test.name,
                passed: result == test.expected, // Použijeme == místo === pro porovnání čísel a stringů
                result: result !== undefined ? result.toString() : 'undefined',
                expected: test.expected !== undefined ? test.expected.toString() : 'undefined'
              })
            } catch (error) {
              testResults.push({
                name: test.name,
                passed: false,
                error: error.message
              })
            }
          }
        } else if (language.value === 'javascript') {
          // Pro JavaScript implementujeme jednoduché testování
          for (const test of props.tests) {
            try {
              // Spustíme test v izolovaném prostředí
              const testFunction = new Function(`
                ${code}
                
                try {
                  ${test.code}
                  return { result: (${test.code}) };
                } catch (error) {
                  return { error: error.message };
                }
              `)
              
              const result = testFunction()
              
              if (result.error) {
                testResults.push({
                  name: test.name,
                  passed: false,
                  error: result.error
                })
              } else {
                testResults.push({
                  name: test.name,
                  passed: result.result == test.expected, // Použijeme == místo === pro porovnání čísel a stringů
                  result: result.result !== undefined ? result.result.toString() : 'undefined',
                  expected: test.expected !== undefined ? test.expected.toString() : 'undefined'
                })
              }
            } catch (error) {
              testResults.push({
                name: test.name,
                passed: false,
                error: error.message
              })
            }
          }
        }
        
        emit('testResults', testResults)
        
        // Zobrazíme výsledky testů v konzoli
        let passedCount = testResults.filter(t => t.passed).length
        let outputText = `Výsledky testů: ${passedCount}/${testResults.length} úspěšných\n\n`
        
        testResults.forEach(test => {
          outputText += `${test.name}: ${test.passed ? '✓ Passed' : '✗ Failed'}\n`
          if (!test.passed) {
            if (test.error) {
              outputText += `  Chyba: ${test.error}\n`
            } else {
              outputText += `  Očekáváno: ${test.expected}\n`
              outputText += `  Obdrženo: ${test.result}\n`
            }
          }
        })
        
        emit('output', outputText)
      } catch (error) {
        emit('output', 'Chyba při spouštění testů: ' + error.message)
      } finally {
        testing.value = false
      }
    }
    
    // Změna jazyka
    const changeLanguage = (newLanguage) => {
      const code = editorView ? editorView.state.doc.toString() : props.initialCode
      
      // Vytvoříme nový editor s novým jazykem
      setupEditor(code, newLanguage)
    }
    
    // Inicializace editoru
    const setupEditor = (code, lang) => {
      if (editorView) {
        editorView.destroy()
      }
      
      const langExtension = lang === 'python' ? python() : javascript()
      
      const startState = EditorState.create({
        doc: code,
        extensions: [
          keymap.of([indentWithTab, ...defaultKeymap]),
          langExtension,
          oneDark,
          EditorView.lineWrapping,
          EditorState.tabSize.of(4)
        ]
      })
      
      editorView = new EditorView({
        state: startState,
        parent: editorContainer.value
      })
    }
    
    // Sledujeme změny v props
    watch(() => props.initialCode, (newCode) => {
      if (editorView && newCode) {
        setupEditor(newCode, language.value)
      }
    })
    
    watch(() => props.initialLanguage, (newLanguage) => {
      if (newLanguage && newLanguage !== language.value) {
        language.value = newLanguage
        const code = editorView ? editorView.state.doc.toString() : props.initialCode
        setupEditor(code, newLanguage)
      }
    })
    
    onMounted(() => {
      setupEditor(props.initialCode, language.value)
      
      // Inicializujeme Pyodide na pozadí
      initPyodide()
    })
    
    return {
      editorContainer,
      language,
      running,
      testing,
      runCode,
      runTests,
      changeLanguage
    }
  }
}
</script>

<style scoped>
.code-editor-container {
  width: 100%;
  height: 100%;
}

.editor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  height: 400px;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  flex-grow: 1;
  background-color: #282c34;
}

.cm-editor {
  height: 100%;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
}

/* Přidáme styl pro zvýraznění aktivního řádku */
.cm-activeLine {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Přidáme styl pro čísla řádků */
.cm-gutters {
  background-color: #21252b;
  color: #636d83;
  border-right: 1px solid #3a3f4b;
}

/* Přidáme styl pro závorky */
.cm-matchingBracket {
  background-color: rgba(73, 130, 73, 0.5);
  color: #fff !important;
}
</style>