import * as THREE from '../node_modules/three/src/Three.js';

export class Block {
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