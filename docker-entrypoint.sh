#!/bin/bash
sed -i "s|https://cloud10.dbis.rwth-aachen.de:8084|${BOOTSTRAP}|" /app/mobsos-evaluation-center/src/environments/environment.prod.ts
sed -i "s|cloud10.dbis.rwth-aachen.de:8089|${Y_WEBSOCKET}|" /app/mobsos-evaluation-center/src/environments/environment.prod.ts
sed -i "s|f8622260-875b-499a-82db-db55f89f9deb|${OIDC_CLIENT_ID}|" /app/mobsos-evaluation-center/src/environments/environment.prod.ts
ng serve --host --prod=true 0.0.0.0