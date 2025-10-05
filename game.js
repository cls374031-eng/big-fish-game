// 游戏的配置对象
const config = {
    type: Phaser.AUTO, // 自动选择 WebGL 或 Canvas 渲染
    width: 800,
    height: 600,
    // 启用物理引擎，这是碰撞检测的关键！
    physics: {
        default: 'arcade', // Arcade 物理系统简单高效，非常适合此类小游戏
        arcade: {
            // debug: true // 开启调试模式可以看到碰撞框
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 创建一个新的 Phaser 游戏实例
const game = new Phaser.Game(config);

let player; // 玩家鱼
let smallFishGroup; // 小鱼（敌人）的组
let score = 0;
let scoreText;

// 新增：用于存储玩家触摸/点击的目标位置
let targetX = 100; // 初始为玩家鱼的起始X坐标
let targetY = 300; // 初始为玩家鱼的起始Y坐标 
const MAX_SPEED = 200; // 鱼的最大移动速度

// --- 游戏的三个生命周期函数 ---

// 2. 预加载资源（图片、声音等）
function preload ()
{
    // 假设你已经有两张图片：'player.png' 和 'small_fish.png'
    // 暂时用 Phaser 内置的图形代替，或自己准备图片并在这里加载
    this.load.image('player', 'assets/player.png'); // 实际中你需要准备这张图
    this.load.image('smallFish', 'assets/small_fish.png'); // 实际中你需要准备这张图
}

// 3. 创建游戏对象
function create ()
{
    // --- 玩家鱼 (大鱼) ---
    // 在 (100, 300) 位置创建玩家，并启用物理特性
    player = this.physics.add.image(100, 300, 'player');
    player.setCollideWorldBounds(true); // 不允许移出屏幕边界
    player.setOrigin(0.5); // 设置中心点
    player.setScale(0.5); // 初始大小

    // --- 小鱼组 (敌人) ---
    smallFishGroup = this.physics.add.group();
    
    // 每隔一段时间生成一只小鱼
    this.time.addEvent({
        delay: 1500, // 1.5秒生成一只
        callback: spawnSmallFish,
        callbackScope: this,
        loop: true
    });
    
    // --- 碰撞检测（核心） ---
    // 检查玩家鱼和任何小鱼是否发生重叠，如果重叠则调用 collectFish 函数
    this.physics.add.overlap(player, smallFishGroup, collectFish, null, this);

    // --- 用户界面 ---
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        // 新增：监听玩家的输入事件
    this.input.on('pointerdown', function (pointer) {
        // 当屏幕被按下时，更新目标位置
        targetX = pointer.x;
        targetY = pointer.y;
    }, this);
    
    // 监听移动事件，以便在玩家按住屏幕滑动时持续更新目标位置
    this.input.on('pointermove', function (pointer) {
        // 只有当指针处于“按下”状态时，才更新目标位置
        if (pointer.isDown) {
            targetX = pointer.x;
            targetY = pointer.y;
        }
    }, this);

}

// 4. 持续更新（处理移动逻辑）
function update ()
{
    // --- 玩家鱼的移动控制（新逻辑） ---
    
    // 1. 计算玩家鱼当前位置到目标位置的距离
    // 如果距离很小（例如小于5像素），认为已经到达目标，停止移动。
    const distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

    if (distance > 5) 
    {
        // 2. 如果没有到达目标，则朝着目标点移动
        // 使用 moveToObject 方法让物理引擎控制鱼的移动
        this.physics.moveTo(player, targetX, targetY, MAX_SPEED);
        
        // 可选：让鱼头转向移动方向 (看起来更自然)
        // 计算鱼从当前位置到目标位置的角度（以弧度为单位）
        const angle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
        // 设置鱼的角度，注意：Phaser 的角度是逆时针，0度朝右。
        player.setRotation(angle);
        
        // 小技巧：如果图片朝向是错的，可以调整它的旋转，例如：
        // player.setRotation(angle + Math.PI); // 旋转180度
        
    } else {
        // 3. 已经到达目标点附近，停止移动
        player.setVelocity(0);
    }
    
    // --- 小鱼组的持续移动逻辑（保持不变）---
    smallFishGroup.children.iterate(function (fish) {
        if (fish.x < -50) {
            fish.disableBody(true, true); 
        }
    });
}
// 生成小鱼的函数
function spawnSmallFish() {
    // 随机生成小鱼的 Y 坐标
    const y = Phaser.Math.Between(50, 550); 
    // 从屏幕右侧生成
    const fish = smallFishGroup.create(850, y, 'smallFish');
    
    fish.setOrigin(0.5);
    fish.setBodySize(32, 32); // 设置碰撞体大小
    
    // 设置小鱼的尺寸和速度
    const fishSize = Phaser.Math.FloatBetween(0.2, player.scaleX * 0.9); // 小鱼必须比玩家小
    const fishSpeed = Phaser.Math.Between(-100, -250); // 向左移动

    fish.setScale(fishSize);
    fish.setVelocityX(fishSpeed);
}

// 碰撞发生时调用的函数
function collectFish (player, fish)
{
    // 1. 销毁被吃掉的小鱼
    fish.disableBody(true, true); // 禁用并隐藏/销毁小鱼

    // 2. 增加分数
    score += 10;
    scoreText.setText('Score: ' + score);

    // 3. 玩家鱼体型增大
    player.setScale(player.scaleX + 0.05);
}