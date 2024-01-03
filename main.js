class Stage {
  constructor() {
    this.container = document.getElementById('game');

    this.initRenderer();
    this.initCamera();

    this.container.appendChild(this.renderer.domElement);

    this.initScene();

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

class Block {
  STATES = {
    ACTIVE: 'active',
    STOPPED: 'stopped',
    MISSED: 'missed'
  };

  MOVE_AMOUNT = 12;

  dimension = {
    width: 0,
    height: 0,
    depth: 0
  };

  position = {
    x: 0,
    y: 0,
    z: 0
  };

  constructor(block) {
    this.targetBlock = block;

    this.init();
  }

  init = () => {
    this.index = this.targetBlock ? this.targetBlock.index + 1 : 1;
    this.workingPlane = this.index % 2 ? 'x' : 'z';
    this.workingDimension = this.index % 2 ? 'width' : 'depth';

    this.initDimension();
    this.initPosition();
    this.colorOffset = this.getColorOffset();
    this.color = this.getColor();
    this.state = this.getState();
    this.speed = this.getSpeed();
    this.direction = this.speed;

    this.material = new THREE.MeshToonMaterial({color: this.color});

    this.initMesh();

    if (this.state === this.STATES.ACTIVE) {
      this.position[this.workingPlane] = Math.random() > 0.5 ?
        -this.MOVE_AMOUNT :
        this.MOVE_AMOUNT;
    }
  };

  getState = () => {
    if (this.index > 1) {
      return this.STATES.ACTIVE;
    }

    return this.STATES.STOPPED;
  };

  getSpeed = () => {
    const speed = -0.1 - this.index * 0.005;

    if (speed < -4) {
      return -4;
    }

    return speed;
  };

  initDimension = () => {
    const width = this.targetBlock
      ? this.targetBlock.dimension.width
      : 10;

    const height = this.targetBlock
      ? this.targetBlock.dimension.height
      : 2;

    const depth = this.targetBlock
      ? this.targetBlock.dimension.depth
      : 10;

    this.dimension = {width, height, depth};
  };

  initPosition = () => {
    const x = this.targetBlock ?
      this.targetBlock.position.x :
      0;

    const y = this.dimension.height * this.index;

    const z = this.targetBlock ?
      this.targetBlock.position.z :
      0;

    this.position = {x, y, z};
  };

  getColorOffset = () => {
    if (this.targetBlock) {
      return this.targetBlock.colorOffset;
    }

    return Math.round(Math.random() * 100);
  };

  getColor = () => {
    if (!this.targetBlock) {
      return 0xa9acb7;
    }

    const offset = this.index + this.colorOffset;

    const red = Math.sin(0.3 * offset) * 95 + 170;
    const green = Math.sin(0.3 * offset + 2) * 95 + 170;
    const blue = Math.sin(0.3 * offset + 4) * 95 + 170;

    return new THREE.Color(red / 255, green / 255, blue / 255);
  };

  initMesh = () => {
    const geometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );

    const matrix = new THREE.Matrix4().makeTranslation(
      this.dimension.width / 2,
      this.dimension.height / 2,
      this.dimension.depth / 2
    );

    geometry.applyMatrix4(matrix);

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(
      this.position.x,
      this.position.y,
      this.position.z
    );
  };

  reverseDirection = () => {
    this.direction = this.direction > 0 ?
      this.speed :
      Math.abs(this.speed);
  };

  computeMesh = ({width, height, depth}) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const matrix = new THREE.Matrix4().makeTranslation(width / 2, height / 2, depth / 2);

    geometry.applyMatrix4(matrix);

    return new THREE.Mesh(geometry, this.material);
  };

  place = () => {
    this.state = this.STATES.STOPPED;

    let overlap = this.targetBlock.dimension[this.workingDimension] -
      Math.abs(this.position[this.workingPlane] - this.targetBlock.position[this.workingPlane]);

    const blocksToReturn = {
      plane: this.workingPlane,
      direction: this.direction
    };

    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      overlap = this.dimension[this.workingDimension];
      blocksToReturn.bonus = true;

      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;

      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }

    if (overlap > 0) {
      const choppedDimensions = {
        width: this.dimension.width,
        height: this.dimension.height,
        depth: this.dimension.depth
      };

      choppedDimensions[this.workingDimension] -= overlap;

      this.dimension[this.workingDimension] = overlap;

      const placedMesh = this.computeMesh(this.dimension);
      const choppedMesh = this.computeMesh(choppedDimensions);

      const choppedPosition = {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      };

      if (this.position[this.workingPlane] < this.targetBlock.position[this.workingPlane]) {
        this.position[this.workingPlane] = this.targetBlock.position[this.workingPlane];
      } else {
        choppedPosition[this.workingPlane] += overlap;
      }

      placedMesh.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );

      choppedMesh.position.set(
        choppedPosition.x,
        choppedPosition.y,
        choppedPosition.z
      );

      blocksToReturn.placed = placedMesh;

      if (!blocksToReturn.bonus) {
        blocksToReturn.chopped = choppedMesh;
      }
    } else {
      this.state = this.STATES.MISSED;
    }

    this.dimension[this.workingDimension] = overlap;

    return blocksToReturn;
  };

  tick = () => {
    if (this.state === this.STATES.ACTIVE) {
      const value = this.position[this.workingPlane];

      if (value > this.MOVE_AMOUNT || value < -this.MOVE_AMOUNT) {
        this.reverseDirection();
      }

      this.position[this.workingPlane] += this.direction;
      this.mesh.position[this.workingPlane] = this.position[this.workingPlane];
    }
  };
}

class Game {
  STATES = {
    LOADING: 'loading',
    PLAYING: 'playing',
    READY: 'ready',
    ENDED: 'ended',
    RESETTING: 'resetting'
  };

  blocks = [];
  state = this.STATES.LOADING;

  constructor() {
    this.stage = new Stage();

    this.mainContainer = document.getElementById('container');
    this.scoreContainer = document.getElementById('score');
    this.instructions = document.getElementById('instructions');
    this.scoreContainer.innerHTML = '0';

    this.newBlocks = new THREE.Group();
    this.placedBlocks = new THREE.Group();
    this.choppedBlocks = new THREE.Group();

    this.stage.add(this.newBlocks);
    this.stage.add(this.placedBlocks);
    this.stage.add(this.choppedBlocks);

    this.addBlock();
    this.tick();

    this.updateState(this.STATES.READY);

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.onAction();
      }
    });

    document.addEventListener('touchstart', (e) => {
      e.preventDefault();

      this.onAction();
    });
  }

  updateState = (newState) => {
    Object.values(this.STATES).forEach((state) => {
      this.mainContainer.classList.remove(state);
    });

    console.log(this.mainContainer.classList);

    this.mainContainer.classList.add(newState);
    this.state = newState;
  };

  onAction = () => {
    switch (this.state) {
      case this.STATES.READY:
        return this.startGame();
      case this.STATES.PLAYING:
        return this.placeBlock();
      case this.STATES.ENDED:
        return this.restartGame();
    }
  };

  startGame = () => {
    if (this.state !== this.STATES.PLAYING) {
      this.scoreContainer.innerHTML = '0';

      this.updateState(this.STATES.PLAYING);
      this.addBlock();
    }
  };

  restartGame = () => {
    this.updateState(this.STATES.RESETTING);

    const oldBlocks = this.placedBlocks.children;
    const oldBlocksLength = oldBlocks.length;
    const removeSpeed = 0.2;
    const delayAmount = 0.02;

    oldBlocks.forEach((_, i) => {
      const delay = (oldBlocksLength - i) * delayAmount;

      TweenLite.to(
        oldBlocks[i].scale,
        removeSpeed,
        {
          x: 0,
          y: 0,
          z: 0,
          delay,
          ease: Power1.easeIn,
          onComplete: () => this.placedBlocks.remove(oldBlocks[i])
        }
      );

      TweenLite.to(
        oldBlocks[i].rotation,
        removeSpeed,
        {
          y: 0.5,
          delay,
          ease: Power1.easeIn
        }
      );
    });

    const cameraMoveSpeed = removeSpeed * 2 + oldBlocksLength * delayAmount;

    this.stage.setCamera(2, cameraMoveSpeed);

    const countdown = {
      value: this.blocks.length - 1
    };

    TweenLite.to(
      countdown,
      cameraMoveSpeed,
      {
        value: 0,
        onUpdate: () => {
          this.scoreContainer.innerHTML = String(Math.round(countdown.value));
        }
      }
    );

    this.blocks = this.blocks.slice(0, 1);

    setTimeout(() => {
      this.startGame();
    }, cameraMoveSpeed * 1000);
  };

  placeBlock = () => {
    const currentBlock = this.blocks[this.blocks.length - 1];
    const newBlocks = currentBlock.place();

    this.newBlocks.remove(currentBlock.mesh);

    if (newBlocks.placed) {
      this.placedBlocks.add(newBlocks.placed);
    }

    if (newBlocks.chopped) {
      this.choppedBlocks.add(newBlocks.chopped);

      const positionParams = {
        y: '-=30',
        ease: Power1.easeIn,
        onComplete: () => this.choppedBlocks.remove(newBlocks.chopped)
      };

      const rotateRandomness = 10;
      const rotationParams = {
        delay: 0.05,
        x: newBlocks.plane === 'z'
          ? Math.random() * rotateRandomness - rotateRandomness / 2
          : 0.1,
        z: newBlocks.plane === 'x'
          ? Math.random() * rotateRandomness - rotateRandomness / 2
          : 0.1,
        y: Math.random() * 0.1
      };

      const newChoppedPosition = newBlocks.chopped.position[newBlocks.plane];
      const newPlacedPosition = newBlocks.chopped.position[newBlocks.plane];

      const op = newChoppedPosition > newPlacedPosition ?
        '+=' :
        '-=';

      positionParams[newBlocks.plane] = op + 40 * Math.abs(newBlocks.direction);

      TweenLite.to(newBlocks.chopped.position, 1, positionParams);
      TweenLite.to(newBlocks.chopped.rotation, 1, rotationParams);
    }

    this.addBlock();
  };

  addBlock = () => {
    const last = this.blocks.length - 1;
    const lastBlock = this.blocks[last];

    if (lastBlock && lastBlock.state === lastBlock.STATES.MISSED) {
      return this.endGame();
    }

    this.scoreContainer.innerHTML = String(last);

    const newKidOnTheBlock = new Block(lastBlock);

    this.newBlocks.add(newKidOnTheBlock.mesh);
    this.blocks.push(newKidOnTheBlock);

    this.stage.setCamera(this.blocks.length * 2);

    if (this.blocks.length >= 5) {
      this.instructions.classList.add('hide');
    }
  };

  endGame = () => {
    this.updateState(this.STATES.ENDED);
  };

  tick = () => {
    this.blocks[this.blocks.length - 1]?.tick();
    this.stage.render();

    requestAnimationFrame(() => {
      this.tick();
    });
  };
}

new Game();