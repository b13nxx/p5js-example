/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable-next-line @typescript-eslint/triple-slash-reference */
/// <reference path="./node_modules/@types/p5/global.d.ts" />

class Point {
  private _x: number
  private _y: number

  constructor (x: number, y: number) {
    this._x = x
    this._y = y
  }

  set x (x: number) {
    this._x = x
  }

  get x (): number {
    return this._x
  }

  set y (y: number) {
    this._y = y
  }

  get y (): number {
    return this._y
  }

  static distance (p1: Point, p2: Point): number {
    return parseInt(sqrt(pow(p2.x - p1.x, 2) + pow(p2.y - p1.y, 2)).toString())
  }

  static angle (p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
  }

  static move (p1: Point, angle: number, distance: number): Point {
    return new Point(Math.round(Math.cos(angle * Math.PI / 180) * distance + p1.x), Math.round(Math.sin(angle * Math.PI / 180) * distance + p1.y))
  }
}

class Boundaries {
  private _x1: Point
  private _x2: Point
  private _x3: Point
  private _x4: Point

  constructor (x1: Point, x2: Point, x3: Point, x4: Point) {
    this._x1 = x1
    this._x2 = x2
    this._x3 = x3
    this._x4 = x4
  }

  set x1 (x1: Point) {
    this._x1 = x1
  }

  get x1 (): Point {
    return this._x1
  }

  set x2 (x2: Point) {
    this._x2 = x2
  }

  get x2 (): Point {
    return this._x2
  }

  set x3 (x3: Point) {
    this._x3 = x3
  }

  get x3 (): Point {
    return this._x3
  }

  set x4 (x4: Point) {
    this._x4 = x4
  }

  get x4 (): Point {
    return this._x4
  }

  [Symbol.iterator] (): any {
    const data = [this._x1, this._x2, this._x3, this._x4]
    let index = -1

    return {
      next: () => ({ value: data[++index], done: !(index in data) })
    }
  }

  static getBoundaries (position: Point, size: Size): Boundaries {
    return new Boundaries(new Point(position.x - size.width / 2, position.y - size.height / 2), new Point(position.x + size.width / 2, position.y - size.height / 2), new Point(position.x - size.width / 2, position.y + size.height / 2), new Point(position.x + size.width / 2, position.y + size.height / 2))
  }
}

class Size {
  private _width: number
  private _height: number

  constructor (width: number, height: number) {
    this._width = width
    this._height = height
  }

  set width (width: number) {
    this._width = width
  }

  get width (): number {
    return this._width
  }

  set height (height: number) {
    this._height = height
  }

  get height (): number {
    return this._height
  }
}

class Sprite {
  private position: Point
  private size: Size
  private originalPosition: Point
  private step: Point
  private boundaries: Boundaries
  private readonly image: any
  private isPressed: boolean
  private isMoving: boolean
  private id: number
  private readonly path: string
  private lock: boolean
  private target: Point

  constructor (path: string, id: number) {
    this.image = loadImage(path)
    this.image.resize(200, 200)
    this.setPosition(25, 25)
    this.setOriginalPosition(25, 25)
    this.setSize(50, 50)
    this.setId(id)
    this.path = path
    this.step = null
    this.isPressed = false
    this.isMoving = false
    this.lock = false
    this.target = null
  }

  draw (): void {
    if (this.isPressed) {
      this.isMoving = true
      this.setPosition(mouseX, mouseY)

      this.target = mouseY < (windowHeight / 2 - Game.spriteSize) || mouseY > (windowHeight / 2 + Game.spriteSize) ? Point.move(this.originalPosition, Point.angle(this.position, this.originalPosition), 50) : null

      const boundaries = Boundaries.getBoundaries(this.originalPosition, this.size)
      if (!this.lock && (this.position.x < boundaries.x1.x - Game.spriteGap / 2 || this.position.x > boundaries.x4.x + Game.spriteGap / 2)) {
        let collision: any = this.checkCollision()
        if (collision !== null) {
          this.lock = true
          setTimeout(() => { this.lock = false }, 100)

          collision = collision.copy()
          const rightShift: boolean = this.getId() - collision.getId() > 0
          if (rightShift) {
            for (let i: number = collision.getId(); i < this.getId(); i++) {
              Game.sprites[i].setOriginalPosition(Game.sprites[i + 1].getOriginalPosition().x, Game.sprites[i + 1].getOriginalPosition().y)
              Game.sprites[i].setId(Game.sprites[i + 1].getId())
            }
          } else {
            for (let i = collision.getId(); i > this.getId(); i--) {
              Game.sprites[i].setOriginalPosition(Game.sprites[i - 1].getOriginalPosition().x, Game.sprites[i - 1].getOriginalPosition().y)
              Game.sprites[i].setId(Game.sprites[i - 1].getId())
            }
          }

          this.setId(collision.getId())
          this.setOriginalPosition(collision.position.x, collision.position.y)
          Game.sprites.sort((a, b) => a.getId() - b.getId())
        }
      }
    } else if (this.target !== null && Point.distance(this.position, this.target) > 10) {
      this.isMoving = true
      this.move(this.target, 20)
    } else if (Point.distance(this.position, this.originalPosition) > 10) {
      this.target = null
      this.step = null
      this.move(this.originalPosition, 20)
    } else {
      this.isMoving = false
      this.step = null
      this.setPosition(this.originalPosition)
    }

    image(this.image, this.boundaries.x1.x, this.boundaries.x1.y, this.size.width, this.size.height)
  }

  move (destination: Point, speed: number = 5): void {
    if (this.step === null) {
      const distance = Point.distance(this.position, destination)
      const frame = distance / speed
      this.step = new Point((destination.x - this.position.x) / frame, (destination.y - this.position.y) / frame)
    }

    this.setPosition(this.position.x + this.step.x, this.position.y + this.step.y)
  }

  checkCollision (): any {
    let boundaries: Boundaries
    for (const sprite of Game.sprites) {
      if (sprite.getId() === this.getId()) {
        continue
      }

      boundaries = sprite.getBoundaries()
      for (const boundry of this.boundaries) {
        if (boundry.x >= boundaries.x1.x && boundry.x <= boundaries.x4.x && boundry.y >= boundaries.x1.y - 20 && boundry.y <= boundaries.x4.y - 20) {
          return sprite
        }
      }
    }

    return null
  }

  copy (): Sprite {
    const sprite: Sprite = new Sprite(this.path, this.getId())
    sprite.setPosition(this.getPosition())
    sprite.setOriginalPosition(this.getOriginalPosition())
    sprite.setSize(this.getSize())
    return sprite
  }

  setPosition (x: number | Point, y?: number): void {
    if (this.position === undefined) {
      if (x instanceof Point) {
        this.position = new Point(x.x, x.y)
      } else {
        this.position = new Point(x, y)
      }
    }

    if (x instanceof Point) {
      this.position.x = x.x
      this.position.y = x.y
    } else {
      this.position.x = x
      this.position.y = y
    }

    if (this.size !== undefined) {
      this.setBoundaries()
    }
  }

  setOriginalPosition (x: number | Point, y?: number): void {
    if (this.originalPosition === undefined) {
      if (x instanceof Point) {
        this.originalPosition = new Point(x.x, x.y)
      } else {
        this.originalPosition = new Point(x, y)
      }
    }

    if (x instanceof Point) {
      this.originalPosition.x = x.x
      this.originalPosition.y = x.y
    } else {
      this.originalPosition.x = x
      this.originalPosition.y = y
    }
  }

  setSize (width: number | Size, height?: number): void {
    if (this.size === undefined) {
      if (width instanceof Size) {
        this.size = new Size(width.width, width.height)
      } else {
        this.size = new Size(width, height)
      }
    }

    if (width instanceof Size) {
      this.size.width = width.width
      this.size.height = width.height
    } else {
      this.size.width = width
      this.size.height = width
    }

    if (this.position !== undefined) {
      this.setBoundaries()
    }
  }

  setBoundaries (): void {
    if (this.boundaries === undefined) {
      this.boundaries = new Boundaries(new Point(this.position.x - this.size.width / 2, this.position.y - this.size.height / 2), new Point(this.position.x + this.size.width / 2, this.position.y - this.size.height / 2), new Point(this.position.x - this.size.width / 2, this.position.y + this.size.height / 2), new Point(this.position.x + this.size.width / 2, this.position.y + this.size.height / 2))
    }

    this.boundaries.x1.x = this.position.x - this.size.width / 2
    this.boundaries.x1.y = this.position.y - this.size.height / 2
    this.boundaries.x2.x = this.position.x + this.size.width / 2
    this.boundaries.x2.y = this.position.y - this.size.height / 2
    this.boundaries.x3.x = this.position.x - this.size.width / 2
    this.boundaries.x3.y = this.position.y + this.size.height / 2
    this.boundaries.x4.x = this.position.x + this.size.width / 2
    this.boundaries.x4.y = this.position.y + this.size.height / 2
  }

  setIsPressed (isPressed: boolean): void {
    this.isPressed = isPressed
  }

  setId (id: number): void {
    this.id = id
  }

  getPosition (): Point {
    return this.position
  }

  getOriginalPosition (): Point {
    return this.originalPosition
  }

  getSize (): Size {
    return this.size
  }

  getBoundaries (): Boundaries {
    return this.boundaries
  }

  getIsPressed (): boolean {
    return this.isPressed
  }

  getIsMoving (): boolean {
    return this.isMoving
  }

  getId (): number {
    return this.id
  }
}

const Game: {
  sprites: Sprite[]
  documentGap: number
  spriteGap: number
  columnSize: number
  spriteSize: number
  preload: Function
  setup: Function
  draw: Function
  windowResized: Function
  mousePressed: Function
  mouseReleased: Function
  reassignPositions: Function
} = {
  sprites: [],
  documentGap: 0,
  spriteGap: 0,
  columnSize: 0,
  spriteSize: 0,
  preload (): void {
    const quantity: number = 7
    const numbers: number[] = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, quantity)
    let i = 0
    for (const number of numbers) {
      Game.sprites.push(new Sprite(`https://raw.githubusercontent.com/TayfunTurgut/PF-Challenge/master/tata/tile00${number}.png`, i))
      i++
    }
    Game.reassignPositions()
  },
  setup (): void {
    createCanvas(windowWidth, windowHeight)
  },
  draw (): void {
    background(0)
    for (const sprite of Game.sprites) {
      if (sprite.getIsMoving() === true || sprite.getIsPressed() === true) {
        continue
      }

      sprite.draw()
    }

    for (const sprite of Game.sprites) {
      if (sprite.getIsMoving() === true && sprite.getIsPressed() === false) {
        sprite.draw()
      }
    }

    for (const sprite of Game.sprites) {
      if (sprite.getIsPressed() === true) {
        sprite.draw()
        break
      }
    }
  },
  windowResized (): void {
    resizeCanvas(windowWidth, windowHeight)
    Game.reassignPositions()
  },
  mousePressed (): void {
    let boundaries: Boundaries
    for (const sprite of Game.sprites) {
      boundaries = sprite.getBoundaries()
      if (mouseX > boundaries.x1.x && mouseX < boundaries.x4.x && mouseY > boundaries.x1.y && mouseY < boundaries.x4.y) {
        sprite.setIsPressed(true)
        break
      }
    }
  },
  mouseReleased (): void {
    for (const sprite of Game.sprites) {
      sprite.setIsPressed(false)
    }
  },
  reassignPositions (): void {
    Game.documentGap = 200 * (windowWidth / displayWidth)
    Game.spriteGap = 50 * (windowWidth / displayWidth)
    Game.columnSize = (windowWidth - Game.documentGap) / Game.sprites.length
    Game.spriteSize = Game.columnSize - Game.spriteGap
    for (let i = 0; i < Game.sprites.length; i++) {
      Game.sprites[i].setSize(Game.spriteSize, Game.spriteSize)
      Game.sprites[i].setOriginalPosition(Game.documentGap / 2 + Game.spriteGap / 2 + ((Game.spriteSize + Game.spriteGap) * i) + Game.spriteSize / 2, windowHeight / 2)
    }
  }
}

function preload (): void {
  Game.preload()
}

function setup (): void {
  Game.setup()
}

function draw (): void {
  Game.draw()
}

function windowResized (): void {
  Game.windowResized()
}

function mousePressed (): void {
  Game.mousePressed()
}

function mouseReleased (): void {
  Game.mouseReleased()
}
