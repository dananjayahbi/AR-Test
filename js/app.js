// Hide loader when scene is loaded
document.addEventListener('DOMContentLoaded', function() {
  const scene = document.querySelector("a-scene");
  scene.addEventListener("loaded", function () {
    const loader = document.querySelector(".arjs-loader");
    if (loader) {
      loader.style.display = "none";
    }
    console.log("AR.js scene loaded");
  });

  // Toggle controls panel functionality
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
    toggleBtn.textContent = 'Hide Controls';
  }

  // Log when marker is found/lost for debugging
  const marker = document.querySelector("a-marker");
  marker.addEventListener("markerFound", function () {
    console.log("Marker found!");
  });
  marker.addEventListener("markerLost", function () {
    console.log("Marker lost!");
  });
  
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
});