// Hide loader when scene is loaded
document.addEventListener('DOMContentLoaded', function() {
  const scene = document.querySelector("a-scene");
  scene.addEventListener("loaded", function () {
    const loader = document.querySelector(".arjs-loader");
    if (loader) {
      loader.style.display = "none"; 
    }
    console.log("AR.js scene loaded");
    
    // Apply initial performance optimizations
    applyPerformanceSettings('low');
  });

  // Toggle texture controls panel functionality
  const toggleBtn = document.getElementById('toggle-controls-btn');
  const controlsPanel = document.getElementById('texture-controls');
  
  if (toggleBtn && controlsPanel) {
    toggleBtn.addEventListener('click', function() {
      controlsPanel.classList.toggle('hidden');
      
      // Update button text based on panel visibility
      if (controlsPanel.classList.contains('hidden')) {
        toggleBtn.textContent = 'Show Controls';
      } else {
        toggleBtn.textContent = 'Hide Controls';
      }
    });
    
    // Set initial button text
    toggleBtn.textContent = 'Show Texture Controls';
  }

  // Toggle model controls panel functionality
  const toggleModelBtn = document.getElementById('toggle-model-btn');
  const modelControlsPanel = document.getElementById('model-controls');
  
  if (toggleModelBtn && modelControlsPanel) {
    toggleModelBtn.addEventListener('click', function() {
      modelControlsPanel.classList.toggle('hidden');
      
      // Update button text based on panel visibility
      if (modelControlsPanel.classList.contains('hidden')) {
        toggleModelBtn.textContent = 'Show Model Settings';
      } else {
        toggleModelBtn.textContent = 'Hide Model Settings';
      }
    });
    
    // Set initial button text
    toggleModelBtn.textContent = 'Show Model Settings';
  }

  // Quality toggle functionality
  const toggleQualityBtn = document.getElementById('toggle-quality-btn');
  let currentQuality = 'low'; // Start with low quality for better performance
  
  if (toggleQualityBtn) {
    toggleQualityBtn.addEventListener('click', function() {
      // Toggle between high and low quality
      currentQuality = currentQuality === 'high' ? 'low' : 'high';
      
      // Update button text
      toggleQualityBtn.textContent = currentQuality === 'high' ? 'High Quality' : 'Low Quality';
      
      // Apply the performance settings
      applyPerformanceSettings(currentQuality);
    });
    
    // Set initial button text
    toggleQualityBtn.textContent = 'Low Quality';
  }
  
  // Function to apply performance settings
  function applyPerformanceSettings(quality) {
    console.log(`Applying ${quality} quality settings`);
    
    // Get the renderer
    const renderer = scene.renderer;
    if (!renderer) return;
    
    // Get all models
    const models = document.querySelectorAll('[model-optimizer]');
    
    if (quality === 'high') {
      // High quality settings
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      
      // Enable higher quality materials
      models.forEach(model => {
        const modelOptimizer = model.components['model-optimizer'];
        if (modelOptimizer) {
          modelOptimizer.data.simplifyModels = false;
          modelOptimizer.optimizeModel(); // Re-run optimization with new settings
        }
        
        // Enable model shadows
        const object3D = model.object3D;
        if (object3D) {
          object3D.traverse(node => {
            if (node.isMesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Use higher quality materials if possible
              if (node.material && node.material.map) {
                node.material.roughness = 0.8;
                node.material.metalness = 0.2;
              }
            }
          });
        }
      });
    } else {
      // Low quality (performance) settings
      renderer.setPixelRatio(1); // Reduced pixel ratio
      renderer.shadowMap.enabled = false;
      
      // Limit framerate for better performance
      // Note: This requires browser support
      if ('setFrameRate' in renderer) {
        renderer.setFrameRate(30); // Limit to 30fps for better performance
      }
      
      // Apply performance optimizations to all models
      models.forEach(model => {
        const modelOptimizer = model.components['model-optimizer'];
        if (modelOptimizer) {
          modelOptimizer.data.simplifyModels = true;
          modelOptimizer.optimizeModel(); // Re-run optimization with new settings
        }
        
        // Disable model shadows and use simpler materials
        const object3D = model.object3D;
        if (object3D) {
          object3D.traverse(node => {
            if (node.isMesh) {
              node.castShadow = false;
              node.receiveShadow = false;
              
              // Simplify materials for better performance
              if (node.material) {
                if (Array.isArray(node.material)) {
                  node.material.forEach(mat => {
                    simplifyMaterial(mat);
                  });
                } else {
                  simplifyMaterial(node.material);
                }
              }
            }
          });
        }
      });
    }
    
    // Force scene render update
    scene.renderer.render(scene.object3D, scene.camera);
  }
  
  // Helper function to simplify materials for better performance
  function simplifyMaterial(material) {
    if (!material) return;
    
    // Keep the texture map but simplify other properties
    material.roughness = 1.0;
    material.metalness = 0.0;
    material.reflectivity = 0;
    material.fog = false;
    
    // Disable computationally expensive features
    if (material.envMap) material.envMap = null;
    if (material.lightMap) material.lightMap = null;
    if (material.aoMap) material.aoMap = null;
    if (material.emissiveMap) material.emissiveMap = null;
    if (material.bumpMap) material.bumpMap = null;
    if (material.normalMap) material.normalMap = null;
    if (material.displacementMap) material.displacementMap = null;
    if (material.roughnessMap) material.roughnessMap = null;
    if (material.metalnessMap) material.metalnessMap = null;
    
    // Reduce texture quality if needed
    if (material.map && material.map.image) {
      // We can't modify the texture directly without reloading, but we can note this for future
      console.log('Material has texture that could be optimized');
    }
    
    // Use the simpler MeshBasicMaterial if really struggling with performance
    /*
    if (material.map) {
      const newMaterial = new THREE.MeshBasicMaterial({
        map: material.map,
        transparent: material.transparent,
        opacity: material.opacity,
        side: material.side
      });
      return newMaterial; // Note: caller would need to apply this
    }
    */
  }

  // Log when marker is found/lost and update status indicator
  const marker = document.querySelector("a-marker");
  const markerStatus = document.getElementById('marker-status');
  
  if (marker && markerStatus) {
    // Timer for marker detection stability
    let markerVisibleTimeout;
    
    marker.addEventListener("markerFound", function () {
      console.log("Marker found!");
      // Update marker status indicator
      markerStatus.textContent = "Marker Detected";
      markerStatus.style.backgroundColor = "rgba(0, 128, 0, 0.7)"; // Green
      
      // Clear any pending timeouts to avoid flicker
      if (markerVisibleTimeout) {
        clearTimeout(markerVisibleTimeout);
      }
      
      // If we're in low quality mode, switch to higher quality briefly
      if (currentQuality === 'low') {
        // Optional: temporarily increase quality when marker is detected
        // applyPerformanceSettings('medium');
      }
    });
    
    marker.addEventListener("markerLost", function () {
      console.log("Marker lost!");
      
      // Add a small delay before showing "no marker" to prevent flickering
      markerVisibleTimeout = setTimeout(() => {
        markerStatus.textContent = "No Marker Detected";
        markerStatus.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // Red
        
        // Go back to low quality mode to save resources
        if (currentQuality === 'medium') {
          applyPerformanceSettings('low');
        }
      }, 1000); // 1-second delay
    });
  }
  
  // Tree size slider control
  const sizeSlider = document.getElementById('tree-size-slider');
  const sizeValue = document.getElementById('size-value');
  
  if (sizeSlider && sizeValue) {
    sizeSlider.addEventListener('input', function() {
      const size = parseFloat(this.value);
      sizeValue.textContent = size.toFixed(2);
      
      // Update the tree entity scale
      const treeEntity = document.querySelector('a-entity[obj-model]');
      if (treeEntity) {
        treeEntity.setAttribute('scale', `${size} ${size} ${size}`);
      }
    });
  }

  // Tree position sliders control
  const xSlider = document.getElementById('tree-x-slider');
  const ySlider = document.getElementById('tree-y-slider');
  const zSlider = document.getElementById('tree-z-slider');
  const xValue = document.getElementById('x-value');
  const yValue = document.getElementById('y-value');
  const zValue = document.getElementById('z-value');
  
  function updatePosition() {
    const treeEntity = document.querySelector('a-entity[obj-model]');
    if (treeEntity) {
      const x = parseFloat(xSlider.value);
      const y = parseFloat(ySlider.value);
      const z = parseFloat(zSlider.value);
      treeEntity.setAttribute('position', `${x} ${y} ${z}`);
    }
  }
  
  if (xSlider && ySlider && zSlider && xValue && yValue && zValue) {
    // Initialize the sliders to match the initial position of the tree
    const treeEntity = document.querySelector('a-entity[obj-model]');
    if (treeEntity) {
      const position = treeEntity.getAttribute('position');
      xSlider.value = position.x;
      ySlider.value = position.y;
      zSlider.value = position.z;
      xValue.textContent = position.x.toFixed(2);
      yValue.textContent = position.y.toFixed(2);
      zValue.textContent = position.z.toFixed(2);
    }
    
    xSlider.addEventListener('input', function() {
      const x = parseFloat(this.value);
      xValue.textContent = x.toFixed(2);
      updatePosition();
    });
    
    ySlider.addEventListener('input', function() {
      const y = parseFloat(this.value);
      yValue.textContent = y.toFixed(2);
      updatePosition();
    });
    
    zSlider.addEventListener('input', function() {
      const z = parseFloat(this.value);
      zValue.textContent = z.toFixed(2);
      updatePosition();
    });
  }

  // Model configuration system
  // -------------------------  
  
  // Store configurations for different models
  const modelConfigurations = {
    tree1: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.5, z: 0.5 }
    }
    // Additional models can be added here later
  };
  
  let currentModel = 'tree1';
  
  // Tab navigation for model controls
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked button and corresponding tab
      button.classList.add('active');
      const tabName = button.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Initialize the model dropdown
  const modelSelect = document.getElementById('model-select');
  if (modelSelect) {
    modelSelect.addEventListener('change', function() {
      currentModel = this.value;
      loadModelConfiguration(currentModel);
    });
  }
  
  // Initialize position controls
  const positionXSlider = document.getElementById('position-x-slider');
  const positionYSlider = document.getElementById('position-y-slider');
  const positionZSlider = document.getElementById('position-z-slider');
  const positionXInput = document.getElementById('position-x-input');
  const positionYInput = document.getElementById('position-y-input');
  const positionZInput = document.getElementById('position-z-input');

  // Initialize rotation controls
  const rotationXSlider = document.getElementById('rotation-x-slider');
  const rotationYSlider = document.getElementById('rotation-y-slider');
  const rotationZSlider = document.getElementById('rotation-z-slider');
  const rotationXInput = document.getElementById('rotation-x-input');
  const rotationYInput = document.getElementById('rotation-y-input');
  const rotationZInput = document.getElementById('rotation-z-input');

  // Initialize scale controls
  const scaleUniformSlider = document.getElementById('scale-uniform-slider');
  const scaleUniformInput = document.getElementById('scale-uniform-input');
  const scaleXSlider = document.getElementById('scale-x-slider');
  const scaleYSlider = document.getElementById('scale-y-slider');
  const scaleZSlider = document.getElementById('scale-z-slider');
  const scaleXInput = document.getElementById('scale-x-input');
  const scaleYInput = document.getElementById('scale-y-input');
  const scaleZInput = document.getElementById('scale-z-input');
  
  // Configuration display and save button
  const configDisplay = document.getElementById('config-display');
  const saveConfigBtn = document.getElementById('save-config-btn');

  // Function to update the model with current configuration
  function updateModelConfiguration() {
    const modelEntity = document.querySelector('#tree-model');
    if (!modelEntity) return;
    
    const config = modelConfigurations[currentModel];
    
    // Apply position
    modelEntity.setAttribute('position', `${config.position.x} ${config.position.y} ${config.position.z}`);
    
    // Apply rotation (convert degrees to radians if needed)
    modelEntity.setAttribute('rotation', `${config.rotation.x} ${config.rotation.y} ${config.rotation.z}`);
    
    // Apply scale
    modelEntity.setAttribute('scale', `${config.scale.x} ${config.scale.y} ${config.scale.z}`);
    
    // Update the display
    updateConfigurationDisplay();
  }
  
  // Function to update the configuration display
  function updateConfigurationDisplay() {
    const config = modelConfigurations[currentModel];
    configDisplay.textContent = `Position: [${config.position.x.toFixed(2)}, ${config.position.y.toFixed(2)}, ${config.position.z.toFixed(2)}] | ` +
                                `Rotation: [${config.rotation.x.toFixed(0)}°, ${config.rotation.y.toFixed(0)}°, ${config.rotation.z.toFixed(0)}°] | ` +
                                `Scale: [${config.scale.x.toFixed(2)}, ${config.scale.y.toFixed(2)}, ${config.scale.z.toFixed(2)}]`;
  }
  
  // Function to load model configuration into controls
  function loadModelConfiguration(modelId) {
    const config = modelConfigurations[modelId];
    if (!config) return;
    
    // Update position controls
    positionXSlider.value = config.position.x;
    positionYSlider.value = config.position.y;
    positionZSlider.value = config.position.z;
    positionXInput.value = config.position.x;
    positionYInput.value = config.position.y;
    positionZInput.value = config.position.z;
    
    // Update rotation controls
    rotationXSlider.value = config.rotation.x;
    rotationYSlider.value = config.rotation.y;
    rotationZSlider.value = config.rotation.z;
    rotationXInput.value = config.rotation.x;
    rotationYInput.value = config.rotation.y;
    rotationZInput.value = config.rotation.z;
    
    // Update scale controls
    scaleXSlider.value = config.scale.x;
    scaleYSlider.value = config.scale.y;
    scaleZSlider.value = config.scale.z;
    scaleXInput.value = config.scale.x;
    scaleYInput.value = config.scale.y;
    scaleZInput.value = config.scale.z;
    scaleUniformSlider.value = config.scale.x; // Using X as the reference for uniform
    scaleUniformInput.value = config.scale.x;
    
    // Apply configuration to model
    updateModelConfiguration();
  }
  
  // Function to sync sliders and number inputs
  function setupSliderInputSync(slider, input, property, subProperty) {
    if (!slider || !input) return;
    
    slider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      input.value = value;
      modelConfigurations[currentModel][property][subProperty] = value;
      updateModelConfiguration();
    });
    
    input.addEventListener('input', function() {
      const value = parseFloat(this.value);
      slider.value = value;
      modelConfigurations[currentModel][property][subProperty] = value;
      updateModelConfiguration();
    });
  }
  
  // Setup position controls
  setupSliderInputSync(positionXSlider, positionXInput, 'position', 'x');
  setupSliderInputSync(positionYSlider, positionYInput, 'position', 'y');
  setupSliderInputSync(positionZSlider, positionZInput, 'position', 'z');
  
  // Setup rotation controls
  setupSliderInputSync(rotationXSlider, rotationXInput, 'rotation', 'x');
  setupSliderInputSync(rotationYSlider, rotationYInput, 'rotation', 'y');
  setupSliderInputSync(rotationZSlider, rotationZInput, 'rotation', 'z');
  
  // Setup scale controls
  setupSliderInputSync(scaleXSlider, scaleXInput, 'scale', 'x');
  setupSliderInputSync(scaleYSlider, scaleYInput, 'scale', 'y');
  setupSliderInputSync(scaleZSlider, scaleZInput, 'scale', 'z');
  
  // Setup uniform scale control
  if (scaleUniformSlider && scaleUniformInput) {
    scaleUniformSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      scaleUniformInput.value = value;
      
      // Apply uniform scale to all three dimensions
      modelConfigurations[currentModel].scale.x = value;
      modelConfigurations[currentModel].scale.y = value;
      modelConfigurations[currentModel].scale.z = value;
      
      // Update individual scale controls
      scaleXSlider.value = value;
      scaleYSlider.value = value;
      scaleZSlider.value = value;
      scaleXInput.value = value;
      scaleYInput.value = value;
      scaleZInput.value = value;
      
      updateModelConfiguration();
    });
    
    scaleUniformInput.addEventListener('input', function() {
      const value = parseFloat(this.value);
      scaleUniformSlider.value = value;
      
      // Apply uniform scale to all three dimensions
      modelConfigurations[currentModel].scale.x = value;
      modelConfigurations[currentModel].scale.y = value;
      modelConfigurations[currentModel].scale.z = value;
      
      // Update individual scale controls
      scaleXSlider.value = value;
      scaleYSlider.value = value;
      scaleZSlider.value = value;
      scaleXInput.value = value;
      scaleYInput.value = value;
      scaleZInput.value = value;
      
      updateModelConfiguration();
    });
  }
  
  // Setup save configuration button
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', function() {
      const configStr = JSON.stringify(modelConfigurations[currentModel]);
      
      // Output the configuration to console for copying
      console.log(`Model Configuration for ${currentModel}:`);
      console.log(configStr);
      
      // Create temporary element for copying to clipboard
      const tempElement = document.createElement('textarea');
      tempElement.value = configStr;
      document.body.appendChild(tempElement);
      tempElement.select();
      document.execCommand('copy');
      document.body.removeChild(tempElement);
      
      // Show feedback to user
      const originalText = this.textContent;
      this.textContent = 'Configuration Copied!';
      setTimeout(() => {
        this.textContent = originalText;
      }, 2000);
    });
  }
  
  // Initialize the controls with the current model configuration
  loadModelConfiguration(currentModel);
});