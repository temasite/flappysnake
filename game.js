class DinoSnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        this.snake = [{x: 50, y: this.canvas.height - 50}];
        this.direction = 'left';
        this.food = this.generateFood();
        this.obstacles = [];
        this.score = 0;
        this.level = 1;
        this.baseGameSpeed = 3; // Reduced from 5
        this.gameSpeed = this.baseGameSpeed;
        this.isGameOver = false;
        this.gravity = 0.5;
        this.velocity = 0;
        this.jumpPower = -8;
        
        // Visual effects
        this.particles = [];
        this.clouds = this.generateClouds();
        
        this.setupEventListeners();
        this.gameLoop();
        
        // Handle window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        // Make canvas responsive based on device width
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40; // Account for padding
        
        // Set canvas size based on device width
        if (window.innerWidth < 768) {
            // Mobile: narrower aspect ratio
            this.canvas.width = containerWidth;
            this.canvas.height = containerWidth * 0.6; // 3:5 aspect ratio for mobile
        } else {
            // Desktop: wider aspect ratio
            this.canvas.width = Math.min(800, containerWidth);
            this.canvas.height = Math.min(400, this.canvas.width * 0.5); // 2:1 aspect ratio for desktop
        }
        
        // Adjust snake position if game is in progress
        if (this.snake && this.snake.length > 0) {
            this.snake[0].y = this.canvas.height - 50;
        }
        
        // Regenerate clouds when canvas size changes
        this.clouds = this.generateClouds();
    }
    
    generateClouds() {
        const clouds = [];
        const numClouds = Math.floor(this.canvas.width / 200) + 2;
        
        for (let i = 0; i < numClouds; i++) {
            clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height / 2),
                width: 60 + Math.random() * 40,
                height: 30 + Math.random() * 20,
                speed: 0.2 + Math.random() * 0.3
            });
        }
        
        return clouds;
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.jump();
            }
            if (e.code === 'ArrowLeft' && this.direction !== 'right') {
                this.direction = 'left';
            }
            if (e.code === 'ArrowRight' && this.direction !== 'left') {
                this.direction = 'right';
            }
        });
        
        // Mobile controls
        document.getElementById('leftButton').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.direction !== 'right') {
                this.direction = 'left';
            }
        });
        
        document.getElementById('rightButton').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.direction !== 'left') {
                this.direction = 'right';
            }
        });
        
        document.getElementById('jumpButton').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        
        // Restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
    }
    
    jump() {
        // Flappy Bird style jump - always apply upward force when space is pressed
        this.velocity = this.jumpPower;
        
        // Add jump particles
        this.createParticles(this.snake[0].x + 10, this.snake[0].y + 20, 5);
    }
    
    createParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: 2 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                life: 20 + Math.random() * 10,
                color: `hsl(${Math.random() * 60 + 100}, 70%, 50%)`
            });
        }
    }
    
    generateFood() {
        // Allow food to spawn anywhere on the screen
        return {
            x: Math.random() * (this.canvas.width - 20),
            y: Math.random() * (this.canvas.height - 20),
            type: Math.random() < 0.2 ? 'special' : 'normal' // 20% chance of special food
        };
    }
    
    generateObstacle() {
        // Generate obstacles at random heights throughout the entire game area
        const height = Math.random() * (this.canvas.height - 50);
        
        return {
            x: this.canvas.width,
            y: height,
            width: 20,
            height: 30,
            type: Math.random() < 0.3 ? 'spike' : 'block' // 30% chance of spike
        };
    }
    
    update() {
        if (this.isGameOver) return;
        
        // Update snake position
        const head = {...this.snake[0]};
        
        // Apply gravity
        this.velocity += this.gravity;
        head.y += this.velocity;
        
        // Ceiling collision
        if (head.y < 0) {
            head.y = 0;
            this.velocity = 0;
        }
        
        // Ground collision
        if (head.y > this.canvas.height - 20) {
            head.y = this.canvas.height - 20;
            this.velocity = 0;
        }
        
        // Move horizontally
        if (this.direction === 'right') {
            head.x += this.gameSpeed;
        } else {
            head.x -= this.gameSpeed;
        }
        
        // Wrap around screen
        if (head.x > this.canvas.width) {
            head.x = 0;
        } else if (head.x < 0) {
            head.x = this.canvas.width;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (this.checkCollision(head, this.food)) {
            this.score += this.food.type === 'special' ? 20 : 10;
            document.getElementById('score').textContent = this.score;
            this.createParticles(this.food.x + 10, this.food.y + 10, 10);
            this.food = this.generateFood();
            
            // Check for level up
            this.checkLevelUp();
        } else {
            this.snake.pop();
        }
        
        // Generate and update obstacles - drastically reduced frequency
        if (Math.random() < 0.005) { // Reduced from 0.015 to 0.005 (about 3x fewer obstacles)
            this.obstacles.push(this.generateObstacle());
        }
        
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= this.gameSpeed;
            return obstacle.x > -obstacle.width;
        });
        
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(head, obstacle)) {
                this.gameOver();
                return;
            }
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.life--;
            return particle.life > 0;
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * (this.canvas.height / 2);
            }
        });
    }
    
    checkCollision(head, object) {
        return head.x < object.x + (object.width || 20) &&
               head.x + 20 > object.x &&
               head.y < object.y + (object.height || 20) &&
               head.y + 20 > object.y;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw clouds
        this.drawClouds();
        
        // Draw ground
        this.drawGround();
        
        // Draw snake
        this.drawSnake();
        
        // Draw food
        this.drawFood();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw particles
        this.drawParticles();
        
        // Draw level indicator
        this.drawLevelIndicator();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawGround() {
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 10, this.canvas.width, 10);
        
        // Grass
        this.ctx.fillStyle = '#7CFC00';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 10);
    }
    
    drawSnake() {
        // Draw snake body
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#2E8B57';
                this.ctx.fillRect(segment.x, segment.y, 20, 20);
                
                // Eyes
                this.ctx.fillStyle = 'white';
                if (this.direction === 'right') {
                    this.ctx.fillRect(segment.x + 12, segment.y + 5, 4, 4);
                    this.ctx.fillRect(segment.x + 12, segment.y + 12, 4, 4);
                } else {
                    this.ctx.fillRect(segment.x + 4, segment.y + 5, 4, 4);
                    this.ctx.fillRect(segment.x + 4, segment.y + 12, 4, 4);
                }
                
                this.ctx.fillStyle = 'black';
                if (this.direction === 'right') {
                    this.ctx.fillRect(segment.x + 14, segment.y + 7, 2, 2);
                    this.ctx.fillRect(segment.x + 14, segment.y + 14, 2, 2);
                } else {
                    this.ctx.fillRect(segment.x + 6, segment.y + 7, 2, 2);
                    this.ctx.fillRect(segment.x + 6, segment.y + 14, 2, 2);
                }
            } else {
                // Body
                const hue = 120 + (index * 2) % 40;
                this.ctx.fillStyle = `hsl(${hue}, 70%, 40%)`;
                this.ctx.fillRect(segment.x, segment.y, 20, 20);
                
                // Pattern
                this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                this.ctx.fillRect(segment.x + 5, segment.y + 5, 10, 10);
            }
        });
    }
    
    drawFood() {
        if (this.food.type === 'special') {
            // Special food (star)
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            const centerX = this.food.x + 10;
            const centerY = this.food.y + 10;
            const spikes = 5;
            const outerRadius = 10;
            const innerRadius = 5;
            
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * i;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Normal food (apple)
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(this.food.x + 10, this.food.y + 10, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Stem
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(this.food.x + 9, this.food.y, 2, 5);
        }
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'spike') {
                // Spike obstacle
                this.ctx.fillStyle = '#A52A2A';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Block obstacle
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Pattern
                this.ctx.fillStyle = '#555';
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 10, 5);
                this.ctx.fillRect(obstacle.x + 5, obstacle.y + 20, 10, 5);
            }
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawLevelIndicator() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 100, 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level: ${this.level}`, 60, 30);
    }
    
    checkLevelUp() {
        // Level up every 50 points
        const newLevel = Math.floor(this.score / 50) + 1;
        
        if (newLevel > this.level) {
            this.level = newLevel;
            this.gameSpeed = this.baseGameSpeed + (this.level - 1) * 0.5;
            
            // Show level up message
            this.showLevelUpMessage();
        }
    }
    
    showLevelUpMessage() {
        // Create level up message
        const levelUpMsg = document.createElement('div');
        levelUpMsg.className = 'level-up-message';
        levelUpMsg.textContent = `Level ${this.level}!`;
        document.querySelector('.game-container').appendChild(levelUpMsg);
        
        // Remove after animation
        setTimeout(() => {
            levelUpMsg.remove();
        }, 2000);
    }
    
    gameOver() {
        this.isGameOver = true;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
    
    restart() {
        this.snake = [{x: 50, y: this.canvas.height - 50}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.obstacles = [];
        this.score = 0;
        this.level = 1;
        this.gameSpeed = this.baseGameSpeed;
        this.velocity = 0;
        this.isGameOver = false;
        this.particles = [];
        document.getElementById('score').textContent = '0';
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Prevent double-tap zoom on mobile
document.addEventListener('dblclick', (event) => {
    event.preventDefault();
});

// Start the game when the page loads
window.onload = () => {
    new DinoSnake();
}; 