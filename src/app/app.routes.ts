import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout';
import { Home } from './pages/home/home';
import { ListPageComponent } from './features/list-page/list-page';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'lista', component: ListPageComponent }
    ]
  }
];
