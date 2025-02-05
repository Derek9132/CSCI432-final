const server = "http://localhost:8080";

const registerButton = document.getElementById("sign_up_btn");

registerButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("username", document.getElementById("username").value);
    formData.append("password", document.getElementById("password").value);
    formData.append("fname", document.getElementById("fname").value);
    formData.append("lname", document.getElementById("lname").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("profileImage", document.getElementById("profileImage").files[0]);
    
    try {
        console.log("sending data"); 
        const response = await fetch(`${server}/api/register`, { 
            method: "POST",
            body: formData
        });
        
        if (response.ok) {
            console.log("sent and received data"); 
            window.location.replace("../src/index.html"); // redirect to login
            //window.location.replace("http://127.0.0.1:5500/client/Login_page/src/index.html");
        }
        else {
            var errorCode = document.createElement("p");
            errorCode.textContent = "Registration Failed. Please Try Again";
            errorCode.style.color = "red";

            document.getElementById("registrationForm").appendChild(errorCode);
        }
    }
    catch (err) {
        console.log("Could not send data to server"); // prints
    }
});