# harrier-cc

Hotel front management system for handling multiple restaurants. A REST api with redis backend to support data persistence.

## Building from code

-   After cloning the git repo, to run the api
```
$ npm install && npm run apidoc && npm start
```

To populate the defaults, run [http://localhost:3000/admin/loadDefaults]. All the endpoints can be directly tested from [http://localhost:3000]

## Assumptions
-   redis-server to be running in localhost on default port
-   Defaults
    -   Restaurants - 2
    -   Waiters -   8
    -   Tables  -   20 in each restaurant

However restaurant, waiters, tables can be dynamically added/modified using api.


 