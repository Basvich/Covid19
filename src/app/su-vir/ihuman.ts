import { IPosition, Rectangle, Point } from './kd-tree';



export interface IInfectionOptions{
  /** distancia minima a partir de la cual el contagio es directamente la probabilidad */
  distanceBase: number;
}

enum HStatus{
  none= 0,
  infected = 1<< 0,
  infectious = 1<<1,
  symptomatic = 1<<2,
  death = 1<<3,
  inmune = 1<<4
}

export interface IHealth {
  death: boolean;
  
  infected: boolean;
  infectedSince?: number;
  /** Si es capaz de propagar la infccion */
  infectious?: boolean;
}

export class Human {
  position: Point;
  private nextDay=10000;
  health: IHealth;
  hstatus: HStatus=HStatus.none;

  public constructor(){
    this.health={
      death:false,
      infected:false
    };
  }

  public infect(day){
    if(this.hstatus) return;
    this.hstatus=HStatus.infected;
  }


  public changeStatus(day){
    if(this.hstatus===HStatus.none){
      this.hstatus=HStatus.infected;
    }else{

    }
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


/** Si ocurre un suceso con probabilidad indicada (0,1] */
function getSuccess(prob: number): boolean{
  return Math.random()<prob;
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

/** Devuelve un dato con dsitrubción normal, usando  Box-Muller aproximación */
function getRndNormal(mean: number,stdDev: number): number{
   const u1=1.0 - Math.random();
   const u2=1.0 - Math.random();
   const randStdNormal=Math.sqrt(-2.0 * Math.log(u1))*Math.sign(2.0 * Math.PI * u2);
   return mean+stdDev*randStdNormal;
}
