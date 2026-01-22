import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout';
import { Home } from './pages/home/home';
import { ListPageComponent } from './features/list-page/list-page';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { OfferDetailsComponent } from './features/offer-details/offer-details';
import { AddOfferComponent } from './features/add-offer/add-offer';
import { EditOfferComponent } from './features/edit-offer/edit-offer';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'lista', component: ListPageComponent },
      { path: 'offers/:id', component: OfferDetailsComponent },
      { path: 'offers/:id/edit', component: EditOfferComponent },
      { path: 'dodaj-oferte', component: AddOfferComponent },
    ],
  },

  // fallback (jak ktoś wpisze złą ścieżkę)
  { path: '**', redirectTo: '' },
];
