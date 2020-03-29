import {Component, OnInit} from '@angular/core';
import {IHumanOpt, Human, HumanFactory, IInfectionOptions, HStatus, getSuccess} from './su-vir/ihuman';
import {Rectangle, Point, IDataPoint, KdTree, INodeKdTree, IPosition} from './su-vir/kd-tree';
import * as p5 from 'p5';
// import {Chart} from 'chart.js';
import * as Chart from 'chart.js';


interface IHumanPoint extends IDataPoint {
  data: Human;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly populationNumber = 16000;
  private canvasP5: p5;
  title = 'covid19';
  humans: IHumanPoint[];
  baseKd: KdTree;
  currentDay = 0;
  mediumDistance: number;
  sqrDistanceBase: number;

  public chart: Chart = null;
  /** Elementos infecciosos */
  public infecciosos = 0;
  /** infectados y no curados o muertos */
  public infectados = 0;
  /** recuperados vivos */
  public recuperadosVivos = 0;
  public death = 0;
  /**  */
  public afectados = 1;
  public newInfecteds = 0;
  public R0 = 0;
  public infectOp: IInfectionOptions = {
    distanceBase: 2,
    contagiousProb: 0.8,
    humanData: {
      incubation: {mean: 3, stdDev: 1.0},
      sintomatic: 0.5,
      infectionPeriod: {mean: 10, stdDev: 4},
      lethality: 0.03
    }
  };

  public setistanceBase(n: number) {
    this.infectOp.distanceBase = n;
    this.sqrDistanceBase = this.infectOp.distanceBase ** 2;
  }

  public setupHumans() {
    const inf = (n: INodeKdTree) => {
      (n.location.data as Human).infect(0, this.infectOp.humanData);
    };
    const opt: IHumanOpt = {
      zone: new Rectangle(0, 800, 0, 400)
    };
    this.currentDay = 0;
    this.sqrDistanceBase = this.infectOp.distanceBase ** 2;
    this.mediumDistance = Math.sqrt(opt.zone.area() / this.populationNumber);
    const hs = HumanFactory.create(this.populationNumber, opt); // HumanFactory.createTest();
    this.humans = hs.map((h) => ({data: h, point: h.position}));
    this.baseKd = KdTree.createFrom(this.humans);
    // this.baseKd.trace();
    const r = this.baseKd.root;
    inf(r);
    inf(r.left);
    inf(r.right);
    this.canvasP5.redraw();
  }

  public oneStep() {
    this.currentDay++;
    this.propagation();
    this.checkHealth();
    this.canvasP5.redraw();
    this.data2Chart();
  }

  public multStep(nDays) {
    for (let i = 0; i < nDays; i++) this.oneStep();
  }


  ngOnInit(): void {
    this.setupP5();
    this.initChart();
  }


  /** Pintado que se ejecuta cuando se hace el redraw() */
  protected draw() {
    this.canvasP5.background(250);
    this.drawHumans();
    const maxDist = 5 * this.infectOp.distanceBase;// Fuera de aquí lo despreciamos
    this.canvasP5.rect(100, 100, maxDist * 2, maxDist * 2);
    /* this.canvasP5.line(this.centerPos, 0, this.centerPos, 400);
    this.canvasP5.line(0, 350, 600, 350);
    this.bola.display();
    this.carro.display(); */
  }

  protected drawHumans() {
    if (!this.humans) return;
    this.canvasP5.strokeWeight(2);
    this.humans.forEach((h) => {
      const color = this.colorFromHumanStatus(h.data);
      this.canvasP5.stroke(color);
      this.canvasP5.point(h.point.x, h.point.y);
    });
  }

  protected colorFromHumanStatus(h: Human) {
    if (!h.hstatus) return [127, 127, 127, 255];
    if (h.hstatus & HStatus.infected) {
      if (h.hstatus & HStatus.infectious) return [255, 0, 0, 255];
      return [255, 153, 51, 255];
    }
    if (h.hstatus === HStatus.inmune) return [0, 255, 0, 255];
    if (h.hstatus === HStatus.death) return [10, 10, 10, 255];

    return [0, 255, 0, 255];
  }

  /** Configuracion del p5 */
  protected setupP5() {
    const sketch = (s) => {
      s.preload = () => {
        // preload code
      };
      s.setup = () => {
        const cc = s.createCanvas(800, 400);
        cc.parent('containerP5');
      };
    };
    this.canvasP5 = new p5(sketch);
    this.canvasP5.noLoop();  // Se desactiva el bucle sobre la funcion draw
    this.canvasP5.draw = () => {
      this.draw();
    };
  }

  /** Se realiza la propagación */
  protected propagation() {
    let newInfected: Human[] = null;
    let countInfectiosous = 0;
    // Se recorren todos los elementos, mirando los que son infecciosos
    this.humans.forEach(element => {
      if (!element.data.hstatus) return;
      if (element.data.hstatus & HStatus.infectious) {
        countInfectiosous++;
        const prov = this.checkInfection(element);
        if (prov && prov.length > 0) {
          if (!newInfected) {
            newInfected = prov;
          } else {
            newInfected = newInfected.concat(prov);
          }
        }
      }
    });
    if (newInfected && newInfected.length > 0) {
      let realNewInfected = 0;  // Cuenta de nuevos infectados (hay elementos repetidos en el array)
      newInfected.forEach((ni) => {
        if (ni.infect(this.currentDay, this.infectOp.humanData)) realNewInfected++;
        }
      );
      this.newInfecteds = realNewInfected;
    } else {
      this.newInfecteds = 0;
    }
    const mInfect = this.newInfecteds / countInfectiosous;

    // Repartimos entre todos los infecciosos los nuevos infectados, y calculamos R0
    let totalGroupHasInfectd = 0;
    for (const h of this.humans) {
      if (!(h.data.hstatus & HStatus.infectious)) continue;
      totalGroupHasInfectd += (h.data.howManyInfect += mInfect);
    }
    this.R0 = countInfectiosous ? totalGroupHasInfectd / countInfectiosous : 0;
  }

  /** Se actualiza el estado de salud de cada individuo */
  protected checkHealth() {
    let totalInfectados = 0;
    let totalInfecciosos = 0;
    let totalInmunes = 0;
    let totalSimptomatic = 0;
    let totalDeath = 0;
    let totalAfectados = 0;
    for (const human of this.humans) {
      human.data.checkStatus(this.currentDay, this.infectOp.humanData);
      const hstatus = human.data.hstatus;
      if (!hstatus) continue;
      totalAfectados++;
      if (hstatus & HStatus.infected) {
        totalInfectados++;
        if (hstatus & HStatus.infectious) {
          totalInfecciosos++;
        }
        if (hstatus & HStatus.symptomatic) totalSimptomatic++;
        continue;
      }
      if (hstatus & HStatus.inmune) {
        totalInmunes++;
        continue;
      }
      if (hstatus & HStatus.death) totalDeath++;
    }
    this.death = totalDeath;
    this.infecciosos = totalInfecciosos;
    this.afectados = totalAfectados;
  }

  /** Obtiene la lista de nuevos infectados. NO los infecta */
  protected checkInfection(fromHuman: IHumanPoint): Human[] {
    let res: Human[] = null;
    const maxDist = 5 * this.infectOp.distanceBase;// Fuera de aquí lo despreciamos
    const numProb = this.sqrDistanceBase * this.infectOp.contagiousProb;
    const zone: Rectangle = Rectangle.fromRadius(fromHuman.point, maxDist);
    const candidates = this.baseKd.getInZone(zone);
    if (!candidates || candidates.length === 0) return res;
    // Recorremos los candidatos a ver quien es infectable
    candidates.forEach((c) => {
      const h: Human = c.data as Human;
      if (h === fromHuman.data) {
        return;
      }
      if (h.hstatus) return;  // Ya tiene algo
      const dist = this.squareDist(h.position as IPosition, fromHuman.point);
      let prob: number;
      if (dist <= this.sqrDistanceBase) {
        prob = this.infectOp.contagiousProb;
      } else {
        prob = numProb / dist;
      }
      const contagiado = getSuccess(prob);
      if (contagiado) {
        if (!res) res = [];
        res.push(h);
      }
    }
    );
    return res;
  }

  protected squareDist(p1: IPosition, p2: IPosition): number {
    return (p2.x - p1.x) ** 2 + (p2.y - p1.y);
  }

  protected initChart() {
    // const ctx = document.getElementById('canvaschart') as HTMLCanvasElement;
    this.chart = new Chart('canvaschart', {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Infectados',
            borderColor: '#FF0000',
            data: [] as Chart.ChartPoint[],
            fill: false
          },
          {
            label: 'No afectados',
            borderColor: '#C0C0C0',
            data: [] as Chart.ChartPoint[],
            fill: false
          },
        ]
      },
      options: {
        legend: {
          display: true
        },
        scales: {
          xAxes: [
            {
              type: 'linear',
              display: true
            }
          ],
          yAxes: [
            {
              display: true
            }
          ]
        },
        showLines: true
      }
    });
  }

  data2Chart() {
    const nsam = {x: this.currentDay, y: 100 * this.infecciosos / this.populationNumber};
    // const p: Chart.ChartPoint[] ;
    (this.chart.data.datasets[0].data as Chart.ChartPoint[]).push(nsam);
    /* const nsam2 = {x: this.currentDay, y: 100 * this.noAfectados / this.populationNumber};
    (this.chart.data.datasets[1].data as Chart.ChartPoint[]).push(nsam2); */
    this.chart.update();
  }


}
