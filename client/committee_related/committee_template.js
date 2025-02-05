const server = "http://localhost:8080";

async function loadCommitteeDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const committeeKey = urlParams.get("committeeKey");

    console.log(committeeKey);

    // request committee name, creator, chairman from server: committee_info
    const committeeInfo = await fetch(`${server}/api/committee/${committeeKey}`);

    if (committeeInfo.ok) {
        const parsedInfo = await committeeInfo.json();

        //console.log(parsedInfo.committeeAtKey[0].committeeName);

        // display info
        document.getElementById("committeeTitle").textContent = `${parsedInfo.committeeAtKey[0].committeeName}`;
        document.getElementById("votesToPass").textContent = `Votes needed to pass: ${parsedInfo.committeeAtKey[0].votes_to_pass}`;

        // store in session storage
        sessionStorage.setItem("committeeInfo", JSON.stringify(parsedInfo));
        //console.log("session storage from template.js", sessionStorage);
    }
    else {
        // failed to fetch committee info
        console.log("failed to fetch committee info");
    }

    // request members of committee from server: user_committee_junction
    const committeeMembers = await fetch(`${server}/api/committee/${committeeKey}/users`);

    if (committeeMembers.ok) {
        const parsedMembers = await committeeMembers.json();

        // display members

    }
    else {
        console.log("failed to fetch committee members");
    }
    
}



/*const upvoteButtons = document.querySelectorAll(".upvoteButton");
console.log(upvoteButtons.length);

for (let i = 0; i < upvoteButtons.length; i++) {
    upvoteButtons[i].addEventListener("click", async () => {
      console.log("upvoted");
    })
}*/

loadCommitteeDetails();