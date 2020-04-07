import {Component, OnInit} from '@angular/core';
import {IHumanOpt, Human, HumanFactory, IInfectionOptions, HStatus, getSuccess} from './su-vir/ihuman';
import {Rectangle, Point, IDataPoint, KdTree, INodeKdTree, IPosition} from './su-vir/kd-tree';
import * as p5 from 'p5';
import * as Chart from 'chart.js';
import {MediumWindow} from './su-vir/utils';

/**
 *  Para construir la publicación  ng build --prod --output-path docs --base-href /Propagation/
 */


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
  mediumDistance=0;
  sqrDistanceBase: number;
  R0Medium=new MediumWindow(4);

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
  public inmunes=0;
  public R0 = 0;
  public initialInmunes=0;
  public infectOp: IInfectionOptions = {
    distanceBase: 2,
    contagiousProb: 0.8,
    humanData: {
      incubation: {mean: 3, stdDev: 1.2},
      sintomatic: 0.5,
      infectionPeriod: {mean: 12, stdDev: 4},
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
    (this.chart.data.datasets[0].data as Chart.ChartPoint[]).length=0;
    // indicamos los n primeros como inmunes
    const nInmunes=Math.trunc(this.initialInmunes*this.populationNumber);
    for(let i=0;i<nInmunes;i++) hs[i].inmunize();
    const r = this.baseKd.root;
    // Infectamos los 3 primeros
    inf(r);
    inf(r.left);
    inf(r.right);
    this.chart.clear();
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
    setTimeout(()=>this.setupHumans(), 1000);
  }


  /** Pintado que se ejecuta cuando se hace el redraw() */
  protected draw() {
    this.canvasP5.background(250);
    this.drawHumans();
    const maxDist = this.infectOp.contagiousProb* 5 * this.infectOp.distanceBase;// Fuera de aquí lo despreciamos
    // this.canvasP5.rect(100, 100, maxDist * 2, maxDist * 2);
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
    if (!h.hstatus) return [211, 211, 211, 255];
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
    // Los que son infecciosos
    const contagiosous= this.humans.filter( e => e.data.hstatus & HStatus.infectious);
    // Los que serán infectados
    const nuevosContagiados=contagiosous.reduce( (acc: Human[], element) => {
      const prov = this.checkInfection(element);
      if(prov && prov.length > 0){
        const prov2=prov.filter((hh)=>acc.indexOf(hh)<0); // Filtramos duplicados
        acc=acc.concat(prov2) ;
      }
      return acc;
    }, []);
    // Ya tenemos la cuenta de nuevos infectados y la lista de contagiosos.
    // Como usamos medias, directamente culpamos al primero de los contagiosos de los nuevos contagiados (no nos importa el detalle)
    if(contagiosous.length>0) contagiosous[0].data.howManyInfect+=nuevosContagiados.length;
    // Obtenemos la cuenta de a cuantos contagiaron los contagiosos hasta ahora
    const infectaron=contagiosous.reduce((acc, element)=> acc+=element.data.howManyInfect, 0);
    this.R0= this.R0Medium.add(contagiosous.length>0 ? infectaron/contagiosous.length : 0);
    // Cambiamos el estado a los nuevos contagiados
    nuevosContagiados.forEach((el)=>el.infect(this.currentDay, this.infectOp.humanData));
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
    this.afectados = totalAfectados-Math.trunc(this.initialInmunes*this.populationNumber);
    this.inmunes=totalInmunes;
  }

  /** Obtiene la lista de nuevos infectados. NO los infecta */
  protected checkInfection(fromHuman: IHumanPoint): Human[] {
    let res: Human[] = null;
    const maxDist = this.infectOp.contagiousProb* 5 * this.infectOp.distanceBase;// Fuera de aquí lo despreciamos
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
            label: '% Infectados',
            yAxisID:'I',
            borderColor: '#FF0000',
            data: [] as Chart.ChartPoint[],
            fill: false
          },
          {
            label: '% afectados',
            yAxisID:'D',
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
              display: true,
              ticks:{
                suggestedMax:100
              }
            }
          ],
          yAxes: [
            {
              id: 'I',
              type: 'linear',
              position: 'left',
              display: true,
              scaleLabel:{
                display:true,
                labelString:'% infectatos'
              }
            },{
              id: 'D',
              type: 'linear',
              position: 'right',
              display: true,
              ticks: {
                max: 100,
                min: 0
              }
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
    const nsam2 = {x: this.currentDay, y: 100 * this.afectados / this.populationNumber};
    (this.chart.data.datasets[1].data as Chart.ChartPoint[]).push(nsam2);
    this.chart.update();
  }

  /** Repite los nodos cercanos a un limite en el kdTree, para que se puedan encontrar en el contrario */
  protected mirrorSpace(){
    
  }


}
