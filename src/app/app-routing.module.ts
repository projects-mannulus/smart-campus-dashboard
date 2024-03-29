import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { AuthenticationGuard } from '@core/auth/guards/authentication.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: LayoutComponent,
    children: [
      {
        path: 'template',
        title: 'Creador Plantilla',
        canActivate: [AuthenticationGuard],
        loadChildren: () =>
          import(
            './dashboard/template-generator/template-generator.module'
          ).then((m) => m.TemplateGeneratorModule),
      },
      {
        path: 'home',
        title: 'Dashboard Home',
        loadChildren: () =>
          import('./dashboard/home/home.module').then((m) => m.HomeModule),
      },
      {
        path: 'panel-control',
        canActivate: [AuthenticationGuard],
        loadChildren: () =>
          import('./dashboard/dashboard-grid/dashboard-grid.module').then(
            (m) => m.DashboardGridModule,
          ),
      },
      {
        path: '**',
        redirectTo: 'home',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
