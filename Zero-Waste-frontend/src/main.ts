import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,                
    provideRouter(routes),                
    importProvidersFrom(HttpClientModule)  
  ]
})
.catch(err => console.error(err));
