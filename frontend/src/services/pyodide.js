// Funkce pro načtení a inicializaci Pyodide
export async function loadPyodide() {
  if (window.pyodide) {
    return window.pyodide
  }
  
  // Načtení Pyodide
  window.pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
  })
  
  // Přesměrování stdout do konzole
  window.pyodide.runPython(`
    import sys
    import io
    
    class CustomStdout(io.StringIO):
        def write(self, text):
            super().write(text)
            return len(text)
    
    sys.stdout = CustomStdout()
    sys.stderr = CustomStdout()
  `)
  
  return window.pyodide
}