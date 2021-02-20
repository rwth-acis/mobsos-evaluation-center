#!/bin/bash
sed -i "s|http://localhost:9011|${BOOTSTRAP}|" /app/src/environments/environment.prod.ts
sed -i "s|localhost:8089|${Y_WEBSOCKET}|" /app/src/environments/environment.prod.ts
sed -i "s|f8622260-875b-499a-82db-db55f89f9deb|${OIDC_CLIENT_ID}|" /app/src/environments/environment.prod.ts
ng serve --host 0.0.0.0 --prod=true 