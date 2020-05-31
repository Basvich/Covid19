import {ReturnStatement} from '@angular/compiler';


export interface IPosition {
  x: number;
  y: number;
}


export class Point implements IPosition {
  constructor(public readonly x: number, public readonly y: number) {}
  public static from(p: Point) {
    return new Point(p.x, p.y);
  }

  public addDis(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }

  public addPoint(other: Point): Point {
    return new Point(this.x + other.x, this.y + other.y);
  }

  public sub(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  public equivalent(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }

  public axisValue(d: number): number {
    if (d === 0) return this.x;
    return this.y;
  }

  public distance(other: Point): number{
    return Math.sqrt((other.x-this.x)**2 + (other.y-this.y)**2);
  }
}

export class Rectangle {
  /* public readonly left: number;
  public readonly right: number;
  public readonly bottom: number;
  public readonly top: number; */

  public constructor(
    public readonly left: number, public readonly right: number,
    public readonly bottom: number, public readonly top: number) {
  }

  public static fromRadius(center: IPosition, distance: number): Rectangle {
    return new Rectangle(center.x - distance, center.x + distance,
      center.y - distance, center.y + distance);
  }

  public fullContains(p: IPosition): boolean {
    return p.x >= this.left && p.x <= this.right && p.y <= this.top && p.y >= this.bottom;
  }

  public fullContainAxis(axis: number, v: number): boolean {
    return v >= this.minAxis(axis) && v <= this.maxAxis(axis);
  }

  public minAxis(d: number) {
    if (d === 0) return this.left;
    return this.bottom;
  }

  public maxAxis(d: number) {
    if (d === 0) return this.right;
    return this.top;
  }

  public area(): number{
    return (this.right-this.left)*(this.top-this.bottom);
  }

}

export interface IDataPoint<T> {
  point: IPosition;
  data: T;
}

export interface INodeKdTree<T> {
  location: IDataPoint<T>;
  left?: INodeKdTree<T>;
  right?: INodeKdTree<T>;
}


export class KdTree<T> {

  public get count(): number {
    return this.
      _count;
  }

  protected constructor() {}
  private static K = 2;
  root: INodeKdTree<T>;
  private _count: number;

  protected static axisValue(p: IPosition, axis: number): number {
    if (axis % 2 === 0) return p.x;
    else return p.y;
  }

  protected static minimumOld(n1: INodeKdTree<any>, n2: INodeKdTree<any>, depth: number): INodeKdTree<any> {
    if (!n1) return n2;
    if (!n2) return n1;
    const axis = depth % this.K;
    if (this.axisValue(n1.location.point, axis) <= this.axisValue(n2.location.point, axis)) return n1;
    else return n2;
  }

  protected static minimum(x: INodeKdTree<any>, y: INodeKdTree<any>, z: INodeKdTree<any>, depth: number): INodeKdTree<any> {
    let res = x;
    const axis = depth % this.K;
    if (y && this.axisValue(y.location.point, axis) < this.axisValue(res.location.point, axis)) res = y;
    if (z && this.axisValue(z.location.point, axis) < this.axisValue(res.location.point, axis)) res = z;
    return res;
  }

  protected static remove(root: INodeKdTree<any>, toRemove: IDataPoint<any>, depth: number): INodeKdTree<any> {
    if (!root) return null;
    const cd = depth % this.K;
    if (root.location === toRemove) {
      if (root.right) {
        const min = this.findMin(root.right, cd, depth + 1);
        // Copy the minimun to root;
        root.location = min.location;
        // Recursively delete the minimum
        root.right = this.remove(root.right, min.location, depth + 1);
      } else if (root.left) {
        const min = this.findMin(root.left, cd, depth + 1);
        // Copy the minimun to root
        root.location = min.location;
        // Recursively delete the minimum
        root.right = this.remove(root.left, min.location, depth + 1);
        root.left = null;
      } else {
        return null;
      }
    }
    // 2) If current node doesn't contain point, search downward
    if (this.axisValue(toRemove.point, cd) < this.axisValue(root.location.point, cd)) {
      root.left = this.remove(root.left, toRemove, depth + 1);
    } else {
      root.right = this.remove(root.right, toRemove, depth + 1);
    }
    return root;
  }

  public static createFrom<T>(points: IDataPoint<T>[]): KdTree<T> {
    const res = new KdTree<T>();
    res.root = KdTree.kdTree(points, 0);
    res._count = points.length;
    return res;
  }

  public static findMin<T>(n: INodeKdTree<T>, d: number, depth: number): INodeKdTree<T> {
    if (!n) return undefined;
    const cd = depth % this.K;
    if (d === cd) {
      if (!n.left) return n;
      else return this.findMin(n.left, d, depth + 1);
    } else {
      const n1 = this.findMin(n.left, d, depth + 1);
      const n2 = this.findMin(n.right, d, depth + 1);
      return this.minimum(n, n1, n2, d);
    }
  }

  protected static kdTree<T>(points: IDataPoint<T>[], depth: number): INodeKdTree<T> {
    if (!points || points.length === 0) return null;
    const axis = depth % this.K;
    const sortedPoints: IDataPoint<T>[] = points.sort((p1, p2) =>
      Math.sign(KdTree.axisValue(p1.point, axis) - KdTree.axisValue(p2.point, axis))
    );
    const medianIndex = Math.floor(sortedPoints.length / 2);
    const node: INodeKdTree<T> = {
      location: sortedPoints[medianIndex]
    };
    let ln = medianIndex;
    if (ln > 0) node.left = KdTree.kdTree(sortedPoints.slice(0, ln), depth + 1);
    ln = points.length - medianIndex - 1;
    if (ln > 0) node.right = KdTree.kdTree(sortedPoints.slice(medianIndex + 1), depth + 1);
    if (!node.location) {
      console.log('HAYYY');
    }
    console.assert(!!(node.location), 'NODO sin LOCATION');
    return node;
  }

  public GetAll(): IDataPoint<T>[] {
    const res: Array<IDataPoint<T>> = [];
    const addtn = (n: INodeKdTree<T>) => {
      if (!n) return;
      res.push(n.location);
      addtn(n.left);
      addtn(n.right);
    };
    addtn(this.root);
    return res;
  }

  public Clone(): KdTree<T> {
    const res = new KdTree<T>();
    res.root = this.cloneNode(this.root);
    res._count = this._count;
    return res;
  }


  protected cloneNode(from: INodeKdTree<T>): INodeKdTree<T> {
    if (!from) return undefined;
    const res: INodeKdTree<T> = {
      location: from.location,
      left: this.cloneNode(from.left),
      right: this.cloneNode(from.right)
    };
    return res;
  }

  public getInZone(zone: Rectangle, node: INodeKdTree<T> = this.root,
                   depth: number = 0, currents: IDataPoint<T>[] = null): IDataPoint<T>[] {
    let res = currents;
    if (!node) return currents;
    const axis = depth % KdTree.K;
    // console.debug(`node en: [${node.location.point.x}, ${node.location.point.y}]  depth:${depth}`);
    if (zone.fullContains(node.location.point)) {
      // console.debug('Punto en zona');
      if (!res) res = [];
      res.push(node.location);
    }
    if (node.left) {
      // console.debug(`left minAxis:${zone.minAxis(axis)} node:${KdTree.axisValue(node.location.point, axis)}`);
      if (zone.minAxis(axis) <= KdTree.axisValue(node.location.point, axis)) {
        res = this.getInZone(zone, node.left, depth + 1, res);
      }
    }
    if (node.right) {
      // console.debug(`right maxAxis:${zone.maxAxis(axis)} node:${KdTree.axisValue(node.location.point, axis)}`);
      if (zone.maxAxis(axis) >= KdTree.axisValue(node.location.point, axis)) {
        res = this.getInZone(zone, node.right, depth + 1, res);
      }
    }
    return res;
  }

  /** Se añade un nuevo nodo. Como se añade siempre al final, puede resultar no balanceado */
  public insert(newData: IDataPoint<T>, root: INodeKdTree<T> = this.root, depth=0): INodeKdTree<T> {
    if(!root){
      return {location:newData};
    }
    const axis = depth % KdTree.K;
    if(KdTree.axisValue(newData.point, axis)<KdTree.axisValue(root.location.point, axis)){
      root.left = this.insert(newData, root.left, depth + 1);
    }else{
      root.right = this.insert(newData, root.right, depth + 1);
    }
    return root;
   }

  public trace(){
    this.traceNode(this.root, 0);
  }

  protected traceNode(node: INodeKdTree<T>, depth: number) {
    if (!node) return;
    const axis = depth % KdTree.K;
    const saxis = axis ? 'y' : 'x';
    console.log(`NODO depth:${depth} axis ${saxis}=${KdTree.axisValue(node.location.point, axis)}  point: [${node.location.point.x}, ${node.location.point.y}]`);
    if (node.left) {
      console.log('Left:');
      console.group();
      this.traceNode(node.left, depth + 1);
      console.groupEnd();
    }
    if (node.right) {
      console.log('Right:');
      console.group();
      this.traceNode(node.right, depth + 1);
      console.groupEnd();
    }
  }


}
