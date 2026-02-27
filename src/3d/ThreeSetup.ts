/**
 * ThreeSetup.ts
 * Core Three.js scene management for RaceGraph Studio.
 * Handles scene initialization, camera, lights, and rendering loop.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ThreeSceneConfig {
  container: HTMLElement;
  antialias?: boolean;
  shadows?: boolean;
  pixelRatio?: number;
  theme?: 'light' | 'dark';
}

export class ThreeSetup {
  public scene: any;
  public camera: any;
  public renderer: any;
  public controls: any;
  public container: HTMLElement;
  private grid: THREE.GridHelper | null = null;
  private frameId: number | null = null;
  private isDisposed: boolean = false;

  constructor(config: ThreeSceneConfig) {
    this.container = config.container;
    this.init(config);
  }

  private init(config: ThreeSceneConfig) {
    // 1. Scene
    this.scene = new THREE.Scene();
    const bgColor = config.theme === 'dark' ? 0x0b0b12 : 0xf8f9fa;
    this.scene.background = new THREE.Color(bgColor);
    
    if (config.theme === 'dark') {
      this.scene.fog = new THREE.FogExp2(bgColor, 0.0015);
    }
    
    // 2. Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000);
    this.camera.position.set(200, 200, 200);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.antialias !== undefined ? config.antialias : true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(config.pixelRatio || window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    if (config.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.screenSpacePanning = false;
      this.controls.minDistance = 10;
      this.controls.maxDistance = 1000;
      this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below ground

    // 5. Lights
    this.setupLights(config.theme);

    // 6. Grid
    this.setupGrid(config.theme);

    // 7. Resize handling
    window.addEventListener('resize', this.onResize);
  }

  private setupLights(theme?: 'light' | 'dark') {
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 0.4 : 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, theme === 'dark' ? 0.4 : 0.7);
    this.scene.add(hemiLight);
  }

  private setupGrid(theme?: 'light' | 'dark') {
    const size = 2000;
    const divisions = 100;
    const colorCenterLine = theme === 'dark' ? 0x444455 : 0xcccccc;
    const colorGrid = theme === 'dark' ? 0x222233 : 0xeeeeee;
    
    this.grid = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    this.grid.position.y = -0.1;
    this.scene.add(this.grid);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public updateTheme(theme: 'light' | 'dark') {
    const bgColor = theme === 'dark' ? 0x0b0b12 : 0xf8f9fa;
    this.scene.background = new THREE.Color(bgColor);
    
    if (theme === 'dark') {
      this.scene.fog = new THREE.FogExp2(bgColor, 0.0015);
    } else {
      this.scene.fog = null;
    }

    // Update Lights
    this.scene.traverse((obj: any) => {
      if (obj.isAmbientLight) {
        obj.intensity = theme === 'dark' ? 0.4 : 0.6;
      }
      if (obj.isHemisphereLight) {
        obj.intensity = theme === 'dark' ? 0.4 : 0.7;
      }
    });

    // Update Grid
    if (this.grid) {
      this.scene.remove(this.grid);
      if (this.grid.geometry) this.grid.geometry.dispose();
      if (this.grid.material instanceof THREE.Material) this.grid.material.dispose();
    }
    this.setupGrid(theme);
  }

  public startAnimation() {
    const animate = () => {
      if (this.isDisposed) return;
      this.frameId = requestAnimationFrame(animate);
      
      if (this.controls) {
        this.controls.update();
      }
      
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  /**
   * Adjusts the camera to fit all objects in the scene.
   */
  public fitCameraToScene(offset: number = 1.2) {
    const box = new THREE.Box3();
    
    // Calculate bounding box of all visible objects in the scene
    this.scene.traverse((obj: any) => {
      if (obj.isMesh || obj.isSprite) {
        if (obj.visible) {
          box.expandByObject(obj);
        }
      }
    });

    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return; // Avoid division by zero
    
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraDistance *= offset;

    // Maintain the current direction but adjust distance
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, center)
      .normalize();
    
    this.camera.position.copy(direction.multiplyScalar(cameraDistance).add(center));
    
    this.camera.near = maxDim / 100;
    this.camera.far = cameraDistance * 10;
    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
  }

  public stopAnimation() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  public dispose() {
    this.isDisposed = true;
    this.stopAnimation();
    window.removeEventListener('resize', this.onResize);
    
    if (this.controls) this.controls.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    // Clear scene
    this.scene.traverse((object: any) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (object.material.isMaterial) {
        this.cleanMaterial(object.material);
      } else {
        for (const material of object.material) {
          this.cleanMaterial(material);
        }
      }
    });
  }

  private cleanMaterial(material: any) {
    material.dispose();
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && typeof value.dispose === 'function') {
        value.dispose();
      }
    }
  }
}
