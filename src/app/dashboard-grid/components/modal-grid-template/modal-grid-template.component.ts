import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { TemplateService } from 'src/app/libs/graficas/services/template.service';
import { AuthService } from 'src/app/core/auth/services/auth.service';
import { DeviceService } from 'src/app/core/services/device.service';
import { TemplateDTO } from 'src/app/core/models/template.dto';
import { FormGridTemplate } from '../../models/form-grid-template';
import { MatSelectCompleteComponent } from 'src/app/libs/material/mat-select-complete/mat-select-complete.component';
import * as moment from 'moment';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { CUSTOM_NGX_DATE_TIME_FORMATS } from 'src/app/libs/material/providers/date-time-picker';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { NgxMatDatetimePicker } from '@angular-material-components/datetime-picker';
import { DeviceDTO } from 'src/app/core/models/device';
import { relationTypeGraph } from 'src/app/libs/graficas/config/apexchart.type';

@Component({
  selector: 'app-modal-grid-template',
  templateUrl: './modal-grid-template.component.html',
  styleUrls: ['./modal-grid-template.component.scss'],
  providers: [],
})
export class ModalGridTemplateComponent implements OnInit {
  form: FormGroup;

  listTemplates$: Observable<TemplateDTO[]> = of([]);
  listDevices$: Observable<any[]> = of([]);

  today = moment().format('YYYY-MM-DD HH:mm:ss');

  /**
   * detalles del dispositivo que se escogio.
   */
  detailsDevice: any;

  templateIco: string = null;

  @ViewChild('matSelectTemplate') matSelectTemplate: MatSelectCompleteComponent;

  @ViewChild('matSelectDevice') matSelectDevice: MatSelectCompleteComponent;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      editMode?: boolean;
      form: FormGridTemplate;
    },
    private templateService: TemplateService,
    private deviceService: DeviceService,
    private AuthService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: new FormControl('', Validators.required),
      idTemplate: new FormControl('', Validators.required),
      idDevice: new FormControl('', Validators.required),
      realtime: new FormControl('0'),
      initialDate: new FormControl('', Validators.required),
      endDate: new FormControl('', Validators.required),
    });

    this.form.controls.realtime.valueChanges.subscribe((data) => {
      if (data == '1') {
        this.form.controls.endDate.reset();
        this.form.controls.endDate.clearValidators();
        this.form.controls.endDate.disable();
      } else {
        this.form.controls.endDate.setValidators(Validators.required);
        this.form.controls.endDate.enable();
      }
    });

    //lista de templates
    this.listTemplates$ = this.templateService.getAllTamplates();

    //lista de gateways
    this.listDevices$ = this.deviceService.getDevices();

    //si se esta editando
    if (this.data.editMode) {
      this.form.patchValue(this.data.form);
      console.log(this.data.form.name);
      setTimeout(() => {
        this.matSelectTemplate?.updateDataList(this.data.form.idTemplate);
        this.matSelectDevice?.updateDataList(this.data.form.idDevice);
      }, 1);
    }
  }

  selectTemplate(template: TemplateDTO) {
    this.form.controls.idTemplate.setValue(template.id);
    console.log("select template", template)
    this.templateIco = relationTypeGraph.find(t=> t.type === template.json['chart.type']).img;
  }

  selectDevice(device: DeviceDTO) {
    this.detailsDevice = device?.description;
  }


  limpiarFormulario() {
    this.form.reset();
  }
}
