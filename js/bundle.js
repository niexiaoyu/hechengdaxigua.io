(function () {
    'use strict';

    /**
    *预制体上的碰撞检测
    * @ author:Anson
    * @ data: 2021-02-20 14:32
    */
    class Fruit extends Laya.Script {

        constructor() {
            super();
            //是否已经落下来了
            this.isFall = false;
            this.fruitID = -1;
        }
        Init(id) {
            this.fruitID = id;
        }
        onTriggerEnter(other, self) {
            this.isFall = true;
            if (other.owner.getComponent(Fruit) != null
                && other.owner.getComponent(Fruit).fruitID == this.fruitID
                && this.owner.visible && other.owner.visible) {

                var temp = this.owner.y > other.owner.y ? this.owner : other.owner;

                //回收当前的物体和旁边的物体
                this.owner.active = false;
                this.owner.visible = false;
                Laya.Pool.recover(this.fruitID.toString(), this.owner);
                other.owner.active = false;
                other.owner.visible = false;
                Laya.Pool.recover(this.fruitID.toString(), other.owner);

                //生成一个当前Id++的水果
                //派发一个事件码给GameManager

                Laya.stage.event("CreatFruit",
                    [this.fruitID + 1, temp.x, temp.y, "dynamic", 10,
                    temp.getComponent(Laya.RigidBody).angularVelocity]);
                //播放合成的音效
                Laya.SoundManager.playSound("res/sounds/bomb.wav", 1);
                Laya.stage.event("CreatBombEffect", [this.fruitID + 1, temp.x, temp.y]);
            }
        }
    }

    class GameManager extends Laya.Script {

        constructor() {
            super();

            /** @prop {name:scoreText, tips:"成绩显示文本", type:Node, default:null}*/
            this.scoreText = null;

            /** @prop {name:gameOverPanel, tips:"游戏结束界面", type:Node, default:null}*/
            this.gameOverPanel = null;

            // 更多参数说明请访问: https://ldc2.layabox.com/doc/?nav=zh-as-2-4-0
            //爆炸特效的预制体
            this.bombEffectPre = null;
            //所有水果预制体的路径信息
            this.fruitPreArr = new Array(11);
            //当前还没有落下的水果
            this.currentFruit = null;
            //鼠标是否按下
            this.isMouseDown = false;
            //游戏是否结束
            this.isGameOver = false;
            //当前的成绩
            this.score = 0;
            this.creatY = 0;
        }
        onAwake() {
            this.creatY = 120 + 120;
            this.targetLine.visible = false;
            this.warnLine.visible = false;
            var prefabInfoArr = [
                { url: "prefab/shanzhu.json", type: Laya.Loader.PREFAB },
                { url: "prefab/pingguo.json", type: Laya.Loader.PREFAB },
                { url: "prefab/chengzi.json", type: Laya.Loader.PREFAB },
                { url: "prefab/ningmeng.json", type: Laya.Loader.PREFAB },
                { url: "prefab/mihoutao.json", type: Laya.Loader.PREFAB },
                { url: "prefab/fanqie.json", type: Laya.Loader.PREFAB },
                { url: "prefab/shuimitao.json", type: Laya.Loader.PREFAB },
                { url: "prefab/boluo.json", type: Laya.Loader.PREFAB },
                { url: "prefab/yezi.json", type: Laya.Loader.PREFAB },
                { url: "prefab/xigua.json", type: Laya.Loader.PREFAB },
                { url: "prefab/daxigua.json", type: Laya.Loader.PREFAB }
            ];
            this.gameOverPanel.getChildAt(2).on(Laya.Event.CLICK, this, this.playAgainGame);
            Laya.stage.on("CreatFruit", this,
                function (fruitId, x, y, type, gravityScale, angularVelocity) {
                    var fruit = this.creatFruit(fruitId, x, y, type, gravityScale, angularVelocity);
                    fruit.getComponent(Fruit).isFall = true;
                });
            Laya.stage.on("GameOver", this, function () {
                //显示游戏结束界面
                this.isGameOver = true;
                console.log("GameOver");
                this.showGameOverPanel();
            });
            Laya.stage.on("CreatBombEffect", this, this.creatBombEffect);
            Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.mouseDown);
            Laya.stage.on(Laya.Event.MOUSE_UP, this, this.mouseUp);
            Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.mouseMove);

            //加载所有水果预制体
            Laya.loader.load(prefabInfoArr, Laya.Handler.create(this, function (result) {
                for (var i = 0; i < this.fruitPreArr.length; i++) {
                    this.fruitPreArr[i] = Laya.loader.getRes(prefabInfoArr[i].url);
                }
                this.playAgainGame();
                //this.currentFruit = this.randomCreatFruit(this.owner.width * 0.5, 120);
            }));

            //加载爆炸特效预制体
            Laya.loader.load("prefab/Effect.json", Laya.Handler.create(this, function (pre) {
                this.bombEffectPre = pre;
            }), null, Laya.Loader.PREFAB);


        }
        onEnable() {

        }
        mouseDown() {
            if (this.isGameOver) return;

            this.isMouseDown = true;
            if (this.currentFruit != null) {
                this.currentFruit.x = Laya.stage.mouseX;
                if (this.currentFruit.x < this.currentFruit.width * 0.5)
                    this.currentFruit.x = this.currentFruit.width * 0.5;
                if (this.currentFruit.x > (this.owner.width - (this.currentFruit.width * 0.5)))
                    this.currentFruit.x = this.owner.width - (this.currentFruit.width * 0.5);

                this.targetLine.x = this.currentFruit.x;
            }
        }
        mouseUp() {
            if (this.isGameOver) return;

            this.isMouseDown = false;
            if (this.currentFruit == null) return;
            this.targetLine.visible = false;
            //播放生成音效
            Laya.SoundManager.playSound("res/sounds/spawn.mp3", 1);
            var fruitRig = this.currentFruit.getComponent(Laya.RigidBody);
            fruitRig.gravityScale = 10;
            fruitRig.type = "dynamic";
            this.currentFruit = null;
            Laya.timer.once(500, this, function () {
                this.currentFruit = this.randomCreatFruit(this.owner.width * 0.5, this.creatY);
            });
        }
        mouseMove(mouseEvent) {
            if (this.isGameOver) return;

            if (this.currentFruit != null && this.isMouseDown) {
                this.currentFruit.x = mouseEvent.stageX;
                if (this.currentFruit.x < this.currentFruit.width * 0.5)
                    this.currentFruit.x = this.currentFruit.width * 0.5;
                if (this.currentFruit.x > (this.owner.width - (this.currentFruit.width * 0.5)))
                    this.currentFruit.x = this.owner.width - (this.currentFruit.width * 0.5);

                this.targetLine.pos(this.currentFruit.x, this.creatY);
            }
        }
        /**
         * 生成爆炸特效
         * @param {*X位置} x 
         * @param {*Y位置} y 
         */
        creatBombEffect(fruitId, x, y) {
            if (fruitId < this.fruitPreArr.length) { this.addScore(fruitId * 2); }
            //使用对象池进行生成爆炸特效
            var effect = Laya.Pool.getItemByCreateFun("BombEffect", function () {
                return this.bombEffectPre.create();
            }, this);
            effect.visible = true;
            effect.active = true;
            this.owner.addChild(effect);
            effect.pos(x, y);
            effect.scaleX = (fruitId + 1) * 0.3;
            effect.scaleY = (fruitId + 1) * 0.3;
            Laya.timer.once(500, this, function () {
                effect.visible = false;
                effect.active = false;
                Laya.Pool.recover("BombEffect", effect);
            });
        }
        /**
         * 随机生成一个下标为0到4的水果
         * @param {*X位置} x 
         * @param {*Y位置} y 
         */
        randomCreatFruit(x, y) {
            this.targetLine.visible = true;
            this.targetLine.pos(x, y);
            return this.creatFruit(this.getRandomValue(0, 5), x, y);
        }
        /**
         * 生成水果
         * @param {水果ID下标} fruitId 
         * @param {*X位置} x 
         * @param {*Y位置} y 
         */
        creatFruit(fruitId, x, y, type = "static", gravityScale = 0, angularVelocity = 0) {
            if (fruitId >= this.fruitPreArr.length) return null;
            //本次生成的水果
            //var fruit = this.fruitPreArr[fruitId].create();
            //对象池中取出一个当前Id对应的水果，如果没有则创建一个
            var fruit = Laya.Pool.getItemByCreateFun(fruitId.toString(),
                function () {
                    return this.fruitPreArr[fruitId].create();
                }, this);
            this.owner.addChild(fruit);
            fruit.pos(x, y);
            var fruitRig = fruit.getComponent(Laya.RigidBody);
            fruitRig.gravityScale = gravityScale;
            fruitRig.type = type;
            //设置缸体的防止高速穿透
            fruitRig.bullet = true;
            fruitRig.allowSleep = false;
            fruitRig.friction = 0.4;
            fruitRig.angularVelocity = angularVelocity;

            fruit.getComponent(Fruit).Init(fruitId);
            fruit.getComponent(Fruit).isFall = false;
            fruit.active = true;
            fruit.visible = true;

            return fruit;
        }
        /**
         * 获取随机值，左闭右开区间
         * @param {*最小值} min 
         * @param {*最大值} max 
         */
        getRandomValue(min, max) {
            var value = Math.random() * (max - min - 1);
            value = Math.round(value);
            return value + min;
        }
        /**
         * 增加分数
         * @param {*增加的分数} value 
         */
        addScore(value = 0) {
            this.score += value;
            this.scoreText.text = "成绩:" + this.score;
        }
        showGameOverPanel() {
            this.gameOverPanel.visible = true;
            this.gameOverPanel.getChildAt(1).text = this.score;
        }
        playAgainGame() {
            this.gameOverPanel.visible = false;
            //重置成绩
            this.score = 0;
            this.addScore();
            //回收所有的水果
            for (let i = 0; i < this.owner.numChildren; i++) {
                var child = this.owner.getChildAt(i);
                if (child.getComponent(Fruit) != null) {
                    child.active = false;
                    child.visible = false;
                    Laya.Pool.recover(child.getComponent(Fruit).fruitID.toString(), child);
                }
            }
            this.targetLine.visible = false;
            this.currentFruit = this.randomCreatFruit(this.owner.width * 0.5, this.creatY);
            this.isMouseDown = false;
            this.isGameOver = false;
        }
    }

    /**
    *检测游戏结束
    * @ author:Anson
    * @ data: 2021-02-20 17:58
    */
    class CheckGameOver extends Laya.Script {

        constructor() {
            super();

            /** @prop {name:overTimeText, tips:"结束时间提示文本", type:Node, default:null}*/
            this.overTimeText = null;

            this.warningDealyTime = 10;
        }
        onAwake() {
            this.overTimeText.text = "";
        }
        onUpdate() {
            if (this.owner.parent.getComponent(GameManager).isGameOver) return;
            if (this.warningDealyTime <= 0) {
                Laya.stage.event("GameOver");
                this.overTimeText.visible = false;
                this.overTimeText.text = "";
                this.warningDealyTime = 10;
            }

            for (var i = 0; i < this.owner.parent.numChildren; i++) {
                var child = this.owner.parent.getChildAt(i);
                if (child.visible && child.getComponent(Fruit) != null
                    && child.getComponent(Fruit).isFall) {
                    if (Math.abs(this.owner.y - child.y) < child.width * 0.5) {
                        console.log("warning");
                        this.overTimeText.visible = true;
                        this.overTimeText.text = parseInt(this.warningDealyTime).toString();
                        this.warningDealyTime -= Laya.timer.delta * 0.001;
                        return;
                    }
                }
            }
            this.overTimeText.text = "";
            this.overTimeText.visible = false;
            this.warningDealyTime = 10;
        }
    }

    /**
    *检测场景内的所有水果
    * @ author:Anson
    * @ data: 2021-02-20 17:58
    */
    class CheckWarning extends Laya.Script {

        constructor() {
            super();
            /** @prop {name:warningText, tips:"警戒文本", type:Node, default:null}*/
            this.warningText = null;

            this.add = false;
            this.reduce = false;
            this.warningDealyTime = 2;
        }
        onAwake() {
            this.warningText.visible = false;
        }
        onUpdate() {
            if (this.owner.parent.getComponent(GameManager).isGameOver)
                this.warningText.visible = false;
            if (this.warningDealyTime <= 0) {
                this.warningText.visible = true;
            } else {
                this.warningText.visible = false;
            }
            this.textAinm();
            for (var i = 0; i < this.owner.parent.numChildren; i++) {
                var child = this.owner.parent.getChildAt(i);
                if (child.visible && child.getComponent(Fruit) != null
                    && child.getComponent(Fruit).isFall) {
                    if (Math.abs(this.owner.y - child.y) < child.width * 0.5) {
                        console.log("warning");
                        this.warningDealyTime -= Laya.timer.delta * 0.001;
                        return;
                    }
                }
            }
            this.warningDealyTime = 2;
        }
        textAinm() {
            if (this.warningText.alpha >= 1) {
                this.add = false;
                this.reduce = true;
            }
            if (this.warningText.alpha <= 0) {
                this.add = true;
                this.reduce = false;
            }

            if (this.add) { this.warningText.alpha += 0.05; }
            if (this.reduce) { this.warningText.alpha -= 0.05; }
        }
    }

    /**
    *
    * @ author:Anson
    * @ data: 2021-02-22 11:01
    */
    class FixScreen extends Laya.Script {

        constructor() {
            super();
            /** @prop {name:collider_Down, tips:"提示文本", type:Node, default:null}*/
            this.collider_Down = null;
            /** @prop {name:collider_Right, tips:"提示文本", type:Node, default:null}*/
            this.collider_Right = null;
            /** @prop {name:collider_Left, tips:"提示文本", type:Node, default:null}*/
            this.collider_Left = null;
            /** @prop {name:bg, tips:"提示文本", type:Node, default:null}*/
            this.bg = null;
            /** @prop {name:gameOverPanel, tips:"提示文本", type:Node, default:null}*/
            this.gameOverPanel = null;
            ///** @prop {name:targetLine, tips:"提示文本", type:Node, default:null}*/
            //this.targetLine = null;
        }

        onAwake() {
            this.collider_Down.y = Laya.stage.height;
            this.collider_Down.getComponent(Laya.BoxCollider).width = Laya.stage.width;
            this.collider_Right.getComponent(Laya.BoxCollider).height = Laya.stage.height;
            this.collider_Left.getComponent(Laya.BoxCollider).height = Laya.stage.height;
            this.bg.height = Laya.stage.height;
            this.gameOverPanel.pos(Laya.stage.width * 0.5, Laya.stage.height * 0.5);
            //this.targetLine.height = Laya.stage.height - this.targetLine.y;
        }
    }

    /**This class is automatically generated by LayaAirIDE, please do not make any modifications. */

    class GameConfig {
        static init() {
            //注册Script或者Runtime引用
            let reg = Laya.ClassUtils.regClass;
    		reg("scripts/GameManager.js",GameManager);
    		reg("scripts/CheckGameOver.js",CheckGameOver);
    		reg("scripts/CheckWarning.js",CheckWarning);
    		reg("scripts/FixScreen.js",FixScreen);
    		reg("scripts/Fruit.js",Fruit);
        }
    }
    GameConfig.width = 1080;
    GameConfig.height = 1920;
    GameConfig.scaleMode ="fixedwidth";
    GameConfig.screenMode = "vertical";
    GameConfig.alignV = "middle";
    GameConfig.alignH = "center";
    GameConfig.startScene = "Main.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;

    GameConfig.init();

    class Main {
    	constructor() {
    		//根据IDE设置初始化引擎		
    		if (window["Laya3D"]) Laya3D.init(GameConfig.width, GameConfig.height);
    		else Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
    		Laya["Physics"] && Laya["Physics"].enable();
    		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
    		Laya.stage.scaleMode = GameConfig.scaleMode;
    		Laya.stage.screenMode = GameConfig.screenMode;
    		Laya.stage.alignV = GameConfig.alignV;
    		Laya.stage.alignH = GameConfig.alignH;
    		//兼容微信不支持加载scene后缀场景
    		Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;

    		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
    		if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true") Laya.enableDebugPanel();
    		if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"]) Laya["PhysicsDebugDraw"].enable();
    		if (GameConfig.stat) Laya.Stat.show();
    		Laya.alertGlobalError(true);

    		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
    		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
    	}

    	onVersionLoaded() {
    		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
    		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
    	}

    	onConfigLoaded() {
    		//加载IDE指定的场景
    		GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
    	}
    }
    //激活启动类
    new Main();

}());
