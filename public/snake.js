class SnakeGame extends Phaser.Scene {
    constructor() {
      super({ key: 'SnakeGame' });
    }
  
    preload() {
      // Create a neon food texture (a neon pink circle)
      let foodGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      foodGraphics.fillStyle(0xff00ff, 1); // neon pink
      foodGraphics.fillCircle(20, 20, 20);
      foodGraphics.generateTexture('food', 40, 40);
    }
  
    create() {
      // --- RESET GAME STATE ---
      this.isGameOver = false;
      this.score = 0;
      this.snake = [{ x: 10, y: 10 }]; // Starting position for snake
      this.direction = 'RIGHT';
      this.newDirection = 'RIGHT';
      this.unitSize = 20;
  
      // Destroy previous graphics or text if they exist
      if (this.graphics) {
        this.graphics.destroy();
      }
      this.graphics = this.add.graphics();
  
      if (this.scoreText) {
        this.scoreText.destroy();
      }
      this.scoreText = this.add.text(10, 10, 'Score: 0', { font: '20px Arial', fill: '#fff' });
  
      // Remove any previous keyboard listeners to prevent duplicates
      this.input.keyboard.removeAllListeners();
  
      // --- SETUP THE GAME SCENE ---
      // Set background color
      this.cameras.main.setBackgroundColor('#000');
  
      // Draw neon grid for extra visual flair
      this.drawNeonGrid();
  
      // Spawn the initial food
      this.spawnFood();
  
      // Listen for keyboard events to control snake movement
      this.input.keyboard.on('keydown', (event) => {
        if (this.isGameOver) return;
        switch (event.key) {
          case 'ArrowUp':
            if (this.direction !== 'DOWN') this.newDirection = 'UP';
            break;
          case 'ArrowDown':
            if (this.direction !== 'UP') this.newDirection = 'DOWN';
            break;
          case 'ArrowLeft':
            if (this.direction !== 'RIGHT') this.newDirection = 'LEFT';
            break;
          case 'ArrowRight':
            if (this.direction !== 'LEFT') this.newDirection = 'RIGHT';
            break;
        }
      });
  
      // Create a timer event for snake movement
      if (this.timer) {
        this.timer.remove();
      }
      this.timer = this.time.addEvent({
        delay: 100,
        callback: this.moveSnake,
        callbackScope: this,
        loop: true
      });
    }
  
    drawNeonGrid() {
      let gridGraphics = this.add.graphics();
      gridGraphics.lineStyle(1, 0x00ffff, 0.2); // neon cyan, low opacity
      let cols = Math.floor(this.sys.game.config.width / this.unitSize);
      let rows = Math.floor(this.sys.game.config.height / this.unitSize);
      for (let i = 0; i <= cols; i++) {
        gridGraphics.moveTo(i * this.unitSize, 0);
        gridGraphics.lineTo(i * this.unitSize, this.sys.game.config.height);
      }
      for (let j = 0; j <= rows; j++) {
        gridGraphics.moveTo(0, j * this.unitSize);
        gridGraphics.lineTo(this.sys.game.config.width, j * this.unitSize);
      }
      gridGraphics.strokePath();
    }
  
    spawnFood() {
      const cols = Math.floor(this.sys.game.config.width / this.unitSize);
      const rows = Math.floor(this.sys.game.config.height / this.unitSize);
      let foodX, foodY;
      do {
        foodX = Phaser.Math.Between(0, cols - 1);
        foodY = Phaser.Math.Between(0, rows - 1);
      } while (this.snake.some(segment => segment.x === foodX && segment.y === foodY));
  
      this.foodGrid = { x: foodX, y: foodY };
      const foodPixelX = foodX * this.unitSize + this.unitSize / 2;
      const foodPixelY = foodY * this.unitSize + this.unitSize / 2;
  
      // Remove existing food sprites if they exist
      if (this.foodSprite) this.foodSprite.destroy();
      if (this.foodGlow) this.foodGlow.destroy();
  
      // Add main food sprite
      this.foodSprite = this.add.image(foodPixelX, foodPixelY, 'food');
      this.foodSprite.setBlendMode(Phaser.BlendModes.ADD);
  
      // Add a duplicate "glow" sprite behind the food
      this.foodGlow = this.add.image(foodPixelX, foodPixelY, 'food');
      this.foodGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.foodGlow.setScale(1.5);
      this.foodGlow.setAlpha(0.5);
  
      // Apply a pulsating tween to both food sprites
      this.tweens.add({
        targets: [this.foodSprite, this.foodGlow],
        scale: { from: 0.8, to: 1.2 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
  
    moveSnake() {
      // Calculate new head position based on current direction
      const head = { ...this.snake[0] };
      switch (this.newDirection) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }
  
      // Wrap snake around screen edges
      head.x = Phaser.Math.Wrap(head.x, 0, Math.floor(this.sys.game.config.width / this.unitSize));
      head.y = Phaser.Math.Wrap(head.y, 0, Math.floor(this.sys.game.config.height / this.unitSize));
  
      // Check for self-collision
      if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        this.gameOver();
        return;
      }
  
      // Add new head to the snake
      this.snake.unshift(head);
  
      // Check if snake eats the food
      if (head.x === this.foodGrid.x && head.y === this.foodGrid.y) {
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.spawnFood();
      } else {
        // Remove tail segment if food not eaten
        this.snake.pop();
      }
    }
  
    drawGame() {
      // Clear the graphics object
      this.graphics.clear();
  
      // Define neon gradient colors for the snake (neon green to neon cyan)
      const neonStart = new Phaser.Display.Color(57, 255, 20); // neon green
      const neonEnd = new Phaser.Display.Color(0, 255, 255);    // neon cyan
  
      // Draw each snake segment with glow effect
      for (let i = 0; i < this.snake.length; i++) {
        const segment = this.snake[i];
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(neonStart, neonEnd, this.snake.length, i);
        const hex = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        const x = segment.x * this.unitSize;
        const y = segment.y * this.unitSize;
  
        // Draw a larger, semi-transparent rectangle for the glow effect
        this.graphics.fillStyle(hex, 0.3);
        this.graphics.fillRect(x - 2, y - 2, this.unitSize + 4, this.unitSize + 4);
  
        // Draw the main snake segment
        this.graphics.fillStyle(hex, 1);
        this.graphics.fillRect(x, y, this.unitSize - 1, this.unitSize - 1);
      }
    }
  
    gameOver() {
      this.isGameOver = true;
      // Stop the snake movement timer
      this.timer.remove();
  
      // Display a neon-style "GAME OVER" message
      this.add.text(
        this.sys.game.config.width / 2,
        this.sys.game.config.height / 2,
        'GAME OVER',
        { font: '40px Arial', fill: '#ff00ff', stroke: '#00ffff', strokeThickness: 4 }
      ).setOrigin(0.5);
  
      // Automatically restart the game after 2 seconds
      this.time.delayedCall(2000, () => this.scene.restart());
    }
  
    update() {
      if (!this.isGameOver) {
        // Update the snake's direction and redraw it on each frame
        this.direction = this.newDirection;
        this.drawGame();
      }
    }
  }
  
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000',
    scene: SnakeGame
  };
  
  const game = new Phaser.Game(config);
  