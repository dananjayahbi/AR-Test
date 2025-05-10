// Custom component to override materials on a model
AFRAME.registerComponent('material-override', {
  schema: {
    barkTexture: {type: 'selector'},
    leavesTexture: {type: 'selector'},
    applyToNames: {type: 'array', default: []}
  },
  
  init: function() {
    // Wait for model to load
    this.el.addEventListener('model-loaded', this.applyTextures.bind(this));
    
    // Store reference to component for event handlers
    const component = this;
    
    // Setup event listeners for texture changes
    document.addEventListener('DOMContentLoaded', function() {
      const barkSelect = document.getElementById('bark-texture-select');
      const leavesSelect = document.getElementById('leaves-texture-select');
      
      if (barkSelect) {
        barkSelect.addEventListener('change', function() {
          const selector = this.value;
          const textureEl = document.querySelector(selector);
          if (textureEl) {
            component.data.barkTexture = textureEl;
            component.applyTextures();
          }
        });
      }
      
      if (leavesSelect) {
        leavesSelect.addEventListener('change', function() {
          const selector = this.value;
          const textureEl = document.querySelector(selector);
          if (textureEl) {
            component.data.leavesTexture = textureEl;
            component.applyTextures();
          }
        });
      }
    });
  },
  
  applyTextures: function(evt) {
    const model = this.el.getObject3D('mesh');
    const data = this.data;
    
    if (!model) { return; }
    
    console.log('Applying custom textures to model');
    
    model.traverse(function(node) {
      if (!node.isMesh) { return; }
      
      // Log material names for debugging
      if (node.material) {
        console.log('Found mesh with material:', node.material.name || 'unnamed');
      }
      
      // Hide any ground/platform meshes (any flat horizontal surfaces)
      if (node.name.toLowerCase().includes('ground') || 
          node.name.toLowerCase().includes('platform') || 
          node.name.toLowerCase().includes('base') ||
          node.name.toLowerCase().includes('plane')) {
        // Make the node invisible
        node.visible = false;
        return;
      }
      
      // Apply bark texture to trunk/branches
      if (node.name.toLowerCase().includes('trunk') || 
          node.name.toLowerCase().includes('branch') || 
          (node.material && node.material.name && 
           node.material.name.toLowerCase().includes('bark'))) {
        
        if (data.barkTexture) {
          console.log('Applying bark texture to', node.name);
          node.material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(data.barkTexture.src),
            transparent: true
          });
        }
      }
      
      // Apply leaf texture to leaves
      if (node.name.toLowerCase().includes('leaf') || 
          node.name.toLowerCase().includes('leaves') || 
          (node.material && node.material.name && 
           node.material.name.toLowerCase().includes('leaf'))) {
        
        if (data.leavesTexture) {
          console.log('Applying leaves texture to', node.name);
          node.material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(data.leavesTexture.src),
            transparent: true,
            side: THREE.DoubleSide
          });
        }
      }
      
      // Apply by specific name if provided
      if (data.applyToNames.length > 0) {
        data.applyToNames.forEach(function(item) {
          if (node.name.toLowerCase().includes(item.name.toLowerCase()) && item.texture) {
            console.log('Applying custom texture to', node.name);
            node.material = new THREE.MeshBasicMaterial({
              map: new THREE.TextureLoader().load(item.texture.src),
              transparent: item.transparent !== undefined ? item.transparent : true,
              side: item.doubleSided ? THREE.DoubleSide : THREE.FrontSide
            });
          }
        });
      }
    });
  }
});

// Model optimization component
AFRAME.registerComponent('model-optimizer', {
  schema: {
    maxPolygons: {type: 'number', default: 10000},
    simplifyModels: {type: 'boolean', default: true}
  },
  
  init: function() {
    this.el.addEventListener('model-loaded', this.optimizeModel.bind(this));
  },
  
  optimizeModel: function(evt) {
    if (!this.data.simplifyModels) return;
    
    const model = this.el.getObject3D('mesh');
    if (!model) return;
    
    console.log('Optimizing 3D model performance...');
    
    let totalPolygons = 0;
    
    // Count polygons and apply optimizations
    model.traverse((node) => {
      if (node.isMesh) {
        // Count current polygons
        if (node.geometry) {
          let polyCount = 0;
          if (node.geometry.index) {
            polyCount = node.geometry.index.count / 3;
          } else if (node.geometry.attributes.position) {
            polyCount = node.geometry.attributes.position.count / 3;
          }
          totalPolygons += polyCount;
          
          // Apply frustum culling for better performance
          node.frustumCulled = true;
          
          // Optimize materials
          if (node.material) {
            // Disable shadows if not needed
            node.castShadow = false;
            node.receiveShadow = false;
            
            // Use simpler materials when possible
            if (node.material.map) {
              // Keep textures but simplify other properties
              node.material.roughness = 1.0;
              node.material.metalness = 0.0;
            }
          }
        }
      }
    });
    
    console.log(`Model contains approximately ${totalPolygons} polygons`);
    
    // Warning if model is very complex
    if (totalPolygons > this.data.maxPolygons) {
      console.warn(`Model is highly detailed (${totalPolygons} polygons) and may cause performance issues.`);
    }
  }
});