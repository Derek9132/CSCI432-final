const server = "http://localhost:8080";

document.getElementById("submitLogin").addEventListener("click", async function() {
    const response = await fetch(`${server}/login`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        username: `${document.getElementById("usernameLogin").value}`,
        password: `${document.getElementById("passwordLogin").value}`
    });

    if (response.ok) {
        
    }
    else {

    }
});

document.getElementById("submitRegister").addEventListener("click", async function() {
    const response = await fetch(`${server}/register`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: `${document.getElementById("usernameRegister").value}`,
            password: `${document.getElementById("passwordRegister").value}`
        })
    });

    if (response.ok) {
        const para = document.createElement("p");
        para.textContent = "success";
        document.getElementById("register").appendChild(para);
    }
    else {
        const para = document.createElement("p");
        para.textContent = 'failed';
        document.getElementById("register").appendChild(para);
    }

    document.getElementById("usernameRegister").value = "";
    document.getElementById("passwordRegister").value = "";
});

