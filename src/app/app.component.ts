import {Component} from '@angular/core';
import {IHuman, IHumanOpt, Human, HumanFactory} from './su-vir/ihuman';
import {Rectangle} from './su-vir/kd-tree';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'covid19';
  humans: Human[];

  public test1() {
    const a: IHuman = {id: 3};
  }

  public setup() {
    const opt: IHumanOpt={
      zone : new Rectangle(0,100,0,100)
    };

    this.humans=HumanFactory.create(100, opt);

  }
}
