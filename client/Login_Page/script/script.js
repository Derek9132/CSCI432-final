const server = "http://localhost:8080";

// Get the current directory name (with ESM)

// Construct the path to the JSON file
// const filePath = "../source/users.json";

// Function to read JSON data from file
// const readJsonFile = async (filePath) => {
//     try {
//         const data = await fs.readFile(filePath, 'utf8');
//         return JSON.parse(data);
//     } catch (err) {
//         throw err;
//     }
// };

/** NOTES AND TIPS **/

// Use headers and body in fetch only for POST and PUT
// default method for fetch is GET
// For DELETE, only need to specify the method (method: DELETE)
// Use response code sent from server to make conditionals
// Use console.log often to see how the data has been received from server

if (window.location.pathname.includes("index.html")) {
    // Code specific to index.html
    const loginButton = document.querySelector("#login_btn");
    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const response = await fetch(`${server}/api/login`, { 
            method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: document.getElementById("username").value,
                        password: document.getElementById("password").value
                    })
                });
            // alert(document.getElementById("username").value);
            console.log(response.ok);
            if (response.ok) {
                // redirect to home page with user info
                console.log("Login successful");
                const currentUser = await response.json();
                console.log(JSON.stringify(currentUser));
                sessionStorage.setItem("userInfo", JSON.stringify(currentUser));

                window.location.href = "../../index.html";
                //window.location.replace("http://127.0.0.1:5500/client/index.html");

            }

             else {
                var errorCode = document.createElement("p");
                errorCode.textContent = "The user is not found or the password is incorrect. Please try again.";
                errorCode.style.color = "red";

                document.getElementById("loginForm").appendChild(errorCode);
          }

        });
    }
    //         // console.log(presetPassword);
    //         // event.preventDefault();
    //         // const enteredUsername = document.querySelector("#username").value;
    //         // const enteredPassword = document.querySelector("#password").value;
    //         /*const response = await fetch(`${server}/login`, {
    //             method: "POST",
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             username: `${document.getElementById("username").value}`,
    //             password: `${document.getElementById("password").value}`
    //         });
        
    //         if (response.ok) {
    //             // redirect to home page with user info

    //         }
    //         else {
    //             var errorCode = document.createElement("p");
    //             errorCode.textContent = "The user is not found or the password is incorrect. Please try again.";
    //             errorCode.style.color = "red";

    //             document.getElementById("loginForm").appendChild(errorCode);
    //         }*/
            

    //         // if (checkUsers(filePath, enteredUsername, enteredPassword)) {
    //         //     alert("Accepted");
    //         // } else {
    //         //     alert("Invalid username or password");
    //         // }
    //     });
    // }




} else if (window.location.pathname.includes("register.html")) {
    // Code specific to register.html
    const registerButton = document.querySelector("#sign_up_btn");
    if (registerButton) {
        registerButton.addEventListener('click', () => {
            alert("Register button has been clicked");
        });
    }
} else if (window.location.pathname.includes("forgot_password.html")) {
    const passwordButton = document.querySelector("#password_btn");
    if (passwordButton) {
        passwordButton.addEventListener('click', () => {
            alert("Password button has been clicked");
        });
    }
}

function showPassword() {
    var x = document.getElementById("password");
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

function showPassword_1() {
    var x = document.getElementById("password");
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}
