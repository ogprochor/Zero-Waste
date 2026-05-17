import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout';
import { Home } from './pages/home/home';
import { FeaturesPageComponent } from './pages/features-page/features-page';
import { EducationPageComponent } from './pages/education-page/education-page';
import { OrganizationsPageComponent } from './pages/organizations-page/organizations-page';
import { ListPageComponent } from './features/list-page/list-page';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password';
import { SocialCallbackComponent } from './features/auth/social-callback/social-callback';
import { OfferDetailsComponent } from './features/offer-details/offer-details';
import { AddOfferComponent } from './features/add-offer/add-offer';
import { EditOfferComponent } from './features/edit-offer/edit-offer';
import { MyOffersComponent } from './features/my-offers/my-offers';
import { ProfileEditComponent } from './features/profile-edit/profile-edit';
import { ProfileComponent } from './features/profile/profile';
import { PublicProfileComponent } from './features/public-profile/public-profile';
import { MessagesComponent } from './features/messages/messages';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'auth/social-callback', component: SocialCallbackComponent },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },

      { path: 'features', component: FeaturesPageComponent },
      { path: 'funkcje', component: FeaturesPageComponent },

      { path: 'education', component: EducationPageComponent },
      { path: 'edukacja', component: EducationPageComponent },

      { path: 'organizations', component: OrganizationsPageComponent },
      { path: 'organizacje', component: OrganizationsPageComponent },

      { path: 'lista', component: ListPageComponent },
      { path: 'offers/:id', component: OfferDetailsComponent },
      { path: 'offers/:id/edit', component: EditOfferComponent, canActivate: [authGuard] },
      { path: 'dodaj-oferte', component: AddOfferComponent, canActivate: [authGuard] },
      { path: 'profil/edytuj', component: ProfileEditComponent, canActivate: [authGuard] },
      { path: 'profil', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'profil/:id', component: PublicProfileComponent },
      { path: 'my-offers', component: MyOffersComponent, canActivate: [authGuard] },
      { path: 'wiadomosci', component: MessagesComponent, canActivate: [authGuard] },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog').then(m => m.BlogComponent)
      }
    ],
  },

  { path: '**', redirectTo: '' },
];