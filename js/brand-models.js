// Brand Models JavaScript (using global functions)
// Functions are now available globally from simple-auth.js

// Global variables
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚗 Brand models page loaded');
  // No authentication check needed - proceed directly
});

// Simple model selection - no authentication check
function selectModelWithAuth(modelId, modelName, modelFile) {
  console.log('🚗 Starting tuning for model:', modelName);
  
  // Proceed directly with model selection
  proceedWithModelSelection(modelId, modelName, modelFile);
}

// Proceed with model selection (authenticated users only)
function proceedWithModelSelection(modelId, modelName, modelFile) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }

  // Store selected model data
  localStorage.setItem('selectedCar', modelName);
  localStorage.setItem('selectedModel', modelFile);
  localStorage.setItem('selectedModelId', modelId);

  const targetMaterialsMap = {
    'audi-r8': ["Body_Paint", "Mirror_Paint"],
    'audi-rs6': ["Car_Body", "Body"],
    'lamborghini-gallardo': ["gallardoVehicle_Exterior_mm_ext1","gallardoVehicle_Exterior_mm_cab1"],
    'lamborghini-huracan': ["Car_Body", "paint"],
    'lamborghini-revuelto': ["Car_Body", "paint"],
    'ferrari-f40': ["Car_Body", "paint"],
    'ferrari-12cilindri': ["Car_Body", "paint"],
    'nissan-silvia-s14': ["Car_Body"],
    'nissan-silvia-s15': ["Car_Body"],
    'nissan-gtr-r34': ["Car_Body"],
    'nissan-skyline-r33': ["Car_Body"],
    'nissan-skyline-r32': ["Car_Body"],
    'bmw-m4-f82': ["Car_Body"],
    'bmw-m8-competition': ["Car_Body"],
    'toyota-supra': ["Car_Body"],
    'toyota-gr-supra': ["Car_Body"],
    'porsche-911': ["Car_Body"],
    'mercedes-amg-gt': ["Car_Body"]
  };
  const mats = targetMaterialsMap[modelId] || ["Car_Body", "paint", "Body"];
  localStorage.setItem('targetMaterials', JSON.stringify(mats));

  // Simulate loading time
  setTimeout(() => {
    // Redirect to tuning page
    window.location.href = 'tuning page.html';
  }, 800);
}

// Make functions globally available
window.selectModelWithAuth = selectModelWithAuth;
