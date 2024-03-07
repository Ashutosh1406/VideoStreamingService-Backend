# backend project

MODELLING DIAGRAM : https://app.eraser.io/workspace/ZjX8UZ1YKpgn45X9HQuY

ALL THE NAMING CONVENTIONS ARE UP TO THE PRODUCTION STANDARDS AND USE BEST PRACTICES FOR MANAGING THE FUNCTIONALITIES OF THE APPLICATION

CONFIG:
1) Clone the repository using the git clone command or download the zip file of the code
2) Use **npm install** command in your workspace terminal to install all the dependencies of the project
3) The **entry** point of the backend project is "src/index.js"
4) Type **"npm run dev"** command inside the project folder and the server will be started at PORT:8006 on your machine . Press (CTRL+C) to stop the Server
5) Create a .env (-dotenv package already installed as a dependency) -> Requirement memtioned in below steps.
6) This Project uses MongoDB as DB and require a MongoDB URI connection string for using the application. GOTO: "MONGO DB ATLAS homepage" 
7) This project stores the images in **Cloudinary** . Use Cloudinary free acoount to use Cloudinary SDK.
8) Download **Postman** or use **Postman's Extension** in VSCODE for hitting the Endpoints of the Application.
9) **REMEMBER** from steps 5,6,7 gather all the resources and put them inside a .env file.
10) Now all the SETUP has been finished!! 👾🎃

Take a deep breath and you are good to GO!

OPEN POSTMAN and follow the steps carefully:

**USE APPROPRIATE METHODS IN POSTMAN FOR TESTING** (get,post)

FUNCTIONALITIES:)

To Register User : 
- Route is: http://localhost:8006/api/v1/users/register

To Login User : (after registering) else error would be thrown
- Route is: http://localhost:8006/api/v1/users/login

**ACCESS TOKEN AND REFRESH TOKEN WOULD BE GENERATED AFTER LOGGING IN using JWT**.
**ACCESS-TOKEN WOULD BE SENT AS COOKIES TO THE AUTHENTICATION HEADER(AH) see postman console after logging in**
**REFRESH-TOKEN WOULD BE SENT TO DB AND HAS MORE VALIDITY in days**

To Logout User (logged-in user can only logout): 
- Route is: http://localhost:8006/api/v1/users/logout





