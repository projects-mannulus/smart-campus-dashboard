import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl } from '@angular/forms';

@Component({
  selector: 'app-list-colors',
  templateUrl: './list-colors.component.html',
  styleUrls: ['./list-colors.component.scss'],
})
export class ListColorsComponent implements OnInit {
  @Input() control: FormArray;

  /**
   * label del control.
   */
  @Input() label: string;

  /**
   * determina si se esta en modo de eliminacion de colores.
   */
  isDelete = false;

  draw: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.control.valueChanges.subscribe((value) => {
      this.draw = false;
      this.cdr.detectChanges();
      this.draw = true;
    });
  }

  addColor() {
    this.control.push(new FormControl('#0000'));
  }

  onChangeColor(color, i) {
    let colors = this.control.value;
    colors[i] = color;
    this.control.patchValue(colors);
    this.draw = false;
    this.cdr.detectChanges();
    this.draw = true;
    //TODO: ver como hacer para que se actualice el color en los controles.
  }

  deleteMode() {
    this.isDelete = !this.isDelete;
  }

  deleteColor(i) {
    this.control.removeAt(i);
  }

  onOpenColorPicker($event, i) {
    console.log('open', $event, i);
  }
}
