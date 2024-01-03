import * as THREE from '../node_modules/three/src/Three.js';
import {Stage} from './stage.js';
import {Block} from './block.js';

export class Game {
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

    document.addEventListener('click', (e) => {
      this.onAction();
    });

    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
    });
  }

  updateState = (newState) => {
    Object.values(this.STATES).forEach((state) => {
      this.mainContainer.classList.remove(state);
    });

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