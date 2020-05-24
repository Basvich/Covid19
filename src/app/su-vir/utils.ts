
export type ISimpleCallback = (err?: Error, result?: any) => void;
export type ISImpleProccessCallback = (err?: Error, dataStatus?: any, nextDataIn?: any) => void;
export type IFProccessData<T> = (dataIn: T) => void;
export type ISimpleStep = (data: any, callback: ISimpleCallback) => void;

export type ISImpleProcessStatus<T> = (dataStatus: any, callback: ISImpleProccessCallback) => IFProccessData<T>;

export class ExitMachine extends Error {
  constructor(public data?: any) {
    super();
  }
}

/**
 * Una maquinita de estados simples, en el que cada estado puede pasar solo al siguiente en una lista.
 * cada estado tiene que devoler una función que es la que acepta los tipos de datos de entrada.
 * @param arrFunc - estados
 * @param endFunc - funcion final cuando se acabe o hay error.
 * @param {*} [startData] - Datos iniciales de estado para arrancar
 * @returns 
 */
export function simpleSerialMachine<T>(
  arrFunc: ISImpleProcessStatus<T>[],
  endFunc: (error: any, data: any) => void, startData?: any): IFProccessData<T> {
  if (!arrFunc || arrFunc.length <= 0 || !endFunc) throw new Error('Incorrect simpleSerialMachine');
  arrFunc.forEach((value) => {
    if (typeof value !== 'function') throw new Error('Incorrect simpleSerialMachine function');
  });

  let currStep = 0;
  const currentData: any = startData;
  let currFuncStep: IFProccessData<T> = null; // funcion actual de entrada

  const miCallback: ISImpleProccessCallback = (err: any, dataStatus: any, dataNext: T) => {
    if (err || (currStep >= arrFunc.length)) {
      let nerr = err;
      if (nerr && (nerr instanceof ExitMachine)) {
        nerr = undefined;
      }
      return endFunc(nerr, dataStatus);
    }
    // Saltamos al siguiente status
    currFuncStep = arrFunc[currStep++](currentData, miCallback);
    if (typeof dataNext !== 'undefined') miDataInStep(dataNext);
  };
  currFuncStep = arrFunc[currStep++](currentData, miCallback);
  const miDataInStep: IFProccessData<T> = (dataIn: T) => {
    try {
      // console.log("[simpleSerialMachine] - %s - %s() datain:'%s'", arrFunc[currStep - 1].name, currFuncStep.name, dataIn);
      currFuncStep(dataIn);
    } catch (eerr) {
      currStep = arrFunc.length + 1;
      endFunc(eerr, currentData);
    }
  };
  return miDataInStep;
}

/** Un simple buffer array, para facilitar  */
class CircularArray{
  values: number[];
  numData=0;
  /** Posicion actual de la proxima escritura */
  writePointer=0;
  /** posicion actual del buffer de lectura */
  readPointer=-1;
  

  constructor(public numDatas: number){
    if(numDatas<=0) throw new Error('Invalid lenght');
    this.values=new Array<number>(numDatas);
    for(let i=0; i<numDatas; i++) this.values[i]=0;
  }

  public add(n: number){
    this.values[this.writePointer]=n;
  }
}

/** va devolviendo la media de los ultimos numDatas values, por */
export class MediumWindow{
  values: number[];
  numData=0;
  pointer=0;
  total=0;
  medium=0;


  constructor(public numDatas: number){
    if(numDatas<=0) throw new Error('Invalid lenght');
    this.values=new Array<number>(numDatas);
    for(let i=0; i<numDatas; i++) this.values[i]=0;
  }

  public add(n: number): number{
    const old=this.values[this.pointer];
    this.total-=old;
    this.total+=n;
    this.medium=this.total/this.values.length;
    this.values[this.pointer]=n;
    this.pointer++;
    if(this.pointer>=this.values.length) this.pointer=0;
    return this.medium;
  }

  public getMedium(){ return this.medium; }

}

/** va calculando la primera y segunda derivada sobre la marcha, para 
 * valores monoespaciados (dX=1)
 */
export class DerivatedWindow{
  d0=0;
  d1=0;
  d2=0;
  public velocity=0;
  public acceleration=0;

  public add(n: number){
    this.d2=this.d1;
    this.d1=this.d0;
    this.d0=n;
    const dif1=this.d0-this.d1;
    const dif2=this.d1-this.d2;
    this.acceleration=dif1-dif2;
    this.velocity=this.d0-this.d1;
  }

}
