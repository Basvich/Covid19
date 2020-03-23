import {Component, OnInit} from '@angular/core';
import {IHumanOpt, Human, HumanFactory, IInfectionOptions, HStatus, getSuccess} from './su-vir/ihuman';
import {Rectangle, Point, IDataPoint, KdTree, INodeKdTree, IPosition} from './su-vir/kd-tree';
import * as p5 from 'p5';
//import {Chart} from 'chart.js';
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

  public infectOp: IInfectionOptions = {
    distanceBase: 4,
    contagiousProb: 1,
    humanData: {
      incubation: {mean: 3, stdDev: 1.0},
      sintomatic: 0.5,
      infectionPeriod: {mean: 10, stdDev: 3},
      lethality: 0.03
    }
  };

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
    this.checkHealth();
    this.propagation();
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
    if (h.hstatus === HStatus.death) return [10, 10, 10, 255]

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
    // Se recorren todos los elementos, mirando los que son infecciosos
    this.humans.forEach(element => {
      if (!element.data.hstatus) return;
      if (element.data.hstatus & HStatus.infectious) {
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
      newInfected.forEach((ni) => ni.infect(this.currentDay, this.infectOp.humanData));
    }
  }

  /** Se actualiza el estado de salud de cada individuo */
  protected checkHealth() {
    let totalInfectados = 0;
    let totalInfecciosos = 0;
    let totalInmunes = 0;
    let totalSimptomatic = 0;
    let totalDeath = 0;
    for (const human of this.humans) {
      human.data.checkStatus(this.currentDay, this.infectOp.humanData);
      if (human.data.hstatus & HStatus.infected) {
        totalInfectados++;
        if (human.data.hstatus & HStatus.infectious) {
          totalInfecciosos++;
        }
        if (human.data.hstatus & HStatus.symptomatic) totalSimptomatic++;
        continue;
      }
      if (human.data.hstatus & HStatus.inmune) {
        totalInmunes++;
        continue;
      }
      if (human.data.hstatus & HStatus.death) totalDeath++;
    }
    this.infecciosos = totalInfecciosos;
  }

  /** Obtiene la lista de nuevos infectados */
  protected checkInfection(human: IHumanPoint): Human[] {
    let res: Human[] = null;
    const maxDist = 4 * this.infectOp.distanceBase;// Fuera de aquí
    const zone: Rectangle = Rectangle.fromRadius(human.point, maxDist);
    const candidates = this.baseKd.getInZone(zone);
    if (!candidates || candidates.length === 0) return res;
    // Recorremos los candidatos a ver quien es infectable
    candidates.forEach((c) => {
      const h: Human = c.data as Human;
      const dist = this.squareDist(h.position as IPosition, human.point);
      let prob: number;
      if (dist < this.sqrDistanceBase) {
        prob = 1;
      } else {
        prob = this.infectOp.contagiousProb / dist;
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
            label: 'test',
            // fillColor : this.getRandomColor(),
            data: [] as Chart.ChartPoint[],
            fill: false
          }
        ]
      },
      options: {
        legend: {
          display: false
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
    const nsam = {x: this.currentDay, y: this.infecciosos};
    // const p: Chart.ChartPoint[] ;
    (this.chart.data.datasets[0].data as Chart.ChartPoint[]).push(nsam);
    // (this.chart.data.datasets[0].data as ChartPoint[])
    this.chart.update();
  }


}
