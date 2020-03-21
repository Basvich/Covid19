
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
 * @param {ISImpleProcessStatus[]} arrFunc - estados
 * @param {Function} endFunc - funcion final cuando se acabe o hay error.
 * @param {*} [startData] - Datos iniciales de estado para arrancar
 * @returns {IFProccessData}
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
