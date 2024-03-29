import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  GridsterItem,
  GridsterItemComponentInterface,
} from 'angular-gridster2';
import { ChartComponent } from 'ng-apexcharts';
import { DialogService } from 'src/app/core/dialog/services/dialog.service';
import { ModalConfirmService } from 'src/app/core/modal-confirm/services/modal-confirm.service';
import { DataService } from 'src/app/core/services/data-device.service';
import { ChartOptions } from '@shared/graficas/config/apexchart.type';
import { TemplateService } from '@shared/graficas/services/template.service';
import _ from 'underscore';
import {
  EventGridRemoveItem,
  EventGridSaveItem,
} from '../../models/events.model';
import { FormGridTemplate } from '../../models/form-grid-template';
import { ModalGridTemplateComponent } from '../modal-grid-template/modal-grid-template.component';
import {
  bufferTime, filter,
  forkJoin,
  map
} from 'rxjs';
import { BrokerService } from 'src/app/core/services/broker.service';

@Component({
  selector: 'app-dashbaord-grid-item',
  templateUrl: './dashbaord-grid-item.component.html',
  styleUrls: ['./dashbaord-grid-item.component.scss'],
})
export class DashbaordGridItemComponent implements OnInit {
  @Input() item: GridsterItem;

  @Input() index: number;

  @Input()
  set gridsterItem(item: GridsterItemComponentInterface) {
    if (item) {
      this._gridsterItem = item;
      this.heightParent = item?.height;
      //this.widthParent = value?.width;
      this.updateHeightForChart();
      item.itemChanged = () => {
        // console.log('itemChanged', this._gridsterItem?.height, this.item);
        // this.heightParent = this._gridsterItem?.height;
        this.heightParent = this._gridsterItem?.height;
        this.updateHeightForChart();
      };
      // value.checkItemChanges = () => {
      //   // console.log('checkItemChanges', this._gridsterItem?.height, this.item);
      //   this.heightParent = this._gridsterItem?.height;
      //   this.updateHeightForChart();
      // };
    }
  }

  _gridsterItem: GridsterItemComponentInterface;

  /**
   * id de la plantilla que se esta usando en el grid.
   * esta se consula en la base de datos.
   */
  @Input()
  set formTemplate(value: FormGridTemplate) {
    this._formTemplate = value;
    if (value) {
      this.loadTemplate(value, false);
    }
  }

  get formTemplate() {
    return this._formTemplate;
  }

  _formTemplate: FormGridTemplate;

  @Output() remove: EventEmitter<EventGridRemoveItem> = new EventEmitter();

  @Output() save: EventEmitter<EventGridSaveItem> = new EventEmitter();

  @ViewChild('chart') chart: ChartComponent;

  chartOptions: ChartOptions = null;

  /**
   * si existe una grafica.
   */
  get isChart(): boolean {
    return this.chartOptions != null;
  }

  /**
   * altura del elemento padre (grister-item)
   */
  heightParent: number = 0;

  /**
   * altura del elemento hijo (chart)s
   */
  get heightChild() {
    return String(this.heightParent - this.offsetY * 2) + 'px';
  }
  /**
   * pixeles de margen superior e inferior del elemento hijo (chart)
   */
  offsetY: number = 16;

  //========================================== ANIMATIONS =====================================================

  /**
   * determina si el elemento esta en el proceso de eliminacion. (animacion de eliminacion)
   */
  isRemoving: boolean = false;

  isLoading: boolean = false;

  _isDarkTheme: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private modalService: DialogService,
    private templateService: TemplateService,
    private dataService: DataService,
    private confirmService: ModalConfirmService,
    private brokerService: BrokerService,
  ) {}

  resizeTimer: any;
  resizeTimeout: number = 350;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    //APARENTEMENTE FUNCIONA
    clearTimeout(this.resizeTimer); // Limpiar el temporizador previo
    this.resizeTimer = setTimeout(
      () => this.updateHeightForChart(),
      this.resizeTimeout,
    );
  }

  ngOnInit(): void {}

  updateHeightForChart() {
    if (this.chartOptions) {
      this.chartOptions.chart.height = this.heightChild;
      if (this.chart) {
        this.chart?.updateOptions(this.chartOptions, true);
      }
    }
  }

  /**
   * accion al presionar el boton de eliminar.
   * En caso de ser una grilla que no tiene plantilla, se elimina directamente.
   * @param $event
   */
  removeItem($event: Event) {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.formTemplate == null) {
      this.actionEliminar($event);
      return;
    }
    this.confirmService
      .show({
        title: 'Eliminar',
        content: '¿Esta seguro que desea eliminar el elemento?',
        actions: {
          primary: 'Eliminar',
          secondary: 'Cancelar',
        },
      })
      .then((action) => {
        if (action) {
          this.actionEliminar($event);
        }
      });
  }

  /**
   * accion de eliminar el elemento.
   * @param $event
   */
  actionEliminar($event) {
    this.isRemoving = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      let event: EventGridRemoveItem = {
        event$: $event,
        item: this.item,
        i: this.index,
      };
      this.remove.emit(event);
    }, 250);
  }

  modalDataTemplate(edit: boolean) {
    console.log('modalDataTemplate', this.formTemplate);
    this.modalService
      .show({
        title: edit ? 'Editar Plantilla' : 'Agregar Plantilla',
        component: ModalGridTemplateComponent,
        dataComponent: { editMode: edit, form: this.formTemplate },
        maxWidth: '800px',
      })
      .subscribe((data) => {
        if (data.estado) {
          this.save.emit({
            index: this.index,
            formTemplate: _.clone(data.data),
          });
          this.modalService.close();
        }
      });
  }

  /**
   * carga la plantilla de la grafica con la data.
   * @param form fomulario de la plantilla y la configuracion de la grafica.
   * @param emitSaveEvent si emite el evento de guardar.
   */
  loadTemplate(form: FormGridTemplate, emitSaveEvent: boolean) {
    this.isLoading = true;
    forkJoin([
      this.templateService.getTemplateById(form.idTemplate),
      this.dataService.getDataByUUID(
        form.idDevice,
        form.initialDate,
        form.endDate,
      ),
    ]).subscribe(([template, dataDevice]) => {
      this.chartOptions = this.templateService.formToChartOptions(
        template.json,
      );
      //establece el alto de la grafica
      this.chartOptions.chart.height = this.heightChild;
      //asigna la data a la grafica
      this.templateService.dataToSeries(dataDevice, this.chartOptions);

      if (emitSaveEvent) {
        this.save.emit({
          index: this.index,
          formTemplate: _.clone(form),
        });
      }
      this.isLoading = false;
      if (this.formTemplate.realtime == '1') {
        this.getRealtimeData();
      }
    });
  }

  /**
   * se suscribe al topic del broker para obtener los datos en tiempo real.
   */
  getRealtimeData() {
    this.dataService
      .subcribeToDataDevice(this.formTemplate.idDevice)
      .subscribe((data) => {
        console.info(`SUBCRIBE TO TOPIC ${data.topic}`);
        //se conectar al broker en el topic que le indica el servidor, y espera un minuto cada que llega un nuevo dato, antes
        //de mostrarlo en la grafica.
        this.brokerService.subscribe(data.topic)
          .pipe(
            map((data) => JSON.parse(data.payload.toString())),
            bufferTime(1000),
            filter((mensaje) => mensaje && mensaje.length > 0),
          )
          .subscribe(async (messageData) => {
            //TODO: al estar la grafica vacia y cargar datos NO se muestra correctamente el timestep, solo si se recarga la grafica
            this.templateService.dataToSeries(
              messageData,
              this.chartOptions,
              true,
            );
            this.chart.updateSeries(this.chartOptions.series, false);
          });
      });
  }
}
