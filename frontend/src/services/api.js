import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

// Získání všech úloh
export async function getTasks() {
  const response = await axios.get(`${API_URL}/tasks`)
  return response.data
}

// Získání detailu úlohy
export async function getTask(taskId) {
  const response = await axios.get(`${API_URL}/tasks/${taskId}`)
  return response.data
}

// Vytvoření nové úlohy
export async function createTask(taskData) {
  const response = await axios.post(`${API_URL}/tasks`, taskData)
  return response.data
}

// Aktualizace úlohy
export async function updateTask(taskId, taskData) {
  const response = await axios.put(`${API_URL}/tasks/${taskId}`, taskData)
  return response.data
}

// Smazání úlohy
export async function deleteTask(taskId) {
  const response = await axios.delete(`${API_URL}/tasks/${taskId}`)
  return response.data
}