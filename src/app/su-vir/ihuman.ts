import { IPosition, Rectangle, Point } from './kd-tree';



export interface IInfectionOptions{
  /** distancia minima a partir de la cual el contagio es directamente la probabilidad */
  distanceBase: number;
}

export interface IHealth {
  death: boolean;
  infected: boolean;
  infectedSince?: number;
  /** Si es capaz de propagar la infccion */
  infectious?: boolean;
}

/* 
export interface IHuman {
  id: number;
  pos?: IPosition;
} */

export class Human {
  position: Point;
  health: IHealth;
  public constructor(){
    this.health={
      death:false,
      infected:false
    };
  }

  public infect(day){
    this.health.infected=true;
    this.health.infectious=true;
    this.health.infectedSince=day;
  }
}

export interface IHumanOpt {
  zone: Rectangle;
}

export class HumanFactory {
  public static create(count: number, opt: IHumanOpt): Array<Human> {
    const res: Array<Human> = [];
    for (let i = 0; i < count; i++) {
      const nh = new Human();
      nh.position=getRndPos(opt.zone) ;
      res.push(nh);
    }
    return res;
  }

  public static createTest(): Array<Human> {
    const res: Array<Human> = [];
    for(let x=0; x<8;x++){
      for(let y=0; y<8;y++){
        const nh = new Human();
        nh.position=new Point(x*4, y*4);
        res.push(nh);
      }
    }
    return res;
  }

  public static createTest2(): Array<Human> {
    const p: Point[]=[new Point(2,8), new Point(4,7), new Point(2,1),
      new Point(5,2), new Point(6,4), new Point(8,6),
      new Point(9,3), new Point(9,4)
    ];
    const res: Array<Human> = [];
    p.forEach((el)=>{
      const nh = new Human();
      nh.position=el;
      res.push(nh);
    });
    return res;
  }
}

function getRandom(min, max): number {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRndPos(rec: Rectangle): Point{
  return new Point(getRandom(rec.left,rec.right), getRandom(rec.bottom, rec.top));
}
