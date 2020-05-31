import { IPosition, Rectangle, Point } from './kd-tree';
import { ReturnStatement } from '@angular/compiler';


export interface INormalDist {
  mean: number;
  stdDev: number;
}

export interface IInfectionHuman {
  /** duracion del periodo de incubación */
  incubation: INormalDist;
  /** Probabilidad de tener sintomas */
  asintomatic: number;
  /** Duracion desde la infección hasta la curación */
  infectionPeriod: INormalDist;
  /** Posibilidad de muerte */
  lethality: number;
  /** Posibilidad de ganar inmunidad (si no murió) */
  immunity: number;
}

export interface IInfectionOptions {
  /** distancia minima a partir de la cual el contagio es directamente la probabilidad */
  distanceBase: number;
  /** Probabilidad de contagio a la minima distancia o inferior */
  contagiousProb: number;
  humanData: IInfectionHuman;
}

export enum HStatus {
  none = 0,
  infected = 1 << 0,
  incubation = 1 << 1,
  infectious = 1 << 2,
  symptomatic = 1 << 3,
  death = 1 << 4,
  inmune = 1 << 5
}


export class Human {
  private nextDay = 10000;
  hstatus: HStatus = HStatus.none;
  endIncubationDay: number;
  endInfectionDay: number;
  willDie: boolean;
  willInmune: boolean;
  howManyInfect=0; // A cuantos infecto

  public constructor() {

  }

  /** infecta un humando */
  public infect(currentDay: number, opt: IInfectionHuman): boolean {
    if (this.hstatus) return false;
    this.hstatus = HStatus.infected | HStatus.incubation;
    this.endIncubationDay = currentDay + getRndNormalDist(opt.incubation);
    this.endInfectionDay = this.endIncubationDay + getRndNormalDist(opt.infectionPeriod);
    this.willDie = getSuccess(opt.lethality);
    if(!this.willDie) this.willInmune=getSuccess(opt.immunity);
    return true;
  }

  public inmunize(){
    this.hstatus=HStatus.inmune;
  }

  /** Cada persona cambia su estado de salud */
  public checkStatus(currentDay: number, opt: IInfectionHuman) {
    if (!this.hstatus) return;
    if ((this.hstatus & HStatus.inmune) || (this.hstatus & HStatus.death)) return;
    if (this.hstatus & HStatus.infected) {
      if (this.hstatus & HStatus.incubation) {
        if (currentDay >= this.endIncubationDay) {
          this.hstatus &= ~HStatus.incubation;
          this.hstatus |= HStatus.infectious;
          if(!getSuccess(opt.asintomatic)) this.hstatus |= HStatus.symptomatic;
        }
        return;
      } else {
        if (currentDay >= this.endInfectionDay) {
          if (this.willDie) {
            this.hstatus = HStatus.death;
          } else {
            if(this.willInmune) this.hstatus = HStatus.inmune;
            else this.hstatus=HStatus.none;
          }
        }
      }
    }
  }

}

export interface IHumanOpt {
  /** Zona en la que se mueven */
  zone: Rectangle;
  /** porcentaje de los que se mueven */
  moving: number;
  /** Diferentes posiciones que pueden tener */
  diferentPositions: number;
  /** distancioa promedio a la que se mueven */
  distance: number;
}

export class HumanFactory {
  public static create(count: number, opt: IHumanOpt): Array<Human> {
    const res: Array<Human> = [];
    for (let i = 0; i < count; i++) {
      const nh = new Human();
      res.push(nh);
    }
    return res;
  }

  public static createTest(): Array<Human> {
    const res: Array<Human> = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const nh = new Human();
        res.push(nh);
      }
    }
    return res;
  }

  public static createTest2(): Array<Human> {
    const p: Point[] = [new Point(2, 8), new Point(4, 7), new Point(2, 1),
    new Point(5, 2), new Point(6, 4), new Point(8, 6),
    new Point(9, 3), new Point(9, 4)
    ];
    const res: Array<Human> = [];
    p.forEach((el) => {
      const nh = new Human();
      res.push(nh);
    });
    return res;
  }
}


/** Si ocurre un suceso con probabilidad indicada (0,1] */
export function getSuccess(prob: number): boolean {
  return Math.random() < prob;
}

function getRandom(min, max): number {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRndPos(rec: Rectangle): Point {
  return new Point(getRandom(rec.left, rec.right), getRandom(rec.bottom, rec.top));
}

function getRndNormalDist(dat: INormalDist): number {
  // return dat.mean;
  return getRndNormal(dat.mean, dat.stdDev);
}

/** Devuelve un dato con dsitrubción normal, usando  Box-Muller aproximación */
function getRndNormal(mean: number, stdDev: number): number {
  const u1 = 1.0 - Math.random();
  const u2 = 1.0 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + stdDev * randStdNormal;
}

/** devuelve un punto en el entorno del anterior, y limitado por rectangle. */
export function getRndGauPos(recLimit: Rectangle, refPoint: Point, stdDev: number): Point{
  if(!recLimit.fullContains(refPoint)) throw Error('Ref point invalid');
  let res: Point;
  do{
    const prnd=new Point(getRndNormal(0, stdDev),getRndNormal(0, stdDev));
    res=refPoint.addPoint(prnd);
  }while(! recLimit.fullContains(res));
  return res;
}


export type PopulationDistribution = (recLimit: Rectangle) => Generator<Point, void, unknown>;

export const geUnique: PopulationDistribution=function*(recLimit: Rectangle){
  yield new Point(0,0);
};

export const getRndPopulationPos: PopulationDistribution= function*(recLimit: Rectangle){
   while(true){
     while(true){
       const res=getRndPos(recLimit);
       yield res;
     }
   }
};

export const getOrganicPopulationPos: PopulationDistribution= function*(recLimit: Rectangle){
  while(true){
    const pCity= getRndPos(recLimit); // new Point(400,200);//
    const rCity=  (recLimit.top-recLimit.bottom)/5;
    const maxNumZone1=20; // zonas por ciudad
    let nZone1=0;
    while(nZone1<maxNumZone1){
      const pZone1=getRndGauPos(recLimit,pCity,rCity);
      const rZone1=rCity/3;
      const maxZone2=200; //Habitantes por zona
      let nZone2=0;
      while(nZone2<maxZone2){
        const res=getRndGauPos(recLimit, pZone1, rZone1);
        yield res;
        nZone2++;
      }
      nZone1++; 
    }
  }
};

export const getConsecutivePopulationPos: PopulationDistribution= function*(recLimit: Rectangle){
  let p=new Point(0,40);
  while(true){
    yield p;
    p=p.addDis(4,0);
    if(p.x>recLimit.right){
      p=new Point(0,p.y+4);
      if(p.y>recLimit.top) p=new Point(0,0);
    }
  }     
};
