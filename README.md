# nodejs-filesystem

## How to run the server
`cd` into the node-system directory


`npm install` to install dependencies


`npm run build` to compile the javascript files


`npm run start` to start the server

## How the project is structured

`src` : Contains TypeScript source files
    
* `src/routes`: Contains backend/server code for handling routes, http requests and API stuff.
* `src/scripts`: Contains frontend/browser code. To add a script in a HTML file located in the `/views` directory, add this before `</body>`:

 `<script src="/dist/scripts/your_script.js"></script>` 


* `app.ts`: The file that is run when running the command `npm run start`.


`dist` : Contains compiled JavaScript files (will be generated after running `npm run build`). It has the same structure as `src`.


`public` : Contains CSS stylesheets, images and other assets.


`views` : Contains HTML files (pages in the application).


## `Config.json`
Contains constants that are used in the application i.e. the filesystem data, user data and port number.

To add a new file system, add the following under `filesystems`: 

```json
"filesystems": [
  { 
    "name": "file_system_1", 
    "path": "absolute_path_to_the_folder_on_your_machine"
  }
]
```

The `name` can be anything you would like to name the file system. Make sure `path` is a valid path to a folder on your machine. Do not add a `/` at the end of `path`.

To register a new user to the file system, add the following under `users`:

```json
"users": [
  {
    "username": "your_username",
    "password": "your_password",
    "permissions": [
      "file_system_1",
      "file_system_2",
      "file_system_3"
    ]
  }
]

```

Under `permissions`, add the exact `name` of the file systems defined earlier in the file, under `filesystems`.