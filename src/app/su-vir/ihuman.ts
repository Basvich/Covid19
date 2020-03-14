import { IPosition, Rectangle, Point } from './kd-tree';



export interface IHealth {
  death: boolean;
  infected: boolean;
  infectedSince?: number;
}

/** Principal */
export interface IHuman {
  /** un identificativo  */
  id: number;
  pos?: IPosition;
}

export class Human {
  position: Point;
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
}

export const create = (): IHuman => {
  const a: IHuman = {id: 34};
  return a;
};

function getRandom(min, max): number {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRndPos(rec: Rectangle): Point{
  return new Point(getRandom(rec.left,rec.right), getRandom(rec.bottom, rec.top));
}
