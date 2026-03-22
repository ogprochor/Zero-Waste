import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout';
import { Home } from './pages/home/home';
import { ListPageComponent } from './features/list-page/list-page';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { OfferDetailsComponent } from './features/offer-details/offer-details';
import { AddOfferComponent } from './features/add-offer/add-offer';
import { EditOfferComponent } from './features/edit-offer/edit-offer';
import { MyOffersComponent } from './features/my-offers/my-offers';
import { ProfileEditComponent } from './features/profile-edit/profile-edit';
import { ProfileComponent } from './features/profile/profile';
import { authGuard } from './guards/auth.guard';


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
      { path: 'offers/:id/edit', component: EditOfferComponent, canActivate: [authGuard] },
      { path: 'dodaj-oferte', component: AddOfferComponent, canActivate: [authGuard] },
      { path: 'profil/edytuj', component: ProfileEditComponent, canActivate: [authGuard] },
      { path: 'profil', component: ProfileComponent, canActivate: [authGuard] },
      
    ],
  },

  { path: '**', redirectTo: '' },
];