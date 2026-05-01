import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, CurrentUser } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-social-callback',
  standalone: true,
  template: `<p style="padding:24px;">Logowanie...</p>`
})
export class SocialCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;

    const error = qp.get('error');
    if (error) {
      this.notificationService.error(error);
      this.router.navigate(['/login']);
      return;
    }

    const token = qp.get('token');
    const id = qp.get('id');
    const username = qp.get('username');
    const email = qp.get('email');

    if (!token || !id || !username || !email) {
      this.notificationService.error('Nie udało się zalogować przez Google. Brakuje danych logowania.');
      this.router.navigate(['/login']);
      return;
    }

    const user: CurrentUser = {
      id: Number(id),
      username,
      email
    };

    this.authService.setSession(token, user);
    this.notificationService.success('Zalogowano pomyślnie!');
    this.router.navigate(['/']);
  }
}