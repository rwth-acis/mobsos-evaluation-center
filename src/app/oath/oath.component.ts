import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-oath',
  templateUrl: './oath.component.html',
  styleUrls: ['./oath.component.scss'],
})
export class OathComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        mergeMap((params: { code: string }) => {
          console.log(params);
          const url = 'https://github.com/login/oauth/access_token';
          return params.code
            ? this.http.post(url, {
                client_id: environment.githubClientId,
                client_secret: environment.githubClientSecret,
                code: params.code,
              })
            : of(undefined);
        }),
        filter((res) => !!res),
      )
      .subscribe((res) => {
        console.log(res);
      });
  }
}
