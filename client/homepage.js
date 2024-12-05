

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(sessionStorage.getItem("userInfo"));

    if (user) {
        document.getElementById("dashboardRedirect").disabled = false;
        document.getElementById("dashboardRedirect").textContent = `${user.userData.fname} ${user.userData.lname}'s Dashboard`;

        document.getElementById("loginButton").textContent = "Log out";
        const registerButton = document.getElementById("registerButton");
        if (registerButton) {
            registerButton.parentNode.removeChild(registerButton);
        }

        console.log(user.userData);
        document.getElementById("profileImage").setAttribute("src",`..\\server\\${user.userData.pfp}`);
    }
});

document.getElementById("loginButton").addEventListener("click", (event) => {
    if (event.target.textContent == "Login") {
        window.location.replace("Login_Page/src/index.html");
    }
    else {
        sessionStorage.removeItem("userInfo");
        window.location.reload();
    }
});

document.getElementById("registerButton").addEventListener("click", (event) => {
    window.location.href = "Login_Page/src/register.html";
});

document.getElementById("dashboardRedirect").addEventListener("click", (event) => {
    window.location.href = "Dashboard/dashboard.html";
});


