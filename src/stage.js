import * as THREE from '../node_modules/three/src/Three.js';

export class Stage {
  constructor() {
    this.initRenderer();
    this.initCamera();
    this.initScene();

    this.container = document.getElementById('game');
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this.onResize());

    this.onResize();
  }

  initRenderer = () => {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor('#1e1f22', 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
  };

  initCamera = () => {
    const aspect = window.innerWidth / window.innerHeight;
    const d = 20;

    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, -100, 1000);
    this.camera.position.x = 2;
    this.camera.position.y = 2;
    this.camera.position.z = 2;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  };

  initScene = () => {
    this.light = new THREE.DirectionalLight(0xffffff, 0.9);
    this.light.position.set(0, 500, 0);
    this.light.castShadow = true;

    this.mainLight = new THREE.AmbientLight(0xffffff, 0.6);

    this.scene = new THREE.Scene();
    this.scene.add(this.light);
    this.scene.add(this.mainLight);
  };

  setCamera = (y, speed = 0.3) => {
    TweenLite.to(this.camera.position, speed, {y: y + 4, ease: Power1.easeInOut});
    TweenLite.to(this.camera.lookAt, speed, {y, ease: Power1.easeInOut});
  };

  onResize = () => {
    const viewSize = 30;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera.left = window.innerWidth / -viewSize;
    this.camera.right = window.innerWidth / viewSize;
    this.camera.top = window.innerHeight / viewSize;
    this.camera.bottom = window.innerHeight / -viewSize;

    this.camera.updateProjectionMatrix();
  };

  render = () => {
    this.renderer.render(this.scene, this.camera);
  };

  add = (elem) => {
    this.scene.add(elem);
  };

  remove = (elem) => {
    this.scene.remove(elem);
  };
}